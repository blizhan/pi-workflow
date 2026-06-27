# Blind domain/quality score — deep-research AB/BA

Scoring was completed blind from `quality-judge/blind` before reading `BLIND_MAPPING.json`. Scores are 1–5, where 5 is best. For **overclaiming risk**, 5 means low overclaiming risk / well-controlled claims; 1 means high risk.

## Summary table

| Prompt | Candidate | Directness | Evidence support visible | Caveat handling | Small-team usefulness | Completeness | Overclaim control | Winner? |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| P1 energy/carbon | A | 5 | 5 | 5 | 5 | 5 | 5 | **Winner** |
| P1 energy/carbon | B | 4 | 4 | 5 | 4 | 4 | 4 |  |
| P2 RAG quality | A | 5 | 4 | 5 | 4 | 4 | 5 |  |
| P2 RAG quality | B | 4 | 5 | 5 | 5 | 5 | 4 | **Winner, narrow** |
| P3 agent safety | A | 5 | 5 | 5 | 5 | 5 | 5 | **Winner** |
| P3 agent safety | B | 4 | 4 | 4 | 4 | 4 | 4 |  |

## P1 — energy/carbon measurement

**Winner: Candidate A.**

Candidate A is more directly aligned to the practical decision: separate measured self-hosted/dedicated inference from proxy/modelled managed-API estimates. It has strong visible evidence coverage across hardware telemetry, provider carbon dashboards, OpenAI/Anthropic usage limits, SCI/GHG framing, tooling, and explicit non-numeric caveats. Its action plan is immediately usable by a small SaaS team.

Candidate B is solid and appropriately cautious, but has more partial coverage and blocking gaps, especially around Azure normalization, Intel/RAPL/cloud telemetry, exact grid-factor usage, and hosted API caveats. It is useful, but less complete and somewhat less direct for the managed LLM API question.

## P2 — RAG quality evaluation

**Winner: Candidate B, narrow.**

Candidate A is clear, careful, and very usable: it separates retrieval/generation/citation/security, avoids hard cost/timeline claims, and handles LLM-judge limitations well.

Candidate B wins narrowly because it is more complete and operationally specific for a small team: ranked retrieval labels, claim-level groundedness, living/versioned golden sets, calibrated judges, tracing/span instrumentation, sampled human review, vendor data-handling review, and production monitoring are pulled into a coherent staged program. It has minor presentation artifacts in the executive caveats and a slightly higher risk of tool-specific overreach, but the caveats are generally explicit and the implementation guidance is stronger.

## P3 — agent safety

**Winner: Candidate A.**

Candidate A is substantially stronger. It gives a comprehensive default-deny security baseline for coding agents, with clear separation of local and CI controls, default-deny egress, workspace-scoped writes, ephemeral/JIT runner guidance, least-privilege/OIDC credentials, dependency-install hardening including npm and pip, logging, and an incident playbook. It also keeps vendor-specific guarantees appropriately caveated.

Candidate B is credible and practical, especially for GitHub Actions, Claude Code, Docker, npm, and OWASP basics. However, it leans more on generic Docker container behavior, has more partials around egress, writable paths, audit telemetry, and IR, and is less complete on short-lived credentials, Codex/Docker sandbox specifics, pip/source-build risk, and runner persistence nuance.

## Deblinded summary: baseline vs current

After scoring, `BLIND_MAPPING.json` maps candidates as follows:

- P1: A = **baseline**, B = current → **baseline wins**.
- P2: A = current, B = **baseline** → **baseline wins narrowly**.
- P3: A = **baseline**, B = current → **baseline wins**.

Overall result: **baseline wins 3/3 pairwise comparisons** in this blind domain/quality review. Current outputs are generally competent and cautious, but in this sample they lag baseline on either completeness/evidence coverage (P1, P3) or practical operational synthesis (P2).