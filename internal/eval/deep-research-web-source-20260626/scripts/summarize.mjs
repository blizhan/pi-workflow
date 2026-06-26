import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const outDir = resolve(process.env.EVAL_OUT_DIR ?? process.argv[2] ?? "results");
const baselineLabel = process.env.EVAL_BASELINE_LABEL ?? "baseline";
const currentLabel = process.env.EVAL_CURRENT_LABEL ?? "current";
const rowsSpec = [
  ["P1", "baseline", "AB", "p1-baseline-AB"],
  ["P1", "current", "AB", "p1-current-AB"],
  ["P2", "current", "BA", "p2-current-BA"],
  ["P2", "baseline", "BA", "p2-baseline-BA"],
  ["P3", "baseline", "AB", "p3-baseline-AB"],
  ["P3", "current", "AB", "p3-current-AB"],
];

const rows = rowsSpec
  .map(([prompt, side, order, label]) => {
    const metricsPath = join(outDir, `${label}-metrics.json`);
    if (!existsSync(metricsPath)) return null;
    const metrics = JSON.parse(readFileSync(metricsPath, "utf8"));
    const audit = readAuditControl(metrics.root, metrics.runId);
    const calls = metrics.toolTelemetry?.callsByTool ?? {};
    const errors = metrics.toolTelemetry?.errorsByTool ?? {};
    const chars = metrics.toolTelemetry?.resultStringCharsByTool ?? {};
    const claimCounts =
      metrics.authoritative?.audit?.claimCounts ?? metrics.executive?.claimSummary ?? {};
    return {
      prompt,
      side,
      order,
      label,
      runId: metrics.runId,
      status: metrics.status,
      minutes: metrics.wallClockMinutes,
      taskCount: metrics.taskCount,
      outputRetries: metrics.outputRetries,
      launchRetries: metrics.launchRetries,
      toolCalls: metrics.toolTelemetry?.totalCalls,
      failedToolCalls: sum(errors),
      errorsByTool: errors,
      resultChars: sum(chars),
      sourceReadCalls: calls.workflow_web_source_read ?? 0,
      webSearchCalls: calls.workflow_web_search ?? calls.fetch_content ?? 0,
      fetchCalls:
        (calls.workflow_web_fetch_source ?? 0) + (calls.fetch_content ?? 0),
      webSourceCacheFiles: metrics.webSourceCache?.files ?? 0,
      legacyFetchCacheFiles: metrics.legacyFetchCache?.files ?? 0,
      claimTotal: claimCounts.total,
      verified: claimCounts.verified,
      partial: claimCounts.partially_supported,
      unsupported: claimCounts.unsupported,
      conflicting: claimCounts.conflicting,
      sourceRefJoinFailures: metrics.authoritative?.audit?.sourceRefJoinFailures,
      remainingGapCount: metrics.authoritative?.audit?.remainingGapCount,
      qualityPassed: metrics.qualityChecks?.passed,
      modelUsage: metrics.modelTelemetry?.usage ?? null,
      gateSummary: audit?.gateSummary
        ? {
            invalidVerifierRows: audit.gateSummary.invalidVerifierRows,
            missingVerifierResults: audit.gateSummary.missingVerifierResults,
            duplicateVerifierRows: audit.gateSummary.duplicateVerifierRows,
            duplicateStatusConflicts: audit.gateSummary.duplicateStatusConflicts,
            sourceRefsRejoined: audit.gateSummary.sourceRefsRejoined,
          }
        : null,
    };
  })
  .filter(Boolean);

const averages = {};
for (const side of ["baseline", "current"]) {
  const group = rows.filter((row) => row.side === side);
  averages[side] = {
    count: group.length,
    minutes: avg(group.map((row) => row.minutes)),
    toolCalls: avg(group.map((row) => row.toolCalls)),
    failedToolCalls: avg(group.map((row) => row.failedToolCalls)),
    resultChars: avg(group.map((row) => row.resultChars)),
    sourceReadCalls: avg(group.map((row) => row.sourceReadCalls)),
    fetchCalls: avg(group.map((row) => row.fetchCalls)),
    claimTotal: avg(group.map((row) => row.claimTotal)),
    verified: avg(group.map((row) => row.verified)),
    partial: avg(group.map((row) => row.partial)),
    sourceRefJoinFailures: avg(group.map((row) => row.sourceRefJoinFailures)),
  };
}
const deltas = {
  minutesCurrentMinusBaseline: round(
    averages.current.minutes - averages.baseline.minutes,
  ),
  minutesPercent: pct(averages.current.minutes, averages.baseline.minutes),
  toolCallsPercent: pct(averages.current.toolCalls, averages.baseline.toolCalls),
  failedToolCallsDelta: round(
    averages.current.failedToolCalls - averages.baseline.failedToolCalls,
  ),
  resultCharsPercent: pct(averages.current.resultChars, averages.baseline.resultChars),
  verifiedDelta: round(averages.current.verified - averages.baseline.verified),
  partialDelta: round(averages.current.partial - averages.baseline.partial),
};
writeFileSync(
  join(outDir, "benchmark-aggregate.json"),
  `${JSON.stringify({ rows, averages, deltas }, null, 2)}\n`,
);
const md = [
  "# Deep research AB/BA benchmark",
  "",
  "Roots:",
  `- baseline: ${baselineLabel}`,
  `- current: ${currentLabel}`,
  "",
  "| Prompt | Side | Order | Run | Status | Min | Claims | V/P/U/C | Tools | Failed tools | Fetch | Source read | Quality | Gate integrity |",
  "|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|",
  ...rows.map(
    (row) =>
      `| ${row.prompt} | ${row.side} | ${row.order} | ${row.runId} | ${row.status} | ${row.minutes} | ${row.claimTotal} | ${row.verified}/${row.partial}/${row.unsupported}/${row.conflicting} | ${row.toolCalls} | ${row.failedToolCalls} | ${row.fetchCalls} | ${row.sourceReadCalls} | ${row.qualityPassed} | ${fmtGate(row.gateSummary)} |`,
  ),
  "",
  "## Averages",
  "",
  "```json",
  JSON.stringify({ averages, deltas }, null, 2),
  "```",
  "",
  "## Notes",
  "",
  "- This is interleaved AB/BA across three prompts, not a human/domain-scored evaluation.",
  "- Quality proxy uses existing authoritative artifact checks; it is not sufficient for public quality claims.",
].join("\n");
writeFileSync(join(outDir, "ABBA_SUMMARY.md"), `${md}\n`);
console.log(md);

function readAuditControl(root, runId) {
  try {
    const run = JSON.parse(
      readFileSync(join(root, ".pi", "workflows", runId, "run.json"), "utf8"),
    );
    const task = run.tasks.find((candidate) => candidate.stageId === "audit-claims");
    const controlPath = join(
      root,
      ".pi",
      "workflows",
      runId,
      "tasks",
      task.taskId,
      "control.json",
    );
    return existsSync(controlPath)
      ? JSON.parse(readFileSync(controlPath, "utf8"))
      : null;
  } catch {
    return null;
  }
}
function sum(object) {
  return Object.values(object ?? {}).reduce((a, b) => a + Number(b ?? 0), 0);
}
function avg(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}
function round(n) {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
function pct(current, baseline) {
  return Number.isFinite(current) && Number.isFinite(baseline) && baseline !== 0
    ? round(((current - baseline) / baseline) * 100)
    : null;
}
function fmtGate(gate) {
  return gate
    ? `invalid ${gate.invalidVerifierRows ?? 0}, missing ${gate.missingVerifierResults ?? 0}, dup ${gate.duplicateVerifierRows ?? 0}`
    : "n/a";
}
