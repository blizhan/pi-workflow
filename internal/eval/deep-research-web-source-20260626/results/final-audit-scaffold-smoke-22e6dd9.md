# Final-audit scaffold smoke — 22e6dd9

Commit under test: `22e6dd9 perf: scaffold deep research final audit`

Artifacts (ignored runtime output): `.tmp/deep-research-e1-scaffold-smoke-20260628/results/`

## Summary

The deterministic scaffold preserved the automated quality gates in all three smoke prompts, but it did **not** improve speed. P1/P2 final-audit remained about 5.36 minutes and total wall-clock was slower than the latest `1403870` AB/BA current runs. P3 is not a valid speed sample because the run was interrupted during the first final-audit attempt, then resumed; the first final-audit attempt failed with provider/WebSocket idle timeouts and the resumed attempt made wall-clock 47.89 minutes.

This experiment is therefore a quality-clean but speed-negative result. Do not claim a speed win from this scaffold. The likely reason is that the scaffold draft was larger/duplicative (~60-70KB) and the model still performed a full final-audit synthesis with several `workflow_artifact` reads.

## Metrics

| Prompt | Run | Status | Minutes | Final-audit span | Verified | Partial | Failed tools | Source reads | Fetches | Quality |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P1 | `workflow_mqxdk403_8c701a` | completed | 20.27 | 5.37 | 13 | 3 | 0 | 76 | 19 | true |
| P2 | `workflow_mqxeapec_02c3fe` | completed | 19.42 | 5.36 | 14 | 2 | 0 | 107 | 19 | true |
| P3 | `workflow_mqxf01mw_213fed` | completed | 47.89 | 23.60 | 16 | 0 | 0 | 89 | 17 | true |

## Quality gates

All three prompts passed:

- `audit-final-count-consistency`
- `planned-slots-preserved-in-normalize`
- `planned-slots-preserved-in-final`
- `source-ref-join-failures-zero`
- `visible-recommendation-citation-or-label`
- `open-gaps-visible-in-executive`
- `no-truncated-executive-with-open-gaps`
- `no-local-cache-paths-in-final-control`

Additional quality invariants:

- `missingFromNormalize`: 0 for P1/P2/P3
- `missingFromFinal`: 0 for P1/P2/P3
- `sourceRefJoinFailures`: 0 for P1/P2/P3
- failed tools: 0 for P1/P2/P3

## Interpretation

- Quality proxy: pass.
- Reliability: pass.
- Speed: fail.
- Next action: revise the final-audit approach to reduce model-visible scaffold duplication, or revert this scaffold if no smaller no-regression variant is kept.

## Follow-up compact editorial packet probe

An uncommitted follow-up tried reading `$.editorialPacket` instead of the full scaffold draft. P1 completed as `workflow_mqxgz7sh_6cbb29` with quality checks passing, but it still failed the quality-no-regression bar for this workstream because it introduced 5 failed tool calls and lowered the P1 verifier outcome to 12 verified / 4 partial. Final-audit span was still 5.44m, so this did not solve the speed bottleneck.

Conclusion: reject the scaffold/editorial-packet direction for now; it is not a reliable no-regression speed lever.
