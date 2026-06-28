# AB/BA interpretation — current 1403870 vs baseline 515adb6

Current commit: `1403870 fix: tolerate workflow artifact path variants`
Baseline commit/root: `515adb6`
Model/thinking: `openai-codex/gpt-5.5`, `low`

| Side | Avg minutes | Avg verified | Avg partial | Avg failed tools | Avg result chars | Quality proxy pass |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 10.32 | 13 | 3 | 3.33 | 1,668,324 | 0/3 |
| current | 18.41 | 13.33 | 2.67 | 0 | 558,813 | 3/3 |

## Decision

- Do **not** claim a speed win: current is slower on wall clock (`18.41m` vs `10.32m` average).
- Current is cleaner on tool reliability and context pressure: failed tools `0` vs `3.33` average, result chars `558,813` vs `1,668,324` average, and quality proxy passes `3/3` vs baseline `0/3`.
- Automated claim quality is roughly flat/slightly better by verified count (`13.33` vs `13.00`) but not enough for a public quality claim without blind/domain scoring.
- Full user-facing quality remains unresolved; previous blind scoring favored baseline before these changes, so repeat blind/domain scoring before claiming quality improvement.

## Rows

| Label | Side | Minutes | Verified | Partial | Failed tools | Result chars | Quality |
|---|---|---:|---:|---:|---:|---:|---:|
| p1-baseline-AB | baseline | 10.02 | 12 | 4 | 8 | 1,565,227 | false |
| p1-current-AB | current | 18.21 | 13 | 3 | 0 | 569,738 | true |
| p2-current-BA | current | 18.33 | 11 | 5 | 0 | 636,713 | true |
| p2-baseline-BA | baseline | 10.15 | 13 | 3 | 1 | 1,565,000 | false |
| p3-baseline-AB | baseline | 10.78 | 14 | 2 | 1 | 1,874,745 | false |
| p3-current-AB | current | 18.7 | 16 | 0 | 0 | 469,987 | true |
