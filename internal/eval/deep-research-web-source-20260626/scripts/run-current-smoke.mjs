import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.env.EVAL_REPO_ROOT ?? process.cwd());
const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const root = resolve(process.env.EVAL_CURRENT_ROOT ?? positionalArgs[0] ?? repo);
const outDir = resolve(process.env.EVAL_OUT_DIR ?? positionalArgs[1] ?? join(root, ".tmp", "deep-research-current-smoke"));
const runScript = resolve(process.env.EVAL_RUN_SCRIPT ?? join(scriptDir, "run-workflow.mjs"));
const metricsScript = resolve(process.env.EVAL_METRICS_SCRIPT ?? join(scriptDir, "extract-metrics.mjs"));
const model = process.env.EVAL_MODEL ?? "openai-codex/gpt-5.5";
const thinking = process.env.EVAL_THINKING ?? "low";
const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS ?? 7_200_000);
const skipRun = process.env.EVAL_SKIP_RUN === "1" || process.argv.includes("--metrics-only");
const labelTemplate = process.env.EVAL_SMOKE_LABEL_TEMPLATE ?? "{prompt}-current-smoke";
const labelOverrides = process.env.EVAL_SMOKE_LABELS ? JSON.parse(process.env.EVAL_SMOKE_LABELS) : {};

const prompts = {
  p1: "Research practical methods for measuring and reporting energy use or carbon impact of AI inference workloads. Compare hardware/provider telemetry, model/runtime factors, allocation methodology, uncertainty, reporting standards or guidance, and what is feasible for a small SaaS team. Depth: standard.",
  p2: "Research practical methods for evaluating and monitoring production RAG answer quality. Compare retrieval metrics, answer-grounding/citation checks, LLM-as-judge approaches, human review, synthetic and golden datasets, drift monitoring, privacy/security risks, tools/frameworks, uncertainty, and what is feasible for a small SaaS team. Depth: standard.",
  p3: "Research best practices for safely running AI coding agents in local development and CI. Compare sandboxing, network and filesystem isolation, credentials/secrets handling, tool permissioning, prompt-injection defenses, dependency/install risks, audit logs, human approval gates, incident response, and what is feasible for a small engineering team. Depth: standard.",
};

const defaultVerifiedFloors = { p1: 13, p2: 11, p3: 16 };
const selectedPrompts = parsePromptList(process.env.EVAL_PROMPTS ?? process.argv.find((arg) => arg.startsWith("--prompts="))?.split("=")[1] ?? "p1,p2,p3");
const verifiedFloors = parseVerifiedFloors();

mkdirSync(outDir, { recursive: true });
const rows = [];
for (const promptId of selectedPrompts) {
  if (!prompts[promptId]) throw new Error(`unknown prompt '${promptId}' (expected one of ${Object.keys(prompts).join(",")})`);
  const label = labelFor(promptId);
  const finalPath = join(outDir, `${label}-final.json`);
  const metricsPath = join(outDir, `${label}-metrics.json`);
  let final = existsSync(finalPath) ? readJson(finalPath) : null;
  let runStatus = skipRun ? "skipped" : "not_started";

  if (!skipRun) {
    console.log(`[current-smoke] start ${label} root=${root}`);
    const run = spawnSync(process.execPath, [runScript, root, label, outDir], {
      cwd: repo,
      env: {
        ...process.env,
        PI_WORKFLOW_CAPTURE_TOOL_CALLS: "1",
        EVAL_MODEL: model,
        EVAL_THINKING: thinking,
        EVAL_TIMEOUT_MS: String(timeoutMs),
        EVAL_WORKFLOW: "deep-research",
        EVAL_TASK: prompts[promptId],
      },
      stdio: "inherit",
      timeout: timeoutMs + 60_000,
    });
    final = existsSync(finalPath) ? readJson(finalPath) : final;
    runStatus = final?.status ?? (run.error ? "runner_error" : `exit_${run.status}`);
    if (run.status !== 0) console.log(`[current-smoke] runner non-zero for ${label}: ${runStatus}`);
  }

  if (!existsSync(metricsPath)) {
    const runId = final?.runId;
    if (runId) {
      console.log(`[current-smoke] metrics ${label} runId=${runId}`);
      const metrics = spawnSync(process.execPath, [metricsScript, root, runId, label, outDir], {
        cwd: repo,
        env: process.env,
        encoding: "utf8",
        timeout: 300_000,
        maxBuffer: 20 * 1024 * 1024,
      });
      writeFileSync(join(outDir, `${label}-metrics.stdout.json`), metrics.stdout ?? "");
      writeFileSync(join(outDir, `${label}-metrics.stderr.log`), metrics.stderr ?? "");
      if (metrics.status !== 0) console.log(`[current-smoke] metrics non-zero for ${label}: exit_${metrics.status}`);
    } else if (skipRun) {
      console.log(`[current-smoke] metrics-only: missing ${metricsPath}`);
    }
  }

  const metrics = existsSync(metricsPath) ? readJson(metricsPath) : null;
  rows.push(buildRow({ promptId, label, runStatus, final, metrics, verifiedFloor: verifiedFloors[promptId] }));
  writeAggregate(rows);
}
writeAggregate(rows);
const failed = rows.filter((row) => row.guardrailPassed !== true);
console.log(`[current-smoke] wrote ${join(outDir, "CURRENT_SMOKE_SUMMARY.md")}`);
if (failed.length > 0) process.exitCode = 1;

function buildRow({ promptId, label, runStatus, final, metrics, verifiedFloor }) {
  const failedToolCalls = sumValues(metrics?.toolTelemetry?.errorsByTool);
  const missingFromNormalize = metrics?.authoritative?.factSlots?.missingFromNormalize ?? [];
  const missingFromFinal = metrics?.authoritative?.factSlots?.missingFromFinal ?? [];
  const sourceRefJoinFailures = metrics?.authoritative?.audit?.sourceRefJoinFailures;
  const claimCounts = metrics?.authoritative?.audit?.claimCounts ?? metrics?.executive?.claimSummary ?? {};
  const row = {
    promptId,
    label,
    root,
    runId: metrics?.runId ?? final?.runId ?? null,
    runStatus,
    status: metrics?.status ?? final?.status ?? null,
    minutes: metrics?.wallClockMinutes ?? null,
    taskCount: metrics?.taskCount ?? null,
    outputRetries: metrics?.outputRetries ?? null,
    launchRetries: metrics?.launchRetries ?? null,
    toolCalls: metrics?.toolTelemetry?.totalCalls ?? null,
    failedToolCalls,
    sourceReadCalls: metrics?.toolTelemetry?.callsByTool?.workflow_web_source_read ?? 0,
    fetchCalls: (metrics?.toolTelemetry?.callsByTool?.workflow_web_fetch_source ?? 0) + (metrics?.toolTelemetry?.callsByTool?.fetch_content ?? 0),
    claimTotal: claimCounts.total ?? null,
    verified: claimCounts.verified ?? null,
    partial: claimCounts.partially_supported ?? null,
    unsupported: claimCounts.unsupported ?? null,
    conflicting: claimCounts.conflicting ?? null,
    verifiedFloor,
    qualityPassed: metrics?.qualityChecks?.passed ?? null,
    qualityFailed: metrics?.qualityChecks?.failed ?? [],
    missingFromNormalizeCount: Array.isArray(missingFromNormalize) ? missingFromNormalize.length : null,
    missingFromFinalCount: Array.isArray(missingFromFinal) ? missingFromFinal.length : null,
    sourceRefJoinFailures: sourceRefJoinFailures ?? null,
  };
  row.guardrailFailures = guardrailFailures(row, { hasMetrics: Boolean(metrics) });
  row.guardrailPassed = row.guardrailFailures.length === 0;
  return row;
}

function guardrailFailures(row, { hasMetrics }) {
  const failures = [];
  if (!hasMetrics) failures.push("metrics-missing");
  if (row.status !== "completed") failures.push("status-not-completed");
  if (row.qualityPassed !== true) failures.push("qualityChecks.passed-not-true");
  if (row.failedToolCalls !== 0) failures.push(`failed-tools-${row.failedToolCalls}`);
  if (row.missingFromNormalizeCount !== 0) failures.push(`missingFromNormalize-${row.missingFromNormalizeCount}`);
  if (row.missingFromFinalCount !== 0) failures.push(`missingFromFinal-${row.missingFromFinalCount}`);
  if (row.sourceRefJoinFailures !== 0) failures.push(`sourceRefJoinFailures-${row.sourceRefJoinFailures}`);
  if (!Number.isFinite(Number(row.verified)) || Number(row.verified) < Number(row.verifiedFloor)) failures.push(`verified-${row.verified}-below-${row.verifiedFloor}`);
  return failures;
}

function writeAggregate(runRows) {
  const aggregate = {
    schema: "deep-research-current-smoke-v1",
    root,
    outDir,
    model,
    thinking,
    skipRun,
    selectedPrompts,
    verifiedFloors,
    rows: runRows,
    passed: runRows.length === selectedPrompts.length && runRows.every((row) => row.guardrailPassed),
  };
  writeFileSync(join(outDir, "current-smoke-aggregate.json"), `${JSON.stringify(aggregate, null, 2)}\n`);
  const md = [
    "# Deep research current smoke",
    "",
    `Root: ${root}`,
    `Model: ${model}; thinking: ${thinking}; metrics-only: ${skipRun}`,
    `Verified floors: ${JSON.stringify(verifiedFloors)}`,
    "",
    "| Prompt | Label | Run | Status | Min | V/P/U/C | Failed tools | Missing normalize/final | Source-ref joins | Quality | Guardrail |",
    "|---|---|---|---|---:|---:|---:|---:|---:|---|---|",
    ...runRows.map((row) => `| ${row.promptId.toUpperCase()} | ${row.label} | ${row.runId ?? ""} | ${row.status ?? ""} | ${fmt(row.minutes)} | ${fmt(row.verified)}/${fmt(row.partial)}/${fmt(row.unsupported)}/${fmt(row.conflicting)} | ${fmt(row.failedToolCalls)} | ${fmt(row.missingFromNormalizeCount)}/${fmt(row.missingFromFinalCount)} | ${fmt(row.sourceRefJoinFailures)} | ${row.qualityPassed ?? ""} | ${row.guardrailPassed ? "PASS" : `FAIL: ${row.guardrailFailures.join(", ")}`} |`),
    "",
    aggregate.passed ? "Overall: **PASS**" : "Overall: **FAIL**",
    "",
    "Guardrails: completed run, `qualityChecks.passed === true`, zero failed tools, zero missing planned fact slots in normalize/final, zero source-ref join failures, and verified claims at/above each configured floor.",
  ].join("\n");
  writeFileSync(join(outDir, "CURRENT_SMOKE_SUMMARY.md"), `${md}\n`);
}

function parsePromptList(value) {
  return String(value).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function parseVerifiedFloors() {
  const floors = { ...defaultVerifiedFloors };
  if (process.env.EVAL_VERIFIED_FLOOR) {
    for (const key of Object.keys(floors)) floors[key] = Number(process.env.EVAL_VERIFIED_FLOOR);
  }
  if (process.env.EVAL_VERIFIED_FLOORS) {
    const parsed = JSON.parse(process.env.EVAL_VERIFIED_FLOORS);
    for (const [key, value] of Object.entries(parsed)) floors[key.toLowerCase()] = Number(value);
  }
  for (const [key, value] of Object.entries(floors)) {
    if (!Number.isFinite(Number(value))) throw new Error(`invalid verified floor for ${key}: ${value}`);
  }
  return floors;
}

function labelFor(promptId) {
  return labelOverrides[promptId] ?? labelTemplate.replaceAll("{prompt}", promptId).replaceAll("{PROMPT}", promptId.toUpperCase());
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sumValues(value) {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce((sum, item) => sum + Number(item ?? 0), 0);
}

function fmt(value) {
  return value == null ? "" : String(value);
}
