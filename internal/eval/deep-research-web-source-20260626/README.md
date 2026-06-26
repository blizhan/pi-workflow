# Deep research web-source/context evaluation — 2026-06-26

This directory versions the small, reusable evaluation harness and summary artifacts for the deep-research web-source/context hardening work.

## What is versioned

- `scripts/run-workflow.mjs` — run one workflow and wait for completion.
- `scripts/extract-metrics.mjs` — extract artifact-based metrics from a workflow run.
- `scripts/run-abba.mjs` — run the 3-prompt AB/BA benchmark against two prepared roots.
- `scripts/summarize.mjs` — summarize per-run metrics into `ABBA_SUMMARY.md` and `benchmark-aggregate.json`.
- `BENCHMARK_PROMPTS.md` — benchmark prompts.
- `HUMAN_SCORE_SHEET.md` — rubric template for human/domain scoring.
- `results/abba-b7ba664/` — preserved metrics from the b7ba664 current-vs-515adb6 baseline AB/BA run.
- `results/smoke/` — selected smoke metrics used while diagnosing workflow_artifact failures and packet shrink attempts.

## What remains ignored

Full runtime roots, `.pi/workflows/**`, `.pi/workflow-subagents/**`, web-source caches, and raw provider logs stay out of git under `.tmp/`/`.pi/`. They can contain large trace data and environment-specific paths.

## Re-running AB/BA

Prepare clean roots first, then run:

```bash
EVAL_REPO_ROOT=/path/to/pi-workflow \
EVAL_BASE_DIR=/path/to/eval-root \
EVAL_BASELINE_ROOT=/path/to/baseline-root \
EVAL_CURRENT_ROOT=/path/to/current-root \
EVAL_OUT_DIR=/path/to/output/results \
EVAL_MODEL=openai-codex/gpt-5.5 \
EVAL_THINKING=low \
node internal/eval/deep-research-web-source-20260626/scripts/run-abba.mjs
```

The script records metrics after each run so partial benchmark progress is inspectable.

## Current interpretation

The preserved b7ba664 AB/BA result showed lower model-visible tool-result characters and clean verifier integrity, but wall-clock time regressed versus baseline. Public speed/quality/context-pressure claims still require larger benchmark cohorts and human/domain scoring.
