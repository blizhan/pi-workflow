# External code review — deep-research HEAD 187b025

## Summary

Re-reviewed current HEAD (`187b025 fix: keep deep research overflow recovery reads`) for the deep-research workflow/spec/helper/eval changes. The previous high issue is addressed at the access-path level: `normalize-claims` again depends on `plan` and `research-questions` in addition to `normalize-input-packet`, so overflow recovery can read upstream controls instead of being limited to the lossy packet (`workflows/deep-research/spec.json:81-99`; unit assertion at `test/unit/unit.test.mjs:7431-7435`).

I did not find a remaining blocker/high issue in the latest fix. Ship recommendation: ship the workflow fix, with the medium follow-ups below tracked before claiming deterministic overflow/integrity hardening.

## Previous high issue status

**Addressed.** The normalizer is no longer isolated to `normalize-input-packet`; current dependencies are `plan`, `research-questions`, and `normalize-input-packet` (`spec.json:83-87`). The prompt now explicitly tells the normalizer to recover overflow using projected reads from upstream `research-questions` controls (`spec.json:99`). This removes the prior hard data-loss path where capped packet arrays (`normalize-input-packet.mjs:178-213`) were the only model-visible source.

Residual risk: the recovery is prompt/tool-use enforced, not a deterministic required-read gate, and the current unit test only checks dependency wiring. Add an overflow regression that forces evidence past the packet caps and asserts the normalizer reads/preserves it.

## Remaining findings

| Severity | Location | Finding |
|---|---|---|
| Medium | `workflows/deep-research/helpers/claim-evidence-gate.mjs:297-319`, `workflows/deep-research/helpers/final-audit-packet.mjs:179-212` | Invalid/duplicate normalized verification candidates are counted but their details are not surfaced in final packet gaps/integrity ledgers. |
| Medium | `workflows/deep-research/helpers/claim-evidence-gate.mjs:100-123` | Candidate-only source-read snippets are rejected only when the verifier preserves candidate metadata. |
| Low | `internal/eval/deep-research-web-source-20260626/scripts/run-abba.mjs:143-153` | The live ABBA runner still reads verifier-integrity fields from stale metrics paths; `summarize.mjs` has the corrected audit-control read path. |

### Medium — invalid normalized candidates can still disappear from synthesis detail

`claim-evidence-gate` records invalid normalized candidates in `invalidNormalizedCandidates` and `gateSummary.invalidNormalizedCandidates`, but does not push them into `remainingGaps` (`claim-evidence-gate.mjs:297-319`, `356-371`). `final-audit-packet` carries `gateSummary`, `invalidVerifierRows`, and `duplicateVerifierRows`, but not the `invalidNormalizedCandidates` detail or count in `invariantChecks.verifierIntegrity`/`overflowLedger` (`final-audit-packet.mjs:179-212`). Because the normalizer schema allows arbitrary objects for `verificationCandidates` (`deep-research-normalize-claims-control.schema.json:21-26`), a malformed or duplicate candidate can lose claim/slot context before final synthesis.

Fix: either tighten the normalize schema to require unique string `id` plus `claim`, or convert invalid normalized candidates into structured `remainingGaps` and copy their compact details into `packet.verifierIntegrity`.

## Validation

- Ran `cd /Users/toby/pi/pi-subagent-flow-web-source-context && npm test`: **288/288 passing**.
- Reviewed untracked ABBA results in `internal/eval/deep-research-web-source-20260626/results/abba-187b025/`: all current runs completed, quality proxy true, gate integrity `invalid 0, missing 0, dup 0`; current reduced result chars but remained slower than baseline.

## Ship recommendation

**Ship 187b025 for the deep-research overflow-read fix.** No remaining blocker/high issue found. Track the medium integrity surfacing and overflow-regression test before making strong quality or deterministic coverage claims.
