# Deep research AB/BA benchmark

Roots:
- baseline: 515adb6 clean archive
- current: 187b025 clean archive

| Prompt | Side | Order | Run | Status | Min | Claims | V/P/U/C | Tools | Failed tools | Fetch | Source read | Quality | Gate integrity |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| P1 | baseline | AB | workflow_mqvlt237_e3588f | completed | 11.17 | 16 | 14/2/0/0 | 167 | 4 | 110 | 0 | false | invalid 0, missing 0, dup 0 |
| P1 | current | AB | workflow_mqvm7fgb_c083ce | completed | 17.02 | 16 | 12/4/0/0 | 149 | 0 | 21 | 91 | true | invalid 0, missing 0, dup 0 |
| P2 | current | BA | workflow_mqvmtbqk_6cece4 | completed | 25.69 | 16 | 12/4/0/0 | 175 | 0 | 23 | 134 | true | invalid 0, missing 0, dup 0 |
| P2 | baseline | BA | workflow_mqvnqdda_589e47 | completed | 14.55 | 16 | 15/1/0/0 | 178 | 5 | 110 | 0 | false | invalid 0, missing 0, dup 0 |
| P3 | baseline | AB | workflow_mqvo93y6_9cd4df | completed | 11.91 | 16 | 16/0/0/0 | 134 | 2 | 92 | 0 | false | invalid 0, missing 0, dup 0 |
| P3 | current | AB | workflow_mqvoofrc_131efb | completed | 16.92 | 16 | 16/0/0/0 | 111 | 0 | 18 | 70 | true | invalid 0, missing 0, dup 0 |

## Averages

```json
{
  "averages": {
    "baseline": {
      "count": 3,
      "minutes": 12.54,
      "toolCalls": 159.67,
      "failedToolCalls": 3.67,
      "resultChars": 1615575,
      "sourceReadCalls": 0,
      "fetchCalls": 104,
      "claimTotal": 16,
      "verified": 15,
      "partial": 1,
      "sourceRefJoinFailures": 0
    },
    "current": {
      "count": 3,
      "minutes": 19.88,
      "toolCalls": 145,
      "failedToolCalls": 0,
      "resultChars": 565941,
      "sourceReadCalls": 98.33,
      "fetchCalls": 20.67,
      "claimTotal": 16,
      "verified": 13.33,
      "partial": 2.67,
      "sourceRefJoinFailures": 0
    }
  },
  "deltas": {
    "minutesCurrentMinusBaseline": 7.34,
    "minutesPercent": 58.53,
    "toolCallsPercent": -9.19,
    "failedToolCallsDelta": -3.67,
    "resultCharsPercent": -64.97,
    "verifiedDelta": -1.67,
    "partialDelta": 1.67
  }
}
```

## Notes

- This is interleaved AB/BA across three prompts, not a human/domain-scored evaluation.
- Quality proxy uses existing authoritative artifact checks; it is not sufficient for public quality claims.
