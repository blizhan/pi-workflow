# Deep research AB/BA benchmark — 2026-06-26

Roots:
- baseline: clean git archive of `515adb6`
- current: clean git archive of `b7ba664`
- each root had fresh `npm ci --ignore-scripts`, `npm run build`, and run-local `.pi/` artifacts.

| Prompt | Side | Order | Run | Status | Min | Claims | V/P/U/C | Tools | Failed tools | Fetch | Source read | Quality | Gate integrity |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| P1 | baseline | AB | workflow_mqv5d5gj_b3c605 | completed | 10.42 | 16 | 15/1/0/0 | 163 | 3 | 106 | 0 | false | invalid 0, missing 0, dup 0 |
| P1 | current | AB | workflow_mqv5r0kb_0aa7bb | completed | 16.42 | 16 | 12/4/0/0 | 143 | 7 | 18 | 80 | true | invalid 0, missing 0, dup 0 |
| P2 | current | BA | workflow_mqv6cm0k_5af9b1 | completed | 18.15 | 16 | 13/3/0/0 | 169 | 7 | 26 | 100 | true | invalid 0, missing 0, dup 0 |
| P2 | baseline | BA | workflow_mqv70ez9_87c31e | completed | 12.85 | 16 | 14/2/0/0 | 180 | 3 | 126 | 0 | false | invalid 0, missing 0, dup 0 |
| P3 | baseline | AB | workflow_mqv7hfer_1e7e57 | completed | 11.03 | 16 | 13/3/0/0 | 163 | 2 | 114 | 0 | false | invalid 0, missing 0, dup 0 |
| P3 | current | AB | workflow_mqv7w2dv_be0f1e | completed | 17.62 | 16 | 14/2/0/0 | 176 | 8 | 21 | 98 | true | invalid 0, missing 0, dup 0 |

## Averages

```json
{
  "averages": {
    "baseline": {
      "count": 3,
      "minutes": 11.43,
      "toolCalls": 168.67,
      "failedToolCalls": 2.67,
      "resultChars": 1858396,
      "sourceReadCalls": 0,
      "fetchCalls": 115.33,
      "claimTotal": 16,
      "verified": 14,
      "partial": 2,
      "sourceRefJoinFailures": 0
    },
    "current": {
      "count": 3,
      "minutes": 17.4,
      "toolCalls": 162.67,
      "failedToolCalls": 7.33,
      "resultChars": 673322,
      "sourceReadCalls": 92.67,
      "fetchCalls": 21.67,
      "claimTotal": 16,
      "verified": 13,
      "partial": 3,
      "sourceRefJoinFailures": 0
    }
  },
  "deltas": {
    "minutesCurrentMinusBaseline": 5.97,
    "minutesPercent": 52.23,
    "toolCallsPercent": -3.56,
    "failedToolCallsDelta": 4.66,
    "resultCharsPercent": -63.77,
    "verifiedDelta": -1,
    "partialDelta": 1
  }
}
```

## Notes

- This is interleaved AB/BA across three prompts, not a human/domain-scored evaluation.
- Quality proxy uses existing authoritative artifact checks; it is not sufficient for public quality claims.
- Current keeps full source cache artifacts but exposes compact cards/source reads to models.
