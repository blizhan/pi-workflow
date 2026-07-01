# Executive summary

**Bottom line:** For a RAG evaluation program, use a layered approach: retrieval/ranking metrics, answer-grounding/faithfulness checks, citation-quality checks, calibrated LLM-as-judge rubrics, curated regression datasets, sampled human/domain review, production trace monitoring, and explicit privacy/security controls. The audit found no unsupported or conflicting core claims, but several areas remain partial: exact MRR/hit-rate formulas as authoritative IR guidance, span-level citation criteria, inter-rater human review procedures, synthetic-data distribution risks, drift thresholds, and some tool-specific monitoring/CI details.

**Top findings**
- Retrieval metrics are necessary but insufficient: they diagnose retrieved context coverage/ranking, while faithfulness and factual correctness are separate answer-level dimensions. (docs.ragas.io: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/)
- LLM-as-judge evaluations can scale rubric-based assessment, but documented biases mean they need explicit criteria, structured graders, calibration, and human review rather than blind acceptance. (arxiv.org: https://arxiv.org/abs/2306.05685)
- Golden/regression datasets should be curated, metadata-managed, and updated from production feedback; synthetic RAG test data can bootstrap coverage but should be checked against realistic traffic and domain review. (docs.smith.langchain.com: https://docs.smith.langchain.com/evaluation)

**Recommended next steps**
- Adopt a layered evaluation scorecard: retrieval metrics, grounding/faithfulness, answer relevance/correctness, citation quality, and human review for sensitive or high-impact cases. (docs.ragas.io: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness)
- For a small SaaS team, start with one workflow/observability tool plus one metric library rather than building tracing, datasets, dashboards, and judges from scratch; treat this as synthesis, not a single-source mandate. (arize.com: https://arize.com/docs/phoenix)
- Do not set hard numeric launch thresholds from this research packet unless the exact threshold is sourced and validated locally; use calibration against curated examples and sampled human review. (evidence: verified rationale; numeric thresholds not established)

**Key caveats / gaps**
- The common retrieval metric set can include recall/context recall, precision/context precision, nDCG, MRR, and hit rate, but the exact set is context-dependent and not established as an authoritative required core…
- Faithfulness checks commonly use claim extraction plus context-support/inference checking, but the exact wording remains partially supported in the audit and should not be presented as fully verified without re-inspecting primary…

**Audit trail:** Full evidence remains in `final-audit.control.json`: 12 verified, 4 partially supported, 0 unsupported, 0 conflicting claims; fact slots 9 filled, 9 partial, 0 missing/conflicting.
