# Deep research smoke comparison

Single-prompt smokes are noisy and are not speed claims. They check trace cleanliness and obvious quality regressions before/around AB/BA.

| Label | Variant | Run | Min | Final audit min | Normalize min | Failed tools | Artifact calls | V/P/U/C | Missing final slots | Quality |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| p1-current-AB | b7ba664 P1 current AB | workflow_mqv5r0kb_0aa7bb | 16.42 | 4.01 | 4.05 | 7 | 28 | 12/4/0/0 |  | true |
| p1-artifact-prompt-fix-smoke | artifact guidance commit | workflow_mqv92w15_ee0d5a | 18.25 | 4.12 | 3.87 | 1 | 23 | 12/4/0/0 |  | true |
| p1-packet-shrink-smoke | rejected: shortened normalize prompt | workflow_mqvavdqv_d80cef | 19.74 | 3.47 | 4.12 | 0 | 6 | 9/7/0/0 |  | true |
| p1-normalize-packet-detailed-smoke | current P1 candidate: detailed packet normalize + final packet-only | workflow_mqvcfqc8_791a7a | 20.33 | 2.99 | 4.09 | 0 | 8 | 12/4/0/0 |  | true |
| p3-packet-reorder-smoke | packet reorder/removing duplicate ledger: quality fixed, before normalize guidance | workflow_mqvgvvus_161fc9 | 19.09 | 4.93 | 4.33 | 2 | 6 | 15/1/0/0 |  | true |
| p3-projection-guidance-smoke | current P3 candidate: normalize projection guidance | workflow_mqvhmtym_81d709 | 19.01 | 4.84 | 3.97 | 0 | 3 | 15/1/0/0 |  | true |

## Notes

- `p1-packet-shrink-smoke` is retained as negative evidence: it removed tool failures but reduced verified claims from 12 to 9 on P1.
- `p3-packet-reorder-smoke` showed that removing the duplicated by-status ledger and moving fact slots earlier fixed the planned-slot preservation failure, but still had 2 failed artifact calls.
- `p3-projection-guidance-smoke` passed the proxy checks with 0 failed tool calls after explicit normalize projection guidance.
