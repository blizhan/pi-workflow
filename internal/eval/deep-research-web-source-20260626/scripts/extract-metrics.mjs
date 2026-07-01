import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename, relative, dirname } from "node:path";

const root = resolve(process.argv[2] ?? process.cwd());
const runId = process.argv[3];
const label = process.argv[4] ?? basename(root);
const outDir = resolve(process.argv[5] ?? join(root, ".tmp", "workflow-eval"));
const goldenPath = process.argv[6] && !process.argv[6].startsWith("--")
	? resolve(process.argv[6])
	: null;
const strict = process.argv.includes("--strict");
const writeGolden = process.argv.includes("--write-golden");
if (!runId) throw new Error("run id required");

const UNKNOWN = "unknown";
const runDir = join(root, ".pi", "workflows", runId);
const run = await readJson(join(runDir, "run.json"));
if (!run) throw new Error(`missing run.json for ${runId}`);
const tasks = Array.isArray(run.tasks) ? run.tasks : [];
const taskByStage = new Map();
const taskBySpec = new Map();
for (const task of tasks) {
	if (typeof task?.stageId === "string" && !taskByStage.has(task.stageId))
		taskByStage.set(task.stageId, task);
	if (typeof task?.specId === "string") taskBySpec.set(task.specId, task);
}

const controls = {
	plan: await controlForStage("plan"),
	normalize: await controlForStage("normalize-claims"),
	audit: await controlForStage("audit-claims"),
	finalAudit: await controlForStage("final-audit"),
	final: await controlForStage("final"),
};

const statusCounts = {};
let outputRetries = 0;
let launchRetries = 0;
let resumeEvents = 0;
for (const task of tasks) {
	increment(statusCounts, task.status ?? UNKNOWN);
	outputRetries += Math.max(0, Number(task.outputRetry?.attempts ?? 0));
	launchRetries += Math.max(0, Number(task.launchRetry?.attempts ?? 0));
	resumeEvents += Array.isArray(task.resumeEvents) ? task.resumeEvents.length : 0;
}

const taskTiming = summarizeTaskTiming(tasks);
const toolTelemetry = await summarizeToolTelemetry(join(root, ".pi", "workflow-subagents", runId));
const modelTelemetry = await summarizeModelTelemetry(join(root, ".pi", "workflow-subagents", runId));
const authoritative = summarizeAuthoritativeControls(controls);
const executive = summarizeExecutive(controls.final, controls.finalAudit, root, runDir);
const qualityChecks = buildQualityChecks({ authoritative, executive, controls });
const goldenSnapshot = buildGoldenSnapshot({ authoritative, executive, qualityChecks });
const goldenComparison = goldenPath
	? await compareGolden(goldenSnapshot, goldenPath)
	: { available: false, path: null, passed: UNKNOWN, differences: [] };

const wallClockMs = duration(run.createdAt, run.updatedAt);
const metrics = {
	schema: "deep-research-eval-metrics-v2",
	label,
	root,
	runId,
	status: run.status ?? UNKNOWN,
	createdAt: run.createdAt ?? null,
	updatedAt: run.updatedAt ?? null,
	wallClockMs: wallClockMs ?? UNKNOWN,
	wallClockMinutes: wallClockMs == null ? UNKNOWN : round(wallClockMs / 60000, 2),
	taskCount: tasks.length,
	taskSummary: run.taskSummary ?? null,
	statusCounts,
	outputRetries,
	launchRetries,
	resumeEvents,
	taskTiming,
	toolTelemetry,
	modelTelemetry,
	authoritative,
	executive,
	qualityChecks,
	goldenSnapshot,
	goldenComparison,
	webSourceCache: await summarizeDir(join(runDir, "web-source-cache")),
	legacyFetchCache: await summarizeDir(join(runDir, "source-cache", "fetch-content")),
};

await mkdir(outDir, { recursive: true });
const metricsPath = join(outDir, `${label}-metrics.json`);
await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
if (writeGolden) {
	const target = goldenPath ?? join(outDir, `${label}.golden.json`);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, `${JSON.stringify(goldenSnapshot, null, 2)}\n`);
}
console.log(JSON.stringify(metrics, null, 2));
if (strict && hasFailingChecks(qualityChecks, goldenComparison)) {
	process.exitCode = 1;
}

async function controlForStage(stageId) {
	const task = taskByStage.get(stageId);
	if (!task) return null;
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

function summarizeTaskTiming(items) {
	const byStage = {};
	for (const task of items) {
		const stage = task.stageId ?? UNKNOWN;
		const start = Date.parse(task.startedAt ?? "");
		const end = Date.parse(task.completedAt ?? task.updatedAt ?? "");
		const durationMs = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : null;
		const bucket = byStage[stage] ??= {
			taskCount: 0,
			earliestStart: null,
			latestEnd: null,
			spanMs: UNKNOWN,
			spanMinutes: UNKNOWN,
			maxTaskDurationMs: UNKNOWN,
			maxTaskDurationMinutes: UNKNOWN,
			slowestTaskId: null,
		};
		bucket.taskCount += 1;
		if (Number.isFinite(start)) bucket.earliestStart = minIso(bucket.earliestStart, task.startedAt);
		if (Number.isFinite(end)) bucket.latestEnd = maxIso(bucket.latestEnd, task.completedAt ?? task.updatedAt);
		if (durationMs != null && (bucket.maxTaskDurationMs === UNKNOWN || durationMs > bucket.maxTaskDurationMs)) {
			bucket.maxTaskDurationMs = durationMs;
			bucket.maxTaskDurationMinutes = round(durationMs / 60000, 2);
			bucket.slowestTaskId = task.taskId;
		}
	}
	for (const bucket of Object.values(byStage)) {
		const span = duration(bucket.earliestStart, bucket.latestEnd);
		if (span != null) {
			bucket.spanMs = span;
			bucket.spanMinutes = round(span / 60000, 2);
		}
	}
	return { byStage };
}

async function summarizeToolTelemetry(dir) {
	const jsonlFiles = await findFiles(dir, "tool-calls.jsonl").catch(() => []);
	const summaryFiles = await findFiles(dir, "tool-calls-summary.json").catch(() => []);
	if (jsonlFiles.length === 0 && summaryFiles.length === 0) {
		return {
			available: false,
			totalCalls: UNKNOWN,
			callsByTool: UNKNOWN,
			errorsByTool: UNKNOWN,
			resultStringCharsByTool: UNKNOWN,
		};
	}
	const out = {
		available: true,
		jsonlFiles: jsonlFiles.length,
		summaryFiles: summaryFiles.length,
		totalCalls: 0,
		callsByTool: {},
		errorsByTool: {},
		statusCounts: {},
		durationMsByTool: {},
		resultStringCharsByTool: {},
		failedCallFingerprints: {},
		summaryAggregate: { totalCalls: 0, callsByTool: {}, errorsByTool: {}, statusCounts: {} },
	};
	for (const file of summaryFiles) {
		const summary = await readJson(file);
		if (!summary) continue;
		out.summaryAggregate.totalCalls += Number(summary.totalCalls ?? 0);
		mergeCounts(out.summaryAggregate.callsByTool, summary.callsByTool);
		mergeCounts(out.summaryAggregate.errorsByTool, summary.errorsByTool);
		mergeCounts(out.summaryAggregate.statusCounts, summary.statusCounts);
	}
	for (const file of jsonlFiles) {
		const lines = (await readFile(file, "utf8").catch(() => ""))
			.split(/\r?\n/)
			.filter(Boolean);
		for (const line of lines) {
			let event;
			try { event = JSON.parse(line); } catch { continue; }
			if (event?.type !== "tool_call") continue;
			const tool = event.toolName ?? UNKNOWN;
			out.totalCalls += 1;
			increment(out.callsByTool, tool);
			increment(out.statusCounts, event.status ?? UNKNOWN);
			if (event.isError || event.status === "failed") {
				increment(out.errorsByTool, tool);
				const keys = Array.isArray(event.argsSummary?.keys)
					? event.argsSummary.keys.join("+")
					: "unknown-args";
				increment(out.failedCallFingerprints, `${tool}:${keys}`);
			}
			const durationMs = Number(event.durationMs ?? 0);
			if (Number.isFinite(durationMs)) out.durationMsByTool[tool] = (out.durationMsByTool[tool] ?? 0) + durationMs;
			const stringChars = Number(event.resultSummary?.stringChars ?? 0);
			if (Number.isFinite(stringChars)) out.resultStringCharsByTool[tool] = (out.resultStringCharsByTool[tool] ?? 0) + stringChars;
		}
	}
	if (jsonlFiles.length === 0 && summaryFiles.length > 0) {
		out.totalCalls = out.summaryAggregate.totalCalls;
		out.callsByTool = out.summaryAggregate.callsByTool;
		out.errorsByTool = out.summaryAggregate.errorsByTool;
		out.statusCounts = out.summaryAggregate.statusCounts;
	}
	for (const [tool, value] of Object.entries(out.durationMsByTool)) out.durationMsByTool[tool] = Math.round(value);
	return out;
}

async function summarizeModelTelemetry(dir) {
	const resultFiles = await findFiles(dir, "result.json").catch(() => []);
	if (resultFiles.length === 0) {
		return { available: false, resultFiles: 0, contextLengthExceeded: UNKNOWN, usage: UNKNOWN };
	}
	const usage = {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		totalTokens: 0,
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
	};
	let usageRecords = 0;
	let contextLengthExceeded = 0;
	const providers = {};
	const models = {};
	for (const file of resultFiles) {
		const result = await readJson(file);
		const metadata = result?.metadata ?? {};
		if (metadata.contextLengthExceeded === true) contextLengthExceeded += 1;
		if (metadata.provider) increment(providers, metadata.provider);
		if (metadata.model) increment(models, metadata.model);
		if (metadata.usage && typeof metadata.usage === "object") {
			usageRecords += 1;
			for (const key of ["input", "output", "cacheRead", "cacheWrite", "totalTokens"])
				usage[key] += Number(metadata.usage[key] ?? 0);
			for (const key of ["input", "output", "cacheRead", "cacheWrite", "total"])
				usage.cost[key] += Number(metadata.usage.cost?.[key] ?? 0);
		}
	}
	return {
		available: true,
		resultFiles: resultFiles.length,
		usageRecords,
		contextLengthExceeded,
		providers,
		models,
		usage: usageRecords > 0 ? roundUsage(usage) : UNKNOWN,
	};
}

function summarizeAuthoritativeControls({ plan, normalize, audit, finalAudit, final }) {
	const planControl = plan?.control;
	const normalizeControl = normalize?.control;
	const auditControl = audit?.control;
	const finalControl = finalAudit?.control;
	const finalRender = final?.control;
	const auditClaims = asArray(auditControl?.auditedClaims ?? auditControl?.claims);
	const auditClaimCounts = countClaimStatuses(auditClaims);
	const finalIndexClaims = asArray(finalControl?.claimVerdictIndex?.claims);
	const finalIndexCounts = countClaimStatuses(finalIndexClaims);
	const finalCoverage = finalControl?.finalReport?.coverageSummary && typeof finalControl.finalReport.coverageSummary === "object"
		? finalControl.finalReport.coverageSummary
		: null;
	const finalCoverageCounts = finalCoverage ? {
		total: numericOrUnknown(finalCoverage.verificationCandidates ?? finalCoverage.preserved ?? finalCoverage.rawClaimsApprox),
		verified: numericOrUnknown(finalCoverage.verified),
		partially_supported: numericOrUnknown(finalCoverage.partiallySupported),
		unsupported: numericOrUnknown(finalCoverage.unsupported),
		conflicting: numericOrUnknown(finalCoverage.conflicting),
	} : null;
	const finalRenderCounts = finalRender?.claimSummary ?? null;
	const planSlotIds = slotIds(planControl?.factSlots, "id");
	const normalizeSlotIds = slotIds(normalizeControl?.factSlotCoverage, "slotId");
	const finalSlotIds = slotIds(finalControl?.finalReport?.factSlotCoverage, "slotId");
	const normalizedCandidates = asArray(normalizeControl?.claimInventory?.verificationCandidates);
	const sourceRefJoinFailures = asArray(auditControl?.sourceRefJoinFailures);
	const remainingGaps = normalizeGaps(auditControl?.remainingGaps);
	const claimEvidenceGaps = normalizeGaps(auditControl?.claimEvidenceGaps);
	return {
		controls: {
			plan: pathFor(plan),
			normalize: pathFor(normalize),
			audit: pathFor(audit),
			finalAudit: pathFor(finalAudit),
			final: pathFor(final),
		},
		audit: {
			claimCount: auditClaims.length,
			claimCounts: auditClaimCounts,
			claimIds: auditClaims.map(claimIdOf).filter(Boolean),
			sourceRefJoinFailures: sourceRefJoinFailures.length,
			remainingGapCount: remainingGaps.length,
			claimEvidenceGapCount: claimEvidenceGaps.length,
		},
		normalize: {
			verificationCandidateCount: normalizedCandidates.length,
			verificationCandidateIds: normalizedCandidates.map(claimIdOf).filter(Boolean),
		},
		finalAudit: {
			claimIndexCount: finalIndexClaims.length,
			claimIndexCounts: finalIndexCounts,
			coverageCounts: finalCoverageCounts,
		},
		finalRender: {
			claimSummary: finalRenderCounts,
		},
		factSlots: {
			planned: planSlotIds.length,
			normalized: normalizeSlotIds.length,
			final: finalSlotIds.length,
			missingFromNormalize: planSlotIds.filter((id) => !normalizeSlotIds.includes(id)),
			missingFromFinal: planSlotIds.filter((id) => !finalSlotIds.includes(id)),
		},
	};
}

function summarizeExecutive(finalControlEntry, finalAuditEntry, rootDir, runPath) {
	const finalControl = finalControlEntry?.control;
	const finalAudit = finalAuditEntry?.control;
	const markdown = String(finalControl?.executiveMarkdown ?? "");
	const sourceUrls = Array.from(new Set(markdown.match(/https?:\/\/[^\s)\]>"']+/g) ?? []));
	const recommendations = sectionBullets(markdown, "Recommended next steps");
	const recommendationChecks = recommendations.map((text) => ({
		text,
		hasVisibleUrl: /https?:\/\//.test(text),
		hasEvidenceLabel: /\b(?:verified|partially supported|partial|unsupported|conflicting|unverified|source|evidence|caveat|needs parent decision)\b/i.test(text),
	}));
	const serialized = JSON.stringify(finalControl ?? {});
	return {
		path: pathFor(finalControlEntry),
		chars: markdown.length,
		words: markdown.trim() ? markdown.trim().split(/\s+/).length : 0,
		sourceUrlCount: sourceUrls.length,
		sourceUrls: sourceUrls.slice(0, 20),
		recommendationCount: recommendations.length,
		recommendationChecks,
		openGapSignals: {
			finalAuditRemainingGaps: normalizeGaps(finalAudit?.finalReport?.remainingGaps).length,
			finalControlRenderedGapBullets: sectionBullets(markdown, "Key caveats / gaps").length,
			truncated: finalControl?.gates?.truncated === true,
		},
		pathLeak: /(?:\/Users\/|\.pi\/workflows|web-source-cache)/.test(serialized),
		claimSummary: finalControl?.claimSummary ?? null,
		factSlotSummary: finalControl?.factSlotSummary ?? null,
	};
}

function buildQualityChecks({ authoritative, executive }) {
	const checks = [];
	const auditCounts = authoritative.audit.claimCounts;
	const finalCounts = authoritative.finalAudit.coverageCounts ?? authoritative.finalAudit.claimIndexCounts;
	if (finalCounts) {
		checks.push(check(
			"audit-final-count-consistency",
			countsMatch(auditCounts, finalCounts, ["verified", "partially_supported", "unsupported", "conflicting"]),
			{ auditCounts, finalCounts },
		));
	} else {
		checks.push(warn("audit-final-count-consistency", "missing final coverage/index counts"));
	}
	checks.push(check(
		"planned-slots-preserved-in-normalize",
		authoritative.factSlots.missingFromNormalize.length === 0,
		{ missing: authoritative.factSlots.missingFromNormalize },
	));
	checks.push(check(
		"planned-slots-preserved-in-final",
		authoritative.factSlots.missingFromFinal.length === 0,
		{ missing: authoritative.factSlots.missingFromFinal },
	));
	checks.push(check(
		"source-ref-join-failures-zero",
		authoritative.audit.sourceRefJoinFailures === 0,
		{ sourceRefJoinFailures: authoritative.audit.sourceRefJoinFailures },
	));
	const uncitedRecommendations = executive.recommendationChecks.filter(
		(item) => !item.hasVisibleUrl && !item.hasEvidenceLabel,
	);
	checks.push(check(
		"visible-recommendation-citation-or-label",
		uncitedRecommendations.length === 0,
		{ uncitedRecommendations },
	));
	const hasOpenGaps = authoritative.audit.remainingGapCount > 0 || authoritative.audit.claimCounts.partially_supported > 0 || authoritative.audit.claimCounts.unsupported > 0 || authoritative.audit.claimCounts.conflicting > 0;
	checks.push(check(
		"open-gaps-visible-in-executive",
		!hasOpenGaps || executive.openGapSignals.finalControlRenderedGapBullets > 0,
		{ hasOpenGaps, renderedGapBullets: executive.openGapSignals.finalControlRenderedGapBullets },
	));
	checks.push(check(
		"no-truncated-executive-with-open-gaps",
		!(hasOpenGaps && executive.openGapSignals.truncated),
		{ hasOpenGaps, truncated: executive.openGapSignals.truncated },
	));
	checks.push(check(
		"no-local-cache-paths-in-final-control",
		executive.pathLeak === false,
		{ pathLeak: executive.pathLeak },
	));
	return {
		passed: checks.every((item) => item.status !== "fail"),
		failed: checks.filter((item) => item.status === "fail").map((item) => item.id),
		warnings: checks.filter((item) => item.status === "warn").map((item) => item.id),
		checks,
	};
}

function buildGoldenSnapshot({ authoritative, executive, qualityChecks }) {
	return {
		schema: "deep-research-eval-golden-v1",
		auditClaimCounts: authoritative.audit.claimCounts,
		auditClaimIds: authoritative.audit.claimIds,
		normalizedCandidateIds: authoritative.normalize.verificationCandidateIds,
		plannedFactSlotCount: authoritative.factSlots.planned,
		missingFromNormalize: authoritative.factSlots.missingFromNormalize,
		missingFromFinal: authoritative.factSlots.missingFromFinal,
		sourceRefJoinFailures: authoritative.audit.sourceRefJoinFailures,
		finalClaimSummary: executive.claimSummary,
		finalFactSlotSummary: executive.factSlotSummary,
		qualityFailedChecks: qualityChecks.failed,
	};
}

async function compareGolden(snapshot, path) {
	const golden = await readJson(path);
	if (!golden) return { available: false, path, passed: UNKNOWN, differences: [`missing or invalid golden: ${path}`] };
	const differences = [];
	for (const key of [
		"auditClaimCounts",
		"auditClaimIds",
		"normalizedCandidateIds",
		"plannedFactSlotCount",
		"missingFromNormalize",
		"missingFromFinal",
		"sourceRefJoinFailures",
		"finalClaimSummary",
		"finalFactSlotSummary",
	]) {
		if (JSON.stringify(snapshot[key] ?? null) !== JSON.stringify(golden[key] ?? null)) differences.push(key);
	}
	return { available: true, path, passed: differences.length === 0, differences };
}

function hasFailingChecks(qualityChecks, goldenComparison) {
	return qualityChecks.failed.length > 0 || goldenComparison.passed === false;
}

function countClaimStatuses(claims) {
	const counts = { total: claims.length, verified: 0, partially_supported: 0, unsupported: 0, conflicting: 0, unverified: 0, other: 0 };
	for (const claim of claims) {
		const status = normalizeStatus(verdictOf(claim));
		if (Object.hasOwn(counts, status)) counts[status] += 1;
		else counts.other += 1;
	}
	return counts;
}

function verdictOf(claim) {
	return claim?.status ?? claim?.verdict ?? claim?.verdictDigest?.status ?? claim?.verdictDigest?.verdict ?? "unverified";
}

function normalizeStatus(value) {
	const text = String(value ?? "").trim().toLowerCase().replace(/[ -]/g, "_");
	if (text === "partial" || text === "partially_supported" || text === "partially_supported_by_evidence") return "partially_supported";
	if (["verified", "unsupported", "conflicting", "unverified"].includes(text)) return text;
	return "other";
}

function claimIdOf(value) {
	return typeof value?.id === "string" ? value.id : typeof value?.claimId === "string" ? value.claimId : null;
}

function slotIds(items, key) {
	return asArray(items).map((item) => item?.[key]).filter((id) => typeof id === "string");
}

function asArray(value) {
	if (Array.isArray(value)) return value;
	return [];
}

function normalizeGaps(value) {
	const out = [];
	function walk(item, path = "$") {
		if (!item) return;
		if (Array.isArray(item)) {
			item.forEach((child, index) => walk(child, `${path}[${index}]`));
			return;
		}
		if (typeof item === "object") {
			const values = Object.values(item);
			const hasNestedCollection = values.some((child) => Array.isArray(child) || (child && typeof child === "object" && !isGapLike(child)));
			if (isGapLike(item) || !hasNestedCollection) {
				out.push({ path, value: item });
				return;
			}
			for (const [key, child] of Object.entries(item)) walk(child, `${path}.${key}`);
			return;
		}
		if (String(item).trim()) out.push({ path, value: item });
	}
	walk(value);
	return out;
}

function isGapLike(item) {
	if (!item || typeof item !== "object" || Array.isArray(item)) return false;
	return ["gap", "claimId", "slotId", "evidenceState", "reason", "parentImpact", "note", "finding"].some((key) => key in item);
}

function sectionBullets(markdown, heading) {
	const lines = String(markdown ?? "").split(/\r?\n/);
	const out = [];
	let inSection = false;
	for (const line of lines) {
		if (/^\*\*.+\*\*/.test(line.trim())) {
			inSection = new RegExp(escapeRegex(heading), "i").test(line);
			continue;
		}
		if (!inSection) continue;
		if (line.trim() === "") continue;
		const match = line.match(/^\s*-\s+(.+)$/);
		if (match) out.push(match[1]);
	}
	return out;
}

function check(id, condition, details = {}) {
	return { id, status: condition ? "pass" : "fail", details };
}

function warn(id, reason) {
	return { id, status: "warn", details: { reason } };
}

function countsMatch(left, right, keys) {
	return keys.every((key) => Number(left?.[key] ?? 0) === Number(right?.[key] ?? 0));
}

function pathFor(entry) {
	return entry?.path ? relative(root, entry.path) : null;
}

function numericOrUnknown(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : UNKNOWN;
}

function mergeCounts(target, source) {
	if (!source || typeof source !== "object") return;
	for (const [key, value] of Object.entries(source)) target[key] = (target[key] ?? 0) + Number(value ?? 0);
}

function increment(target, key) {
	target[key] = (target[key] ?? 0) + 1;
}

function duration(start, end) {
	const a = Date.parse(start ?? "");
	const b = Date.parse(end ?? "");
	if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
	return Math.max(0, b - a);
}

function round(value, places = 2) {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
}

function roundUsage(usage) {
	return {
		input: usage.input,
		output: usage.output,
		cacheRead: usage.cacheRead,
		cacheWrite: usage.cacheWrite,
		totalTokens: usage.totalTokens,
		cost: Object.fromEntries(Object.entries(usage.cost).map(([key, value]) => [key, round(value, 6)])),
	};
}

function minIso(current, candidate) {
	if (!current) return candidate ?? null;
	if (!candidate) return current;
	return Date.parse(candidate) < Date.parse(current) ? candidate : current;
}

function maxIso(current, candidate) {
	if (!current) return candidate ?? null;
	if (!candidate) return current;
	return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

async function summarizeDir(dir) {
	const files = await findFiles(dir, "").catch(() => []);
	return { exists: existsSync(dir), files: existsSync(dir) ? files.length : UNKNOWN };
}

async function findFiles(dir, suffix) {
	const found = [];
	async function walk(current) {
		const s = await stat(current).catch(() => undefined);
		if (!s) return;
		if (s.isFile()) {
			if (!suffix || current.endsWith(suffix)) found.push(current);
			return;
		}
		if (!s.isDirectory()) return;
		const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
		for (const entry of entries) await walk(join(current, entry.name));
	}
	await walk(dir);
	return found;
}

function escapeRegex(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
