# Summary

Reviewed the latest local deep-research/source-context commits. The normalized web-source direction is solid and unit tests pass, but I found audit/data-loss and harness issues that should be fixed before shipping the workflow changes broadly.

# Findings

## High — `workflows/deep-research/spec.json`; `workflows/deep-research/helpers/normalize-input-packet.mjs`
**Problem:** `normalize-claims` now depends only on `normalize-input-packet` (`spec.json:81-104`), while the packet mechanically keeps only the first 240 facts / 240 claims / 120 gaps (`normalize-input-packet.mjs:178-213`). For max-depth runs the planned fanout can produce far more than this, and dropped research-question artifacts are no longer readable by the normalizer.
**Fix:** Either keep `plan` + `research-questions` as readable dependencies for `normalize-claims` and prompt recovery reads on overflow, or make the packet stratified by required slot/scope/source quality with per-slot overflow samples. Add a test where late research tasks contain required-slot evidence beyond the cap.

## Medium — `workflows/deep-research/helpers/claim-evidence-gate.mjs`; `workflows/deep-research/helpers/final-audit-packet.mjs`
**Problem:** Invalid or duplicate normalized verification candidates are counted in `gateSummary.invalidNormalizedCandidates` but not added to `remainingGaps`, and the final packet omits their details (`claim-evidence-gate.mjs:297-319`, `final-audit-packet.mjs:178-212`). Final synthesis can therefore miss that verifier coverage was impossible for specific candidates/slots.
**Fix:** Emit invalid normalized candidates as structured gaps with claim/slot context, include them in `verifierIntegrity`, and make final-audit surface them as blocking/non-blocking verifier integrity gaps.

## Medium — `src/subagent-backend.ts`; `src/workflow-web-source-extension.ts`
**Problem:** Custom workflow-web provider extensions are captured and hidden, but launched with `securityPolicy.allowPrivateHosts: false` (`subagent-backend.ts:1306-1316`); the extension then blocks all custom `fetch_content` use unless that flag is true (`workflow-web-source-extension.ts:370-379`). Also only the first provider extension is imported (`subagent-backend.ts:1346-1353`). This makes extension-backed normalized fetch tools unusable or partially missing despite valid tool metadata.
**Fix:** Either reject custom provider metadata for these tools with a clear validation error, or support an explicit trusted-provider config and import all declared provider extensions into the wrapper.

## Medium — `src/workflow-web-source.ts`; `workflows/deep-research/helpers/claim-evidence-gate.mjs`
**Problem:** Term/claim source reads return a quote with `candidateOnly: true` (`workflow-web-source.ts:770-780`), but the audit gate only rejects candidate evidence if the verifier copies `candidateOnly`/`matchType` into its evidence row (`claim-evidence-gate.mjs:104-123`). If the model omits that metadata, a candidate window can satisfy the structured-evidence gate.
**Fix:** Make candidate reads non-verifying by contract (e.g. no `quote` in verifier-eligible field), require a copied `sourceReadStatus/matchType` for every web-source evidence row, or have the audit helper validate quoted text/match metadata against cached sources.

## Low — `internal/eval/deep-research-web-source-20260626/scripts/run-abba.mjs`
**Problem:** ABBA aggregation reads `sourceRefJoinFailures` and `gateSummary` from paths that `extract-metrics.mjs` does not produce (`run-abba.mjs:143-153`), so these integrity fields are always `null` in the aggregate.
**Fix:** Read `metrics.authoritative.audit.sourceRefJoinFailures` and expose/import gate-summary fields from `extract-metrics.mjs`, then fail or warn when they regress.

# Validation gaps

- Ran `npm test` successfully: 288/288 passing.
- Attempted `node src/cli.mjs validate deep-research`; this CLI has no `validate` command, so I could not perform the required `/workflow validate deep-research` equivalent in this child session.
- Did not run live web/deep-research workflows or ABBA; findings are from diffs/static review plus unit tests.

# Ship recommendation

Do not ship as-is for bundled `deep-research` max-depth use. Fix the lossy packet dependency and verifier-integrity surfacing first; then rerun workflow validation, unit tests, and at least one strict eval run with overflow and verifier-integrity assertions.
