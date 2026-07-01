# Deep Research artifact selector alias smoke

Compared the local artifact-path hardening against the previous `187b025` current AB/BA metrics and the earlier `5a1a8ce` prompt-shrink cap-8 smoke.

## Change under smoke

- `workflow_artifact` projected reads now tolerate common model path variants before failing:
  - source-prefixed paths, e.g. `$.plan.factSlots` -> `$.factSlots` for `source=plan`;
  - artifact-prefixed/root paths, e.g. `$.control.claims` -> `$.claims`, `$.refs` -> `$` for `artifact=refs`;
  - array selector syntax, e.g. `$.factSlots[0]`, `$.factSlots[*]`, `$.factSlots[:8]` -> `$.factSlots`;
  - conservative field aliases, e.g. `$.sourceRequirements` -> `$.sourcePolicy`, `$.verification` -> `$.verificationPriorities`.
- No workflow prompt/spec changes beyond existing `5a1a8ce` prompt shrink are included.

## Current smoke runs

| Prompt | Run ID | Wall clock | Tasks | Quality proxy | Verified / partial | Failed tools | Result chars |
|---|---|---:|---:|---|---:|---:|---:|
| P1 AI energy/carbon reporting | `workflow_mqwbqxrk_36d0af` | 16.78m | 29 | PASS | 12 / 4 | 0 | 449,406 |
| P2 RAG answer quality monitoring | `workflow_mqwcd7cp_db274e` | 19.48m | 31 | PASS | 13 / 3 | 0 | 636,627 |
| P3 AI coding agent safety | `workflow_mqwd2y79_431ab1` | 21.53m | 31 | PASS | 11 / 5 | 0 | 569,004 |

## Comparison

| Metric | `187b025` current avg | `5a1a8ce` cap-8 smoke avg | Current alias smoke avg |
|---|---:|---:|---:|
| Wall clock | 19.88m | 19.86m | 19.26m |
| Verified claims | 13.33 | 15.00 | 12.00 |
| Result chars | 565,941 | 516,404 | 551,679 |
| Failed tools | 0 | 3 | 0 |

## Decision

Do **not** run full AB/BA from this state. The selector alias hardening eliminated the prompt-shrink smoke's `workflow_artifact` failures, but the smoke did not preserve the automated verified-claim proxy (notably P3 fell to 11 verified / 5 partial). The wall-clock difference is small and not enough to justify a speed claim.

Recommended next work: keep the artifact-path hardening as a reliability fix if validation passes, but treat speed/quality improvement as unresolved. Further speed work should target model-stage behavior (especially P3 normalize/final-audit variability) and needs a fresh smoke that preserves verified/partial counts before AB/BA.
