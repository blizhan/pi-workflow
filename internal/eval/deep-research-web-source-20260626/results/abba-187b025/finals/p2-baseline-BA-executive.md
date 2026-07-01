# Executive summary

**Bottom line:** Working conclusion: a small SaaS team should evaluate production RAG answer quality with layered offline and online controls: retrieval metrics, faithfulness/grounding checks, citation-fidelity checks, calibrated LLM-as-judge rubrics, a maintained regression dataset built from curated/synthetic/production cases, trace-based monitoring, and privacy/security controls before logging or evaluator calls. Treat exact metric counts, human-review cadence, and scalar confidence thresholds as local product decisions rather than researched standards.

**Top findings**
- Use separate retrieval, grounding, citation, answer-quality, and production-observability signals rather than one aggregate RAG quality score. (docs.ragas.io: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/)
- LLM judges are useful scalable proxies only when calibrated with explicit rubrics, separated criteria, human-labeled held-out examples, and bias checks. (docs.smith.langchain.com: https://docs.smith.langchain.com/evaluation/how_to_guides/llm_as_judge)
- Maintain an offline regression dataset from curated cases, production traces, and synthetic generation; feed failing production traces back into it. (docs.smith.langchain.com: https://docs.smith.langchain.com/evaluation/concepts)

**Recommended next steps**
- Implement a layered scorecard: retrieval precision/recall, faithfulness/grounding, citation support, task correctness/usefulness, and production health signals. (docs.ragas.io: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)
- Use LLM-as-judge only with rubric prompts, separated dimensions, held-out human-labeled validation, and periodic bias checks. (arxiv.org: https://arxiv.org/abs/2306.05685)
- Create a regression dataset from curated examples, historical traces, and synthetic edge cases; add failing production examples back before redeploying fixes.

**Key caveats / gaps**
- ALCE supports NLI-based citation recall and irrelevant-citation precision, but not a general requirement that all redundant or non-minimal citations be penalized.
- Small-SaaS cadence and exact human-review sampling rates are pragmatic synthesis, not primary-source standards.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 15 verified, 1 partially supported, 0 unsupported, 0 conflicting claims; fact slots 11 filled, 4 partial, 0 missing/conflicting.
