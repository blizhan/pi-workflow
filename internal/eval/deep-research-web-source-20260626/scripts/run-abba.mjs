import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.env.EVAL_REPO_ROOT ?? process.cwd());
const baseDir = resolve(
  process.env.EVAL_BASE_DIR ?? join(repo, ".tmp", "deep-research-abba"),
);
const outDir = resolve(process.env.EVAL_OUT_DIR ?? join(baseDir, "results"));
const baselineRoot = resolve(
  process.env.EVAL_BASELINE_ROOT ?? join(baseDir, "roots", "baseline"),
);
const currentRoot = resolve(
  process.env.EVAL_CURRENT_ROOT ?? join(baseDir, "roots", "current"),
);
const runScript = resolve(
  process.env.EVAL_RUN_SCRIPT ?? join(scriptDir, "run-workflow.mjs"),
);
const metricsScript = resolve(
  process.env.EVAL_METRICS_SCRIPT ?? join(scriptDir, "extract-metrics.mjs"),
);
const model = process.env.EVAL_MODEL ?? "openai-codex/gpt-5.5";
const thinking = process.env.EVAL_THINKING ?? "low";
const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS ?? 7_200_000);

const prompts = {
  p1: "Research practical methods for measuring and reporting energy use or carbon impact of AI inference workloads. Compare hardware/provider telemetry, model/runtime factors, allocation methodology, uncertainty, reporting standards or guidance, and what is feasible for a small SaaS team. Depth: standard.",
  p2: "Research practical methods for evaluating and monitoring production RAG answer quality. Compare retrieval metrics, answer-grounding/citation checks, LLM-as-judge approaches, human review, synthetic and golden datasets, drift monitoring, privacy/security risks, tools/frameworks, uncertainty, and what is feasible for a small SaaS team. Depth: standard.",
  p3: "Research best practices for safely running AI coding agents in local development and CI. Compare sandboxing, network and filesystem isolation, credentials/secrets handling, tool permissioning, prompt-injection defenses, dependency/install risks, audit logs, human approval gates, incident response, and what is feasible for a small engineering team. Depth: standard.",
};

const sequence = [
  { promptId: "p1", side: "baseline", root: baselineRoot, order: "AB" },
  { promptId: "p1", side: "current", root: currentRoot, order: "AB" },
  { promptId: "p2", side: "current", root: currentRoot, order: "BA" },
  { promptId: "p2", side: "baseline", root: baselineRoot, order: "BA" },
  { promptId: "p3", side: "baseline", root: baselineRoot, order: "AB" },
  { promptId: "p3", side: "current", root: currentRoot, order: "AB" },
];

mkdirSync(outDir, { recursive: true });
const rows = [];
for (const item of sequence) {
  const label = `${item.promptId}-${item.side}-${item.order}`;
  const startedAt = new Date().toISOString();
  console.log(`[abba] start ${label} root=${item.root}`);
  const run = spawnSync(process.execPath, [runScript, item.root, label, outDir], {
    cwd: repo,
    env: {
      ...process.env,
      PI_WORKFLOW_CAPTURE_TOOL_CALLS: "1",
      EVAL_MODEL: model,
      EVAL_THINKING: thinking,
      EVAL_TIMEOUT_MS: String(timeoutMs),
      EVAL_WORKFLOW: "deep-research",
      EVAL_TASK: prompts[item.promptId],
    },
    stdio: "inherit",
    timeout: timeoutMs + 60_000,
  });
  const finalPath = join(outDir, `${label}-final.json`);
  const final = existsSync(finalPath)
    ? JSON.parse(readFileSync(finalPath, "utf8"))
    : null;
  const status = final?.status ?? (run.error ? "runner_error" : `exit_${run.status}`);
  const runId = final?.runId ?? null;
  console.log(`[abba] final ${label} status=${status} runId=${runId ?? "?"}`);
  let metricsStatus = "skipped";
  if (runId) {
    const metrics = spawnSync(
      process.execPath,
      [metricsScript, item.root, runId, label, outDir],
      {
        cwd: repo,
        env: process.env,
        encoding: "utf8",
        timeout: 300_000,
        maxBuffer: 20 * 1024 * 1024,
      },
    );
    writeFileSync(join(outDir, `${label}-metrics.stdout.json`), metrics.stdout ?? "");
    writeFileSync(join(outDir, `${label}-metrics.stderr.log`), metrics.stderr ?? "");
    metricsStatus = metrics.status === 0 ? "completed" : `exit_${metrics.status}`;
  }
  rows.push({
    ...item,
    root: item.root,
    label,
    startedAt,
    completedAt: new Date().toISOString(),
    status,
    runId,
    metricsStatus,
  });
  writeAggregate(rows);
  if (run.status !== 0) {
    console.log(`[abba] continuing after non-zero runner status for ${label}`);
  }
}
writeAggregate(rows);
console.log(`[abba] wrote ${join(outDir, "ABBA_SUMMARY.md")}`);

function writeAggregate(runRows) {
  const enriched = runRows.map((row) => {
    const metricsPath = join(outDir, `${row.label}-metrics.json`);
    const metrics = existsSync(metricsPath)
      ? JSON.parse(readFileSync(metricsPath, "utf8"))
      : null;
    return {
      ...row,
      minutes: metrics?.wallClockMinutes ?? null,
      taskCount: metrics?.taskCount ?? null,
      outputRetries: metrics?.outputRetries ?? null,
      failedToolCalls: sumValues(metrics?.toolTelemetry?.errorsByTool),
      sourceReadCalls: metrics?.toolTelemetry?.callsByTool?.workflow_web_source_read ?? 0,
      webSearchCalls:
        metrics?.toolTelemetry?.callsByTool?.workflow_web_search ??
        metrics?.toolTelemetry?.callsByTool?.fetch_content ??
        0,
      fetchCalls:
        (metrics?.toolTelemetry?.callsByTool?.workflow_web_fetch_source ?? 0) +
        (metrics?.toolTelemetry?.callsByTool?.fetch_content ?? 0),
      verified:
        metrics?.authoritative?.audit?.claimCounts?.verified ??
        metrics?.authoritative?.verdictCounts?.verified ??
        metrics?.executive?.claimCounts?.verified ??
        null,
      partial:
        metrics?.authoritative?.audit?.claimCounts?.partially_supported ??
        metrics?.authoritative?.verdictCounts?.partiallySupported ??
        metrics?.executive?.claimCounts?.partially_supported ??
        null,
      unsupported:
        metrics?.authoritative?.audit?.claimCounts?.unsupported ??
        metrics?.authoritative?.verdictCounts?.unsupported ??
        null,
      conflicting:
        metrics?.authoritative?.audit?.claimCounts?.conflicting ??
        metrics?.authoritative?.verdictCounts?.conflicting ??
        null,
      qualityPassed: metrics?.qualityChecks?.passed ?? null,
      sourceRefJoinFailures: metrics?.authoritative?.sourceRefJoinFailures ?? null,
      verifierIntegrity: metrics?.authoritative?.gateSummary
        ? {
            invalidVerifierRows: metrics.authoritative.gateSummary.invalidVerifierRows,
            missingVerifierResults:
              metrics.authoritative.gateSummary.missingVerifierResults,
            duplicateVerifierRows:
              metrics.authoritative.gateSummary.duplicateVerifierRows,
          }
        : null,
    };
  });
  const complete = enriched.filter((row) => typeof row.minutes === "number");
  const averages = {};
  for (const side of ["baseline", "current"]) {
    const sideRows = complete.filter((row) => row.side === side);
    averages[side] = {
      count: sideRows.length,
      minutes: avg(sideRows.map((row) => row.minutes)),
      failedToolCalls: avg(sideRows.map((row) => row.failedToolCalls)),
      sourceReadCalls: avg(sideRows.map((row) => row.sourceReadCalls)),
      verified: avg(sideRows.map((row) => row.verified)),
      partial: avg(sideRows.map((row) => row.partial)),
    };
  }
  writeFileSync(
    join(outDir, "benchmark-aggregate.json"),
    `${JSON.stringify({ rows: enriched, averages }, null, 2)}\n`,
  );
  const lines = [
    "# Deep research AB/BA benchmark",
    "",
    `Model: ${model}; thinking: ${thinking}`,
    "",
    `Baseline root: ${baselineRoot}`,
    `Current root: ${currentRoot}`,
    "",
    "| Prompt | Side | Order | Run | Status | Minutes | Verified | Partial | Failed tools | Source reads | Quality |",
    "|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of enriched) {
    lines.push(
      `| ${row.promptId.toUpperCase()} | ${row.side} | ${row.order} | ${row.runId ?? ""} | ${row.status} | ${fmt(row.minutes)} | ${fmt(row.verified)} | ${fmt(row.partial)} | ${fmt(row.failedToolCalls)} | ${fmt(row.sourceReadCalls)} | ${row.qualityPassed ?? ""} |`,
    );
  }
  lines.push("", "## Averages", "", "```json", JSON.stringify(averages, null, 2), "```", "");
  writeFileSync(join(outDir, "ABBA_SUMMARY.md"), lines.join("\n"));
}

function sumValues(value) {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce((sum, item) => sum + Number(item ?? 0), 0);
}

function avg(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function fmt(value) {
  return value == null ? "" : String(value);
}
