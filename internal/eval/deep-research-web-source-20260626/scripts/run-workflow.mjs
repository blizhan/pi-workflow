import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.argv[2] ?? process.cwd());
const label = process.argv[3] ?? "run";
const outDir = resolve(process.argv[4] ?? join(root, ".tmp", "workflow-eval"));
const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS ?? 7_200_000);
const model = process.env.EVAL_MODEL ?? "openai-codex/gpt-5.5";
const thinking = process.env.EVAL_THINKING ?? "low";
const workflow = process.env.EVAL_WORKFLOW ?? "deep-research";
const task = process.env.EVAL_TASK;

if (!task?.trim()) throw new Error("EVAL_TASK is required");

const index = await import(pathToFileURL(join(root, "dist", "index.js")).href);
await mkdir(outDir, { recursive: true });
const startedAt = new Date().toISOString();
const run = await index.runWorkflowSpec(workflow, root, {
  task,
  runtimeDefaults: { model, thinking },
});
console.log(`[eval] ${label} started ${run.runId} status=${run.status}`);
await writeFile(
  join(outDir, `${label}-start.json`),
  JSON.stringify({ label, root, runId: run.runId, startedAt, model, thinking, workflow, task }, null, 2),
);
const final = await index.waitForRun(root, run.runId, timeoutMs);
const completedAt = new Date().toISOString();
await writeFile(
  join(outDir, `${label}-final.json`),
  JSON.stringify({ label, root, runId: final.runId, startedAt, completedAt, model, thinking, workflow, task, status: final.status, taskSummary: final.taskSummary }, null, 2),
);
console.log(`[eval] ${label} final ${final.runId} status=${final.status}`);
console.log(JSON.stringify({ label, root, runId: final.runId, status: final.status, taskSummary: final.taskSummary }, null, 2));
if (final.status !== "completed") process.exitCode = 1;
