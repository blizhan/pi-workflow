#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const args = parseArgs(process.argv.slice(2));
const roots = (args.roots.length > 0 ? args.roots : [process.cwd()]).map((item) => resolve(item));
const outDir = resolve(args.outDir ?? join(roots[0], ".tmp", "deep-research-audit-qualified-final-eval"));
const verifiedFloor = Number(args.verifiedFloor ?? 16);
if (!Number.isFinite(verifiedFloor) || verifiedFloor < 0) {
	throw new Error(`invalid --verified-floor: ${args.verifiedFloor}`);
}
const helperPath = args.helperPath ? resolve(args.helperPath) : null;
const helper = helperPath ? await loadHelper(helperPath) : null;

const runs = dedupeRuns((await Promise.all(roots.map(findWorkflowRuns))).flat());
const rows = [];
for (const runPath of runs) {
	const row = await inspectRun(runPath, { verifiedFloor, helper });
	if (row) rows.push(row);
}
rows.sort((a, b) => {
	const qualified = Number(b.auditQualified) - Number(a.auditQualified);
	if (qualified !== 0) return qualified;
	return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
});

const summary = summarize(rows, { verifiedFloor, helperPath, roots, outDir });
const result = {
	schema: "deep-research-audit-qualified-final-eval-v1",
	generatedAt: new Date().toISOString(),
	inputs: {
		roots,
		verifiedFloor,
		helperPath,
	},
	summary,
	rows,
};
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "audit-qualified-final-eval.json"), `${JSON.stringify(result, null, 2)}\n`);
const markdown = renderMarkdown(result);
await writeFile(join(outDir, "AUDIT_QUALIFIED_FINAL_EVAL.md"), `${markdown}\n`);
console.log(markdown);

if (args.strict) {
	const helperFailures = rows.filter((row) => row.auditQualified && row.helperComparison?.pass === false);
	if (summary.auditQualified === 0 || helperFailures.length > 0) process.exitCode = 1;
}

function parseArgs(values) {
	const parsed = {
		roots: [],
		outDir: process.env.EVAL_OUT_DIR,
		verifiedFloor: process.env.EVAL_VERIFIED_FLOOR,
		helperPath: process.env.EVAL_FINAL_AUDIT_HELPER,
		strict: false,
	};
	for (let index = 0; index < values.length; index += 1) {
		const value = values[index];
		if (value === "--out") parsed.outDir = values[++index];
		else if (value === "--verified-floor") parsed.verifiedFloor = values[++index];
		else if (value === "--helper") parsed.helperPath = values[++index];
		else if (value === "--strict") parsed.strict = true;
		else if (value === "--help" || value === "-h") {
			printHelp();
			process.exit(0);
		} else if (value.startsWith("--")) {
			throw new Error(`unknown option: ${value}`);
		} else {
			parsed.roots.push(value);
		}
	}
	return parsed;
}

function printHelp() {
	console.log(`Usage: node audit-qualified-final-eval.mjs [roots...] [options]\n\nScan deep-research workflow runs, classify audit-qualified final-audit packets,\nand optionally replay a deterministic final-audit helper against those packets.\n\nOptions:\n  --out <dir>              Output directory (default: <first-root>/.tmp/deep-research-audit-qualified-final-eval)\n  --verified-floor <n>     Minimum pre-final verified count (default: 16)\n  --helper <file.mjs>      Optional candidate final-audit helper to replay\n  --strict                 Exit non-zero if no qualified rows or helper comparison fails\n`);
}

async function loadHelper(path) {
	if (!existsSync(path)) throw new Error(`missing helper: ${path}`);
	const module = await import(pathToFileURL(path).href);
	if (typeof module.default !== "function") {
		throw new Error(`helper must export a default function: ${path}`);
	}
	return module.default;
}

async function findWorkflowRuns(root) {
	const out = [];
	await walk(root, async (path, entry) => {
		if (!entry.isFile() || entry.name !== "run.json") return;
		if (!isWorkflowRunPath(path)) return;
		out.push(path);
	});
	return out;
}

async function walk(root, visit) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			if (shouldSkipDir(entry.name)) continue;
			await walk(path, visit);
		} else {
			await visit(path, entry);
		}
	}
}

function shouldSkipDir(name) {
	return name === ".git" || name === "node_modules" || name === "dist" || name === "coverage";
}

function isWorkflowRunPath(path) {
	const parts = path.split(sep);
	const workflowsIndex = parts.lastIndexOf("workflows");
	return workflowsIndex > 0 && parts[workflowsIndex - 1] === ".pi" && parts.at(-1) === "run.json";
}

function dedupeRuns(paths) {
	return [...new Set(paths.map((path) => resolve(path)))];
}

async function inspectRun(runPath, { verifiedFloor, helper }) {
	const run = await readJson(runPath);
	if (!run || typeof run !== "object") return null;
	const runDir = dirname(runPath);
	const projectRoot = projectRootForRunPath(runPath);
	const tasks = Array.isArray(run.tasks) ? run.tasks : [];
	const controls = {
		plan: await controlForStage(runDir, tasks, "plan"),
		normalize: await controlForStage(runDir, tasks, "normalize-claims"),
		audit: await controlForStage(runDir, tasks, "audit-claims"),
		packet: await controlForStage(runDir, tasks, "final-audit-packet"),
		finalAudit: await controlForStage(runDir, tasks, "final-audit"),
		final: await controlForStage(runDir, tasks, "final"),
	};
	if (!controls.packet?.control) return null;
	const packet = packetBody(controls.packet.control);
	const audit = controls.audit?.control ?? {};
	const plan = controls.plan?.control ?? {};
	const normalize = controls.normalize?.control ?? {};
	const counts = verdictCounts(packet, audit);
	const plannedSlotIds = slotIds(plan.factSlots, "id");
	const normalizedSlotIds = slotIds(normalize.factSlotCoverage, "slotId");
	const packetSlotIds = slotIds(packet.factSlotCoverage, "slotId");
	const failedTools = await countFailedTools(join(projectRoot, ".pi", "workflow-subagents", run.runId ?? basename(runDir)));
	const finalAuditMinutes = stageSpanMinutes(tasks, "final-audit");
	const qualification = qualify({
		run,
		counts,
		packet,
		audit,
		hasPlanControl: Boolean(controls.plan?.control),
		hasNormalizeControl: Boolean(controls.normalize?.control),
		hasAuditControl: Boolean(controls.audit?.control),
		plannedSlotIds,
		normalizedSlotIds,
		packetSlotIds,
		failedTools,
		verifiedFloor,
	});
	const helperComparison = helper
		? await compareHelper(helper, controls.packet.control, { counts, packet, finalAuditMinutes })
		: null;
	return {
		runId: run.runId ?? basename(runDir),
		runStatus: run.status ?? null,
		updatedAt: run.updatedAt ?? null,
		root: projectRoot,
		runPath,
		packetPath: controls.packet.path,
		controlPaths: compactObject({
			plan: controls.plan?.path,
			normalize: controls.normalize?.path,
			audit: controls.audit?.path,
			packet: controls.packet?.path,
			finalAudit: controls.finalAudit?.path,
			final: controls.final?.path,
		}),
		counts,
		claimVerdictLedgerCount: asArray(packet.claimVerdictLedger).length,
		factSlotCoverageCount: packetSlotIds.length,
		plannedFactSlotCount: plannedSlotIds.length,
		missingFromNormalize: plannedSlotIds.filter((id) => !normalizedSlotIds.includes(id)),
		missingFromPacket: plannedSlotIds.filter((id) => !packetSlotIds.includes(id)),
		sourceRefJoinFailures: asArray(packet.sourceRefJoinFailures ?? audit.sourceRefJoinFailures).length,
		failedTools,
		finalAuditMinutes,
		auditQualified: qualification.pass,
		qualificationReasons: qualification.reasons,
		helperComparison,
	};
}

function projectRootForRunPath(runPath) {
	const parts = runPath.split(sep);
	const workflowsIndex = parts.lastIndexOf("workflows");
	return parts.slice(0, workflowsIndex - 1).join(sep) || sep;
}

async function controlForStage(runDir, tasks, stageId) {
	const task = tasks.find((item) => item?.stageId === stageId);
	if (!task?.taskId) return null;
	const path = join(runDir, "tasks", task.taskId, "control.json");
	const control = await readJson(path);
	return control ? { path, task, control } : null;
}

async function readJson(path) {
	try {
		return JSON.parse(await readFile(path, "utf8"));
	} catch {
		return null;
	}
}

function packetBody(control) {
	return asObject(control?.packet ?? control);
}

function verdictCounts(packet, audit) {
	const raw = asObject(packet.verdictCounts ?? audit.verdictCounts);
	if (Object.keys(raw).length > 0) {
		return {
			verified: finiteNumber(raw.verified),
			partiallySupported: finiteNumber(raw.partiallySupported ?? raw.partially_supported),
			unsupported: finiteNumber(raw.unsupported),
			conflicting: finiteNumber(raw.conflicting),
			other: finiteNumber(raw.other),
		};
	}
	const counts = { verified: 0, partiallySupported: 0, unsupported: 0, conflicting: 0, other: 0 };
	for (const row of asArray(packet.claimVerdictLedger ?? audit.claimDigests ?? audit.auditedClaims)) {
		const status = canonicalStatus(row?.status ?? row?.verdict);
		if (status === "verified") counts.verified += 1;
		else if (status === "partially_supported") counts.partiallySupported += 1;
		else if (status === "unsupported") counts.unsupported += 1;
		else if (status === "conflicting") counts.conflicting += 1;
		else counts.other += 1;
	}
	return counts;
}

function qualify({ run, counts, packet, audit, hasPlanControl, hasNormalizeControl, hasAuditControl, plannedSlotIds, normalizedSlotIds, packetSlotIds, failedTools, verifiedFloor }) {
	const reasons = [];
	if (run.status !== "completed") reasons.push(`run-status-${run.status ?? "unknown"}`);
	if (!hasPlanControl) reasons.push("missing-plan-control");
	if (!hasNormalizeControl) reasons.push("missing-normalize-control");
	if (!hasAuditControl) reasons.push("missing-audit-control");
	if (counts.verified < verifiedFloor) reasons.push(`verified-${counts.verified}-below-${verifiedFloor}`);
	const sourceRefJoinFailures = asArray(packet.sourceRefJoinFailures ?? audit.sourceRefJoinFailures).length;
	if (sourceRefJoinFailures !== 0) reasons.push(`source-ref-joins-${sourceRefJoinFailures}`);
	const missingFromNormalize = plannedSlotIds.filter((id) => !normalizedSlotIds.includes(id));
	const missingFromPacket = plannedSlotIds.filter((id) => !packetSlotIds.includes(id));
	if (missingFromNormalize.length > 0) reasons.push(`missing-normalize-slots-${missingFromNormalize.length}`);
	if (missingFromPacket.length > 0) reasons.push(`missing-packet-slots-${missingFromPacket.length}`);
	if (failedTools !== 0) reasons.push(`failed-tools-${failedTools}`);
	if (asArray(packet.claimVerdictLedger).length === 0) reasons.push("empty-claim-ledger");
	return { pass: reasons.length === 0, reasons };
}

async function compareHelper(helper, packetControl, { counts, packet, finalAuditMinutes }) {
	const start = performance.now();
	let direct;
	try {
		direct = await helper({ sources: { "final-audit-packet.main": packetControl } });
	} catch (error) {
		return {
			pass: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
	const helperMs = Math.round(performance.now() - start);
	const directCoverage = asObject(direct?.finalReport?.coverageSummary);
	const directCounts = {
		verified: finiteNumber(directCoverage.verified),
		partiallySupported: finiteNumber(directCoverage.partiallySupported ?? directCoverage.partially_supported),
		unsupported: finiteNumber(directCoverage.unsupported),
		conflicting: finiteNumber(directCoverage.conflicting),
	};
	const directClaims = asArray(direct?.claimVerdictIndex?.claims);
	const packetClaims = asArray(packet.claimVerdictLedger);
	const packetStatuses = statusMap(packetClaims);
	const directStatuses = statusMap(directClaims);
	const packetSlotIds = slotIds(packet.factSlotCoverage, "slotId");
	const directSlotIds = slotIds(direct?.finalReport?.factSlotCoverage, "slotId");
	const checks = [
		check("verdict-counts", sameJson(countsWithoutOther(counts), directCounts), { expected: countsWithoutOther(counts), actual: directCounts }),
		check("claim-index-length", packetClaims.length === directClaims.length, { expected: packetClaims.length, actual: directClaims.length }),
		check("claim-statuses", sameJson(packetStatuses, directStatuses), { expected: packetStatuses, actual: directStatuses }),
		check("fact-slot-length", packetSlotIds.length === directSlotIds.length, { expected: packetSlotIds.length, actual: directSlotIds.length }),
		check("fact-slot-ids", sameJson([...packetSlotIds].sort(), [...directSlotIds].sort()), { expected: [...packetSlotIds].sort(), actual: [...directSlotIds].sort() }),
	];
	return {
		pass: checks.every((item) => item.pass),
		helperMs,
		estimatedFinalAuditMinutesSaved: Number.isFinite(finalAuditMinutes)
			? round(finalAuditMinutes - helperMs / 60000, 2)
			: null,
		directSchema: direct?.schema ?? null,
		checks,
	};
}

function check(id, pass, details) {
	return { id, pass, details };
}

function countsWithoutOther(counts) {
	return {
		verified: finiteNumber(counts.verified),
		partiallySupported: finiteNumber(counts.partiallySupported),
		unsupported: finiteNumber(counts.unsupported),
		conflicting: finiteNumber(counts.conflicting),
	};
}

function statusMap(rows) {
	const out = {};
	for (const row of rows) {
		const id = stringOf(row?.id ?? row?.claimId);
		if (!id) continue;
		out[id] = canonicalStatus(row?.status ?? row?.verdict);
	}
	return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

async function countFailedTools(dir) {
	if (!existsSync(dir)) return 0;
	let summaryFiles = 0;
	let summaryFailed = 0;
	let jsonlFailed = 0;
	await walk(dir, async (path, entry) => {
		if (!entry.isFile()) return;
		if (entry.name === "tool-calls-summary.json") {
			summaryFiles += 1;
			const summary = await readJson(path);
			const byTool = sumObject(summary?.errorsByTool);
			const explicitFailed = finiteNumber(summary?.statusCounts?.failed);
			summaryFailed += Math.max(byTool, explicitFailed);
		} else if (entry.name === "tool-calls.jsonl") {
			const lines = String(await readFile(path, "utf8").catch(() => "")).split(/\r?\n/).filter(Boolean);
			for (const line of lines) {
				let event;
				try {
					event = JSON.parse(line);
				} catch {
					continue;
				}
				if (event?.type === "tool_call" && (event.isError === true || event.status === "failed")) jsonlFailed += 1;
			}
		}
	});
	return summaryFiles > 0 ? summaryFailed : jsonlFailed;
}

function stageSpanMinutes(tasks, stageId) {
	const stageTasks = tasks.filter((task) => task?.stageId === stageId);
	let earliest = Infinity;
	let latest = -Infinity;
	for (const task of stageTasks) {
		const start = Date.parse(task.startedAt ?? "");
		const end = Date.parse(task.completedAt ?? task.updatedAt ?? "");
		if (Number.isFinite(start)) earliest = Math.min(earliest, start);
		if (Number.isFinite(end)) latest = Math.max(latest, end);
	}
	return Number.isFinite(earliest) && Number.isFinite(latest) ? round((latest - earliest) / 60000, 2) : null;
}

function summarize(rows, { verifiedFloor, helperPath, roots, outDir }) {
	const qualifiedRows = rows.filter((row) => row.auditQualified);
	const helperRows = rows.filter((row) => row.helperComparison);
	const helperPassed = helperRows.filter((row) => row.helperComparison?.pass === true).length;
	const qualifiedHelperRows = rows.filter((row) => row.auditQualified && row.helperComparison);
	const qualifiedHelperPassed = qualifiedHelperRows.filter((row) => row.helperComparison?.pass === true).length;
	return {
		roots,
		outDir,
		verifiedFloor,
		helperPath,
		totalRunsWithPackets: rows.length,
		auditQualified: qualifiedRows.length,
		disqualified: rows.length - qualifiedRows.length,
		helperCompared: helperRows.length,
		helperPassed,
		helperFailed: helperRows.length - helperPassed,
		qualifiedHelperCompared: qualifiedHelperRows.length,
		qualifiedHelperPassed,
		qualifiedHelperFailed: qualifiedHelperRows.length - qualifiedHelperPassed,
		qualifiedEstimatedMinutesSavedMedian: median(
			qualifiedRows.map((row) => row.helperComparison?.estimatedFinalAuditMinutesSaved).filter(Number.isFinite),
		),
		verifiedDistribution: distribution(rows.map((row) => row.counts.verified)),
	};
}

function renderMarkdown({ summary, rows }) {
	const lines = [
		"# Audit-qualified final-audit eval",
		"",
		`Generated: ${new Date().toISOString()}`,
		"",
		"## Summary",
		"",
		`- Runs with final-audit packets: ${summary.totalRunsWithPackets}`,
		`- Audit-qualified runs: ${summary.auditQualified}`,
		`- Verified floor: ${summary.verifiedFloor}`,
		`- Helper compared: ${summary.helperCompared}`,
		`- Helper pass/fail: ${summary.helperPassed}/${summary.helperFailed}`,
		`- Qualified helper compared: ${summary.qualifiedHelperCompared}`,
		`- Qualified helper pass/fail: ${summary.qualifiedHelperPassed}/${summary.qualifiedHelperFailed}`,
		`- Qualified median estimated final-audit minutes saved: ${summary.qualifiedEstimatedMinutesSavedMedian ?? "n/a"}`,
		`- Verified distribution: ${JSON.stringify(summary.verifiedDistribution)}`,
		"",
		"## Rows",
		"",
		"| Run | Qualified | V/P/U/C | Slots | SourceRef joins | Failed tools | Final audit min | Helper | Est saved | Reasons |",
		"|---|---|---:|---:|---:|---:|---:|---|---:|---|",
	];
	for (const row of rows) {
		lines.push(
			`| ${row.runId} | ${row.auditQualified ? "yes" : "no"} | ${row.counts.verified}/${row.counts.partiallySupported}/${row.counts.unsupported}/${row.counts.conflicting} | ${row.factSlotCoverageCount}/${row.plannedFactSlotCount} | ${row.sourceRefJoinFailures} | ${row.failedTools} | ${row.finalAuditMinutes ?? "n/a"} | ${formatHelper(row.helperComparison)} | ${row.helperComparison?.estimatedFinalAuditMinutesSaved ?? "n/a"} | ${row.qualificationReasons.join(", ") || "-"} |`,
		);
	}
	lines.push("", "JSON: `audit-qualified-final-eval.json`");
	return lines.join("\n");
}

function formatHelper(comparison) {
	if (!comparison) return "n/a";
	return comparison.pass ? `PASS (${comparison.helperMs}ms)` : "FAIL";
}

function distribution(values) {
	const out = {};
	for (const value of values) out[String(value)] = (out[String(value)] ?? 0) + 1;
	return out;
}

function median(values) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? round((sorted[middle - 1] + sorted[middle]) / 2, 2) : round(sorted[middle], 2);
}

function slotIds(items, key) {
	return asArray(items).map((item) => item?.[key]).filter((id) => typeof id === "string");
}

function canonicalStatus(status) {
	const text = String(status ?? "").trim().toLowerCase().replace(/[ -]/g, "_");
	if (text === "partial" || text === "partially_supported" || text === "partially_supported_by_evidence") return "partially_supported";
	if (["verified", "unsupported", "conflicting", "unverified"].includes(text)) return text;
	return "other";
}

function sameJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function compactObject(object) {
	return Object.fromEntries(Object.entries(object).filter(([, value]) => value != null));
}

function sumObject(object) {
	return Object.values(object ?? {}).reduce((sum, value) => sum + finiteNumber(value), 0);
}

function finiteNumber(value, fallback = 0) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function round(value, places = 2) {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
}

function stringOf(value) {
	return typeof value === "string" ? value : undefined;
}

function asArray(value) {
	return Array.isArray(value) ? value : [];
}

function asObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
