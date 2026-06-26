# Deep research P1 smoke comparison

Single-prompt smokes are noisy and are not a speed claim. They are used to check trace cleanliness and obvious quality regressions before AB/BA.

| Label | Variant | Run | Min | Final audit min | Normalize min | Failed tools | Artifact calls | V/P/U/C | Quality |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| p1-current-AB | baseline current before artifact guidance | workflow_mqv5r0kb_0aa7bb | 16.42 | 4.01 | 4.05 | 7 | 28 | 12/4/0/0 | true |
| p1-artifact-prompt-fix-smoke | artifact guidance commit | workflow_mqv92w15_ee0d5a | 18.25 | 4.12 | 3.87 | 1 | 23 | 12/4/0/0 | true |
| p1-packet-shrink-smoke | rejected: shortened normalize prompt | workflow_mqvavdqv_d80cef | 19.74 | 3.47 | 4.12 | 0 | 6 | 9/7/0/0 | true |
| p1-final-packet-only-smoke | final-audit packet-only, original normalize | workflow_mqvbmtnz_ba48a8 | 20.49 | 3.07 | 4.24 | 0 | 7 | 13/3/0/0 | true |
| p1-normalize-packet-detailed-smoke | current candidate: detailed packet normalize + final packet-only | workflow_mqvcfqc8_791a7a | 20.33 | 2.99 | 4.09 | 0 | 8 | 12/4/0/0 | true |

## Notes

- `p1-packet-shrink-smoke` is retained as negative evidence: it removed tool failures but reduced verified claims from 12 to 9 on this prompt.
- The current candidate keeps detailed normalization instructions while routing normalize/final through compact packets; P1 quality proxy passed with 12/4/0/0 and 0 failed tool calls, but wall-clock did not improve in this single smoke.
