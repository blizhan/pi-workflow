# Deep Research prompt shrink smoke — 5a1a8ce

Compared local commit `5a1a8ce` against the prior current AB/BA metrics at `187b025`.

## Code changes under smoke

- Removed `research-questions.sourceProjection` so research tasks receive compact item prompts instead of inlined plan slices.
- Removed `final-audit.sourceProjection`; final audit reads `final-audit-packet.control` at `$.packet` explicitly.
- Changed standard-depth planning hard cap from 12 to 8 (target remains 6).
- Added `workflow_artifact` source-prefixed path compatibility (for example `$.plan.factSlots` can resolve as `$.factSlots` when reading `source=plan`).

## Current-head smoke runs

| Prompt | Run ID | Wall clock | Tasks | Quality proxy | Verified / partial | Failed tools | Result chars |
|---|---|---:|---:|---|---:|---:|---:|
| P1 AI energy/carbon reporting | `workflow_mqvwubrn_bb7800` | 17.06m | 29 | PASS | 16 / 0 | 2 `workflow_artifact` | 457,715 |
| P2 RAG answer quality monitoring | `workflow_mqvxim35_afffe9` | 19.28m | 30 | PASS | 13 / 3 | 1 `workflow_artifact` | 597,818 |
| P3 AI coding agent safety | `workflow_mqvy9h31_3c62dc` | 23.25m | 29 | PASS | 16 / 0 | 0 | 493,679 |

## Comparison to prior current AB/BA metrics (`187b025`)

| Metric | `187b025` current avg | `5a1a8ce` smoke avg | Direction |
|---|---:|---:|---|
| Wall clock | 19.88m | 19.86m | Flat, not a speed win |
| Verified claims | 13.33 | 15.00 | Better proxy quality |
| Result chars | 565,941 | 516,404 | Lower context/tool-output pressure |
| Failed tools | 0 | 3 | Worse; artifact path guesses remain |

## Rejected/diagnostic variants

- Standard hard cap `6` looked good on P2 but was unstable on P1/P3, including a P1 smoke with 10 verified / 6 partial.
- A concise item-only research prompt reduced the explicit source-context wording but produced more `workflow_artifact` failures in the P3 smoke (4 failures) and 15 verified / 1 partial, so it was reverted.
- One P1 attempt (`workflow_mqvut85s_fb9dd5`) was interrupted after an `ENOSPC` supervisor write failure. Temporary AB/BA worktree roots under `.tmp/deep-research-abba-20260626/roots` were deleted to free local disk; versioned eval artifacts under `internal/eval/...` were preserved.

## Conclusion

The commit is not enough to support a speed claim: average wall clock was flat versus the prior current benchmark. It did improve the automated quality proxy and reduce result characters, but new `workflow_artifact` failures mean a full AB/BA should wait for either cleaner artifact-read behavior or a stronger speed signal.
