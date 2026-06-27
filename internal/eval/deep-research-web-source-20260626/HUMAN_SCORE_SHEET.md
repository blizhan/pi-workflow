# Human/domain score sheet — deep-research AB/BA

Use this before any public quality claim. Score each final output independently and blind where possible. The latest prepared blind packet is:

```text
internal/eval/deep-research-web-source-20260626/results/abba-187b025/quality-judge/blind/
```

Mapping is stored separately in `BLIND_MAPPING.json`; do not read it until after scoring.

## Runs in latest packet

| Prompt | Candidate A | Candidate B |
|---|---|---|
| P1 energy/carbon | `p1-A.md` | `p1-B.md` |
| P2 RAG evaluation | `p2-A.md` | `p2-B.md` |
| P3 agent safety | `p3-A.md` | `p3-B.md` |

## Rubric

Score 1-5, where 5 is best. For overclaiming risk, 5 means low risk / well-caveated.

| Dimension | Candidate A | Candidate B | Notes |
|---|---:|---:|---|
| Directly answers the task |  |  |  |
| Factual accuracy / plausible correctness |  |  |  |
| Evidence quality / source fit visible in output |  |  |  |
| Quote/citation support for key claims |  |  |  |
| Handles uncertainty and caveats |  |  |  |
| Practicality for a small SaaS/engineering team |  |  |  |
| Completeness of important dimensions |  |  |  |
| Low overclaiming risk |  |  |  |
| Overall usefulness |  |  |  |

## Pairwise judgment

For each prompt, choose one:

- Candidate A better
- Candidate B better
- Tie / inconclusive

Rationale:

```text

```

## Claim guidance

- Public quality claim requires consistent human/domain preference, not just verified/partial proxy counts.
- Public speed claim requires wall-clock improvement across a larger benchmark; latest current remains slower.
- Public context-pressure claim can reference reduced visible result characters only with precise framing and caveats.
