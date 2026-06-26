# Executive summary

**Bottom line:** Working conclusion: for a small SaaS team, the best-supported production RAG quality program is layered rather than single-metric: keep retrieval metrics for root-cause diagnosis, evaluate groundedness/answer quality separately, use LLM-as-judge only with rubrics and human calibration, maintain curated regression datasets, monitor production traces and drift, and treat telemetry as sensitive data. The small-team stack recommendation is a practical synthesis, not a directly vendor-mandated pattern.

**Top findings**
- Retrieval metrics are necessary diagnostics but not final RAG quality guarantees. (arxiv.org: https://arxiv.org/abs/2309.15217)
- Groundedness/faithfulness can be evaluated at claim level against retrieved context. (docs.ragas.io: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness)
- LLM-as-judge is scalable but must be calibrated and bias-aware. (arxiv.org: https://arxiv.org/abs/2306.05685)

**Recommended next steps**
- Adopt a layered eval design: retriever metrics, answer groundedness/relevance, calibrated LLM judge checks, and operational traces should be reported separately. (evidence: verified_plus_partial)
- Make curated offline regression datasets the release gate, then use online trace evaluation for production issue detection. (evidence: verified)
- Use LLM-as-judge only with explicit rubrics, human corrections/few-shot calibration, and periodic audit sampling. (docs.smith.langchain.com: https://docs.smith.langchain.com/evaluation/how_to_guides/llm_as_judge)

**Key caveats / gaps**
- Production RAG should track retrieval metrics separately from answer metrics.
- Citation/source validation should combine answer support checks with retrieved-context usefulness/ranking checks.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 13 verified, 3 partially supported, 0 unsupported, 0 conflicting claims; fact slots 6 filled, 7 partial, 0 missing/conflicting.
