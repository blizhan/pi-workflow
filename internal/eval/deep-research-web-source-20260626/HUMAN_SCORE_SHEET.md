# Human/domain score sheet — deep-research web-source benchmark

Use this before any public quality claim. Score each final output independently; do not know which side is baseline/after if possible.

## Runs

| Prompt | Baseline | After fixed | After perf/terms |
|---|---|---|---|
| P1 energy/carbon | `workflow_mqudrq05_c461b4` | `workflow_mquftz8t_d474c6` | `workflow_mqul79q8_6567f7` |
| P2 RAG evaluation | `workflow_mqugt4wp_cb4b81` | `workflow_mquh6uy6_95e1bb` | — |
| P3 agent safety | `workflow_mquhus8h_db0db3` | `workflow_mqui8o3b_a9621e` | — |

## Rubric

Score 1-5, where 5 is best.

| Dimension | Score | Notes |
|---|---:|---|
| Directly answers the task |  |  |
| Factual accuracy |  |  |
| Evidence quality / source fit |  |  |
| Quote/citation support for key claims |  |  |
| Handles uncertainty and caveats |  |  |
| Practicality for a small SaaS/engineering team |  |  |
| Completeness of important dimensions |  |  |
| Avoids overclaiming |  |  |
| Overall usefulness |  |  |

## Pairwise judgment

For each prompt, choose one:

- Baseline better
- After fixed better
- After perf/terms better
- Tie / inconclusive

Rationale:

```text

```

## Claim guidance

- Public quality claim requires consistent human/domain preference, not just verified/partial proxy counts.
- Public speed claim requires wall-clock improvement across a larger benchmark; current P1 perf/terms rerun improved tool-call volume but not wall clock.
