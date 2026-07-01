# Deep research AB/BA benchmark

Model: openai-codex/gpt-5.5; thinking: low

Baseline root: /Users/toby/pi/pi-subagent-flow-web-source-context/.tmp/deep-research-abba-20260627/roots/baseline-515adb6
Current root: /Users/toby/pi/pi-subagent-flow-web-source-context/.tmp/deep-research-abba-20260627/roots/current-1403870af51756e79e35fee48eda6ff0aca74765

| Prompt | Side | Order | Run | Status | Minutes | Verified | Partial | Failed tools | Source reads | Quality |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|
| P1 | baseline | AB | workflow_mqx24om3_5b6365 | completed | 10.02 | 12 | 4 | 8 | 0 | false |
| P1 | current | AB | workflow_mqx2hkmd_9d7169 | completed | 18.21 | 13 | 3 | 0 | 77 | true |
| P2 | current | BA | workflow_mqx350f8_334c03 | completed | 18.33 | 11 | 5 | 0 | 109 | true |
| P2 | baseline | BA | workflow_mqx3sm1d_e12d90 | completed | 10.15 | 13 | 3 | 1 | 0 | false |
| P3 | baseline | AB | workflow_mqx45owj_c9b934 | completed | 10.78 | 14 | 2 | 1 | 0 | false |
| P3 | current | AB | workflow_mqx4jl2g_a0de22 | completed | 18.7 | 16 | 0 | 0 | 76 | true |

## Averages

```json
{
  "baseline": {
    "count": 3,
    "minutes": 10.32,
    "failedToolCalls": 3.33,
    "sourceReadCalls": 0,
    "verified": 13,
    "partial": 3
  },
  "current": {
    "count": 3,
    "minutes": 18.41,
    "failedToolCalls": 0,
    "sourceReadCalls": 87.33,
    "verified": 13.33,
    "partial": 2.67
  }
}
```
