import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(
	process.env.EVAL_ISOLATED_SOURCE_ROOT ?? process.argv[2] ?? process.cwd(),
);
const timestamp = new Date().toISOString().replaceAll(/[-:.]/g, "").slice(0, 15);
const runLabel = process.env.EVAL_ISOLATED_LABEL ?? `isolated-${timestamp}-${process.pid}`;
const defaultRunRoot = join(sourceRoot, ".tmp", "deep-research-current-smoke-isolated", runLabel);
const runRoot = resolve(process.env.EVAL_ISOLATED_RUN_ROOT ?? defaultRunRoot);
const worktreeRoot = resolve(
	process.env.EVAL_ISOLATED_WORKTREE ?? join(runRoot, "worktree"),
);
const outDir = resolve(process.env.EVAL_OUT_DIR ?? join(runRoot, "results"));
const dryRun = process.env.EVAL_ISOLATED_DRY_RUN === "1" || process.argv.includes("--dry-run");
const skipBuild = process.env.EVAL_ISOLATED_SKIP_BUILD === "1" || process.argv.includes("--skip-build");
const copyUntracked = process.env.EVAL_ISOLATED_COPY_UNTRACKED !== "0";
const keepWorktree = process.env.EVAL_KEEP_WORKTREE !== "0";

const sourceTop = gitOutput(sourceRoot, ["rev-parse", "--show-toplevel"]);
if (resolve(sourceTop) !== sourceRoot) {
	throw new Error(
		`source root must be the git top-level (${sourceTop}); got ${sourceRoot}`,
	);
}
if (existsSync(worktreeRoot)) {
	throw new Error(
		`isolated worktree already exists: ${worktreeRoot}. Set EVAL_ISOLATED_RUN_ROOT/EVAL_ISOLATED_WORKTREE to a new path.`,
	);
}

mkdirSync(dirname(worktreeRoot), { recursive: true });
mkdirSync(outDir, { recursive: true });
run("git", ["worktree", "add", "--detach", worktreeRoot, "HEAD"], {
	cwd: sourceRoot,
});

let metadata;
try {
	linkNodeModules(sourceRoot, worktreeRoot);
	const overlay = overlayWorkingTree(sourceRoot, worktreeRoot, { copyUntracked });
	if (!skipBuild) run("npm", ["run", "build"], { cwd: worktreeRoot });

	metadata = {
		schema: "deep-research-isolated-current-smoke-v1",
		sourceRoot,
		worktreeRoot,
		outDir,
		runLabel,
		dryRun,
		skipBuild,
		copyUntracked,
		overlay,
	};
	writeFileSync(
		join(outDir, "isolated-smoke.json"),
		`${JSON.stringify(metadata, null, 2)}\n`,
	);

	if (dryRun) {
		console.log(
			`[isolated-smoke] dry-run prepared ${worktreeRoot}; copied ${overlay.copied.length}, removed ${overlay.removed.length}`,
		);
		process.exit(0);
	}

	const smokeScript = join(
		worktreeRoot,
		"internal",
		"eval",
		"deep-research-web-source-20260626",
		"scripts",
		"run-current-smoke.mjs",
	);
	const result = spawnSync(process.execPath, [smokeScript], {
		cwd: worktreeRoot,
		env: {
			...process.env,
			EVAL_REPO_ROOT: worktreeRoot,
			EVAL_CURRENT_ROOT: worktreeRoot,
			EVAL_OUT_DIR: outDir,
		},
		stdio: "inherit",
		timeout: Number(process.env.EVAL_TIMEOUT_MS ?? 7_200_000) + 120_000,
	});
	metadata.result = {
		status: result.status,
		signal: result.signal,
		error: result.error ? String(result.error) : null,
	};
	writeFileSync(
		join(outDir, "isolated-smoke.json"),
		`${JSON.stringify(metadata, null, 2)}\n`,
	);
	if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
	if (!keepWorktree) {
		spawnSync("git", ["worktree", "remove", "--force", worktreeRoot], {
			cwd: sourceRoot,
			stdio: "ignore",
		});
	}
}

function overlayWorkingTree(source, target, { copyUntracked: includeUntracked }) {
	const changed = gitList(source, [
		"diff",
		"--name-only",
		"--diff-filter=ACMRTUXB",
		"HEAD",
		"--",
	]);
	const deleted = gitList(source, [
		"diff",
		"--name-only",
		"--diff-filter=D",
		"HEAD",
		"--",
	]);
	const untracked = includeUntracked
		? gitList(source, ["ls-files", "--others", "--exclude-standard"])
		: [];
	const copied = [];
	const removed = [];
	for (const relPath of unique([...changed, ...untracked])) {
		if (!isSafeRelativePath(relPath)) continue;
		const from = join(source, relPath);
		const to = join(target, relPath);
		if (!existsSync(from)) continue;
		mkdirSync(dirname(to), { recursive: true });
		const stat = lstatSync(from);
		if (stat.isSymbolicLink()) {
			const linkTarget = readlinkSync(from);
			rmSync(to, { recursive: true, force: true });
			symlinkSync(linkTarget, to);
		} else if (stat.isFile()) {
			cpSync(from, to, { dereference: false, force: true, preserveTimestamps: true });
		} else {
			continue;
		}
		copied.push(relPath);
	}
	for (const relPath of deleted) {
		if (!isSafeRelativePath(relPath)) continue;
		rmSync(join(target, relPath), { recursive: true, force: true });
		removed.push(relPath);
	}
	return { copied, removed, changed, deleted, untracked };
}

function linkNodeModules(source, target) {
	const sourceNodeModules = join(source, "node_modules");
	const targetNodeModules = join(target, "node_modules");
	if (!existsSync(sourceNodeModules) || existsSync(targetNodeModules)) return;
	symlinkSync(sourceNodeModules, targetNodeModules, "dir");
}

function gitList(cwd, args) {
	const text = gitOutput(cwd, args);
	return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

function gitOutput(cwd, args) {
	const result = spawnSync("git", args, {
		cwd,
		encoding: "utf8",
		maxBuffer: 20 * 1024 * 1024,
	});
	if (result.status !== 0) {
		throw new Error(
			`git ${args.join(" ")} failed: ${(result.stderr || result.stdout || "").trim()}`,
		);
	}
	return result.stdout.trim();
}

function run(command, args, options) {
	const result = spawnSync(command, args, { stdio: "inherit", ...options });
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
	}
}

function unique(values) {
	return [...new Set(values)];
}

function isSafeRelativePath(value) {
	if (!value || value.startsWith("/") || value.includes("\0")) return false;
	const normalized = relative(".", value);
	return normalized && !normalized.startsWith("..") && normalized !== ".";
}
