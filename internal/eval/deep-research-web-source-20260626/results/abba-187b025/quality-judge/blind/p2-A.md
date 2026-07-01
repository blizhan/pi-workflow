# P2 RAG quality — Candidate A

## Executive

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


## Compact final audit control

```json
{
  "digest": "Standard-depth RAG evaluation research brief: 12 verified, 4 partially supported, 0 unsupported/conflicting; strongest guidance supports layered retrieval, grounding, judge calibration, human review, monitoring, and security controls, with exact metric/citation/drift details still partial.",
  "finalReport": {
    "summary": "For a RAG evaluation program, use a layered approach: retrieval/ranking metrics, answer-grounding/faithfulness checks, citation-quality checks, calibrated LLM-as-judge rubrics, curated regression datasets, sampled human/domain review, production trace monitoring, and explicit privacy/security controls. The audit found no unsupported or conflicting core claims, but several areas remain partial: exact MRR/hit-rate formulas as authoritative IR guidance, span-level citation criteria, inter-rater human review procedures, synthetic-data distribution risks, drift thresholds, and some tool-specific monitoring/CI details.",
    "researchMetadata": {
      "depth": "standard",
      "taskType": "research_survey",
      "expectedFinalShape": "research_brief",
      "researchQuestions": 8,
      "sourcePolicy": {
        "preferredSourceClasses": [
          "official documentation for tools/frameworks",
          "peer-reviewed or widely cited evaluation papers",
          "official security/privacy guidance such as OWASP, NIST, cloud/provider docs",
          "open-source repositories and release documentation",
          "reputable industry engineering posts with concrete methods"
        ],
        "primaryRequiredFor": [
          "tool capabilities",
          "privacy/security guidance",
          "policy-like statements about data handling",
          "versioned API/tool features"
        ],
        "sourceQualityRules": [
          "Prefer current official docs for tool features; note access date/current date where relevant.",
          "Use papers or benchmark reports for metric validity, LLM-as-judge reliability, and evaluation limitations.",
          "Do not rely on vendor marketing claims without corroborating from docs or examples.",
          "For security/privacy, use authoritative security guidance first and clearly distinguish general LLM risks from RAG-specific evaluation risks.",
          "Avoid unsupported numeric estimates unless sourced; qualitative effort categories are acceptable when exact costs vary."
        ]
      },
      "plannedFactSlots": 18,
      "filledFactSlots": 9,
      "partialFactSlots": 9,
      "missingFactSlots": 0,
      "verifierIntegrity": {
        "total": 16,
        "unchanged": 15,
        "downgraded": 1,
        "identityRejoined": 16,
        "sourceRefsRejoined": 16,
        "sourceRefJoinFailures": 0,
        "invalidVerifierRows": 0,
        "duplicateVerifierRows": 0,
        "missingVerifierResults": 0
      }
    },
    "coverageSummary": {
      "verified": 12,
      "partiallySupported": 4,
      "unsupported": 0,
      "conflicting": 0,
      "depth": "standard",
      "researchQuestions": 8,
      "verificationCandidates": 16,
      "preserved": 6,
      "unverifiedButRelevant": 6,
      "coverageGaps": [
        {
          "scopeItem": "retrieval metrics",
          "relatedFactSlotIds": [
            "slot-001"
          ]
        },
        {
          "scopeItem": "citation checks",
          "relatedFactSlotIds": [
            "slot-004"
          ]
        },
        {
          "scopeItem": "human review",
          "relatedFactSlotIds": [
            "slot-006"
          ]
        },
        {
          "scopeItem": "synthetic datasets",
          "relatedFactSlotIds": [
            "slot-008"
          ]
        },
        {
          "scopeItem": "drift monitoring",
          "relatedFactSlotIds": [
            "slot-009"
          ]
        },
        {
          "scopeItem": "privacy/security risks",
          "relatedFactSlotIds": [
            "slot-010"
          ]
        },
        {
          "scopeItem": "tools/frameworks",
          "relatedFactSlotIds": [
            "slot-012",
            "slot-015"
          ]
        }
      ]
    },
    "factSlotCoverage": [
      {
        "slotId": "slot-001",
        "label": "Definitions and formulas for core retrieval metrics",
        "status": "partial",
        "bestValue": "Ragas context recall/precision and scikit-learn nDCG strong; MRR/hit-rate need stronger exact formulas.",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/",
          "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ndcg_score.html"
        ],
        "sourceQuality": "official partial",
        "verificationCandidateIds": [
          "claim-001"
        ],
        "gapReason": "MRR/hit-rate weak or secondary.",
        "parentImpact": "High: final metrics table needs exactness."
      },
      {
        "slotId": "slot-002",
        "label": "Limitations of retrieval metrics for final answer quality",
        "status": "partial",
        "bestValue": "Retrieval and generation/faithfulness are separate dimensions.",
        "sourceUrls": [
          "https://arxiv.org/abs/2309.15217"
        ],
        "sourceQuality": "paper/preprint",
        "verificationCandidateIds": [
          "claim-002"
        ],
        "gapReason": "Could use more peer-reviewed end-to-end corroboration.",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-003",
        "label": "Faithfulness/groundedness methods",
        "status": "filled",
        "bestValue": "Claim extraction plus context-support/inference checking.",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-003"
        ],
        "gapReason": "",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-004",
        "label": "Citation correctness methods",
        "status": "partial",
        "bestValue": "Citation quality separate from correctness; specific cited support/span checking needs exact verification.",
        "sourceUrls": [
          "https://arxiv.org/abs/2305.14627"
        ],
        "sourceQuality": "paper/preprint",
        "verificationCandidateIds": [
          "claim-004"
        ],
        "gapReason": "Exact citation support/span metrics not fully harvested.",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-005",
        "label": "LLM-as-judge patterns and limits",
        "status": "filled",
        "bestValue": "Structured rubrics/graders are practical; biases and calibration risks documented.",
        "sourceUrls": [
          "https://arxiv.org/abs/2306.05685",
          "https://arxiv.org/abs/2303.16634"
        ],
        "sourceQuality": "papers plus docs",
        "verificationCandidateIds": [
          "claim-005",
          "claim-006"
        ],
        "gapReason": "",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-006",
        "label": "Human review workflows",
        "status": "partial",
        "bestValue": "Use domain experts for sensitive domains and keep audit records.",
        "sourceUrls": [
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ],
        "sourceQuality": "industry guide",
        "verificationCandidateIds": [
          "claim-007"
        ],
        "gapReason": "Inter-rater agreement/adjudication methods not sourced.",
        "parentImpact": "Medium."
      },
      {
        "slotId": "slot-007",
        "label": "Golden dataset practices",
        "status": "filled",
        "bestValue": "Curated datasets/reference outputs, maintained metadata, production feedback loop.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-008"
        ],
        "gapReason": "",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-008",
        "label": "Synthetic dataset practices and risks",
        "status": "partial",
        "bestValue": "Ragas scenario/testset generation can bootstrap coverage; production validation needed.",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/test_data_generation/rag"
        ],
        "sourceQuality": "primary docs plus inferred risk",
        "verificationCandidateIds": [
          "claim-009"
        ],
        "gapReason": "Distribution mismatch/label leakage risk lacks strong direct source.",
        "parentImpact": "Medium."
      },
      {
        "slotId": "slot-009",
        "label": "Production drift monitoring approaches",
        "status": "partial",
        "bestValue": "Online trace evals, anomaly detection, dashboards/alerts, RAG triad metrics.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-010"
        ],
        "gapReason": "Specific query/retrieval-score/corpus/embedding/model drift thresholds not sourced.",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-010",
        "label": "Privacy/security risks",
        "status": "filled",
        "bestValue": "Sensitive eval data, vendor data-processing, logging, indirect prompt injection, and controls require primary security/vendor guidance.",
        "sourceUrls": [
          "https://genai.owasp.org/llmrisk/llm01-prompt-injection",
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy"
        ],
        "sourceQuality": "authoritative primary",
        "verificationCandidateIds": [
          "claim-011",
          "claim-012"
        ],
        "gapReason": "",
        "parentImpact": "Critical."
      },
      {
        "slotId": "slot-011",
        "label": "RAGAS capabilities and limitations",
        "status": "filled",
        "bestValue": "RAG metrics and test generation concepts documented; validity/domain transfer remains limitation.",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-013"
        ],
        "gapReason": "",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-012",
        "label": "TruLens capabilities and limitations",
        "status": "partial",
        "bestValue": "Feedback functions and RAG triad documented; monitoring breadth uncertain.",
        "sourceUrls": [
          "https://www.trulens.org/reference/trulens/feedback"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-014"
        ],
        "gapReason": "Production monitoring support not fully established.",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-013",
        "label": "LangSmith/LangChain eval capabilities",
        "status": "filled",
        "bestValue": "Traces, datasets, annotation queues, evaluators, online evals, dashboards/alerts.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-015"
        ],
        "gapReason": "",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-014",
        "label": "LlamaIndex evaluation tooling",
        "status": "filled",
        "bestValue": "Response and retrieval evaluation modules for LLM/RAG apps.",
        "sourceUrls": [
          "https://docs.llamaindex.ai/en/stable/module_guides/evaluating"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-016"
        ],
        "gapReason": "",
        "parentImpact": "Medium."
      },
      {
        "slotId": "slot-015",
        "label": "DeepEval RAG metrics and CI evals",
        "status": "partial",
        "bestValue": "LLM-as-judge metrics score 0-1 with thresholds; CI/RAG-specific details need direct verification.",
        "sourceUrls": [
          "https://deepeval.com/docs/metrics-introduction"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-016"
        ],
        "gapReason": "CI-style and full RAG metric list not fully harvested.",
        "parentImpact": "Medium optional."
      },
      {
        "slotId": "slot-016",
        "label": "Phoenix/RAG observability tools",
        "status": "filled",
        "bestValue": "Traces, eval tests, regressions, production examples, experiments.",
        "sourceUrls": [
          "https://arize.com/docs/phoenix"
        ],
        "sourceQuality": "primary docs",
        "verificationCandidateIds": [
          "claim-016"
        ],
        "gapReason": "",
        "parentImpact": "Medium optional."
      },
      {
        "slotId": "slot-017",
        "label": "Minimal small SaaS stack",
        "status": "partial",
        "bestValue": "Start with curated cases, tracing/online evals, regression datasets, sampled human review, privacy controls, and one workflow plus one metric tool.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://arize.com/docs/phoenix"
        ],
        "sourceQuality": "synthesis from primary docs/security sources",
        "verificationCandidateIds": [
          "claim-008",
          "claim-012",
          "claim-015"
        ],
        "gapReason": "Effort categories/cadence are synthesized; exact costs vary.",
        "parentImpact": "High."
      },
      {
        "slotId": "slot-018",
        "label": "Automated-eval uncertainty and evidence gaps",
        "status": "filled",
        "bestValue": "Judge bias, non-determinism, reference dependence, and benchmark transfer limits require calibration/human review.",
        "sourceUrls": [
          "https://arxiv.org/abs/2306.05685",
          "https://docs.smith.langchain.com/evaluation"
        ],
        "sourceQuality": "papers plus primary docs",
        "verificationCandidateIds": [
          "claim-002",
          "claim-005"
        ],
        "gapReason": "",
        "parentImpact": "High."
      }
    ],
    "mainFindings": [
      {
        "finding": "Retrieval metrics are necessary but insufficient: they diagnose retrieved context coverage/ranking, while faithfulness and factual correctness are separate answer-level dimensions.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/",
          "https://arxiv.org/html/2309.15217",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness"
        ]
      },
      {
        "finding": "LLM-as-judge evaluations can scale rubric-based assessment, but documented biases mean they need explicit criteria, structured graders, calibration, and human review rather than blind acceptance.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://arxiv.org/abs/2306.05685",
          "https://arxiv.org/abs/2303.16634",
          "https://platform.openai.com/docs/guides/evals"
        ]
      },
      {
        "finding": "Golden/regression datasets should be curated, metadata-managed, and updated from production feedback; synthetic RAG test data can bootstrap coverage but should be checked against realistic traffic and domain review.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/evaluation/how_to_guides/manage_datasets_programmatically",
          "https://docs.ragas.io/en/stable/concepts/test_data_generation/rag",
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ]
      },
      {
        "finding": "Production monitoring should combine online evaluations on traces, RAG-triad-style measures, dashboards/alerts, and feedback loops into offline datasets.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/observability/how_to_guides/monitoring",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad"
        ]
      },
      {
        "finding": "RAG evaluation has privacy and security exposure because evaluation data may include user inputs, retrieved contexts, generated responses, and references; indirect prompt injection from retrieved external content is directly relevant.",
        "evidenceStatus": "verified/partially_supported",
        "sourceUrls": [
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy",
          "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/",
          "https://docs.ragas.io/en/latest/concepts/components/eval_dataset/",
          "https://genai.owasp.org/llmrisk/llm01-prompt-injection",
          "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"
        ]
      },
      {
        "finding": "Tooling coverage is broad: Ragas, TruLens, LangSmith, LlamaIndex, DeepEval, and Phoenix each cover parts of RAG evaluation/observability, with LangSmith and Phoenix strongest in the audited evidence for workflow/monitoring breadth.",
        "evidenceStatus": "verified with some partial tool slots",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad",
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.llamaindex.ai/en/stable/module_guides/evaluating",
          "https://deepeval.com/docs/metrics-introduction",
          "https://arize.com/docs/phoenix"
        ]
      }
    ],
    "recommendations": [
      {
        "recommendation": "Adopt a layered evaluation scorecard: retrieval metrics, grounding/faithfulness, answer relevance/correctness, citation quality, and human review for sensitive or high-impact cases.",
        "evidenceStatus": "verified plus partial for exact retrieval/citation details",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness",
          "https://arxiv.org/abs/2305.14627",
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ]
      },
      {
        "recommendation": "For a small SaaS team, start with one workflow/observability tool plus one metric library rather than building tracing, datasets, dashboards, and judges from scratch; treat this as synthesis, not a single-source mandate.",
        "evidenceStatus": "synthesis from verified/partial evidence",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://arize.com/docs/phoenix",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics"
        ]
      },
      {
        "recommendation": "Do not set hard numeric launch thresholds from this research packet unless the exact threshold is sourced and validated locally; use calibration against curated examples and sampled human review.",
        "evidenceStatus": "verified rationale; numeric thresholds not established",
        "sourceUrls": [
          "https://arxiv.org/abs/2306.05685",
          "https://arxiv.org/abs/2303.16634",
          "https://docs.smith.langchain.com/evaluation"
        ]
      },
      {
        "recommendation": "Run privacy/security review before sending prompts, retrieved chunks, traces, labels, or reference answers to external judges or observability systems; implement OWASP-style controls for indirect prompt injection.",
        "evidenceStatus": "verified/partially_supported",
        "sourceUrls": [
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy",
          "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/",
          "https://genai.owasp.org/llmrisk/llm01-prompt-injection",
          "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"
        ]
      }
    ],
    "actionPlan": [
      {
        "step": "Define evaluation dimensions and map each to metrics: retrieval coverage/ranking, grounding, answer relevance/correctness, citation quality, safety/security, and user feedback.",
        "evidenceStatus": "verified/partial",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad",
          "https://arxiv.org/abs/2305.14627"
        ]
      },
      {
        "step": "Create a curated regression dataset with metadata and seed it from critical examples, production failures, and representative user queries; add production feedback back into the offline set.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/evaluation/how_to_guides/manage_datasets_programmatically"
        ]
      },
      {
        "step": "Add LLM-as-judge rubrics with explicit grading criteria, then calibrate against human/domain review samples and keep audit records of cases, outputs, scores, and deployment decisions.",
        "evidenceStatus": "verified",
        "sourceUrls": [
          "https://platform.openai.com/docs/guides/evals",
          "https://arxiv.org/abs/2303.16634",
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ]
      },
      {
        "step": "Instrument production traces and online evaluations, dashboards/alerts, and feedback loops; avoid unsourced drift thresholds until local baselines are collected.",
        "evidenceStatus": "verified with threshold gap",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/observability/how_to_guides/monitoring",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad"
        ]
      },
      {
        "step": "Select tooling based on stack fit: Ragas for metrics/test generation, LangSmith or Phoenix for broader workflows/observability, TruLens for RAG-triad/feedback functions, LlamaIndex if already using its RAG stack, and DeepEval where thresholded LLM-as-judge metrics fit.",
        "evidenceStatus": "verified/partial by tool",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics",
          "https://docs.smith.langchain.com/evaluation",
          "https://arize.com/docs/phoenix",
          "https://www.trulens.org/reference/trulens/feedback",
          "https://docs.llamaindex.ai/en/stable/module_guides/evaluating",
          "https://deepeval.com/docs/metrics-introduction"
        ]
      }
    ],
    "caveatedFindings": [
      {
        "finding": "The common retrieval metric set can include recall/context recall, precision/context precision, nDCG, MRR, and hit rate, but the exact set is context-dependent and not established as an authoritative required core by the audited sources.",
        "evidenceStatus": "partially_supported",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision",
          "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ndcg_score.html",
          "https://www.evidentlyai.com/ranking-metrics/mean-reciprocal-rank-mrr",
          "https://www.evidentlyai.com/ranking-metrics/evaluating-recommender-systems"
        ]
      },
      {
        "finding": "Faithfulness checks commonly use claim extraction plus context-support/inference checking, but the exact wording remains partially supported in the audit and should not be presented as fully verified without re-inspecting primary docs.",
        "evidenceStatus": "partially_supported",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness",
          "https://docs.confident-ai.com/docs/metrics-faithfulness"
        ]
      },
      {
        "finding": "Citation correctness should be separate from answer correctness; span-specific cited-support checking is plausible but the audited extract did not fully verify exact span-level criteria.",
        "evidenceStatus": "partially_supported",
        "sourceUrls": [
          "https://arxiv.org/abs/2305.14627",
          "https://aclanthology.org/2023.emnlp-main.398",
          "https://raw.githubusercontent.com/princeton-nlp/ALCE/main/README.md",
          "https://raw.githubusercontent.com/princeton-nlp/ALCE/main/eval.py"
        ]
      },
      {
        "finding": "RAG evaluation privacy exposure is well supported for prompts/user inputs, retrieved contexts, responses, and references; the broader wording around traces, logs, labels, and third-party judges was only partially directly quoted.",
        "evidenceStatus": "partially_supported",
        "sourceUrls": [
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy",
          "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/",
          "https://docs.ragas.io/en/latest/concepts/components/eval_dataset/",
          "https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/context_precision/"
        ]
      }
    ],
    "contestedAreas": [],
    "notableUnsupportedClaims": [],
    "unverifiedButRelevant": [
      {
        "claim": "LangSmith docs state a minimal starting point can be 5-10 manually curated examples per critical component.",
        "whyItMatters": "Exact numeric seed-size is useful but was preserved rather than promoted; verify before using as a hard recommendation.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation"
        ]
      },
      {
        "claim": "Azure docs may say prompts/completions/embeddings/training data are not available to other customers/providers and not used for foundation-model training without permission, while samples may be reviewed for abuse monitoring.",
        "whyItMatters": "Vendor-policy detail should be checked at procurement time.",
        "sourceUrls": [
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy"
        ]
      },
      {
        "claim": "AWS Bedrock data-protection guidance may warn against sensitive values in tags/free-form fields, but the captured snippet was truncated.",
        "whyItMatters": "Potential logging/metadata caveat; not core evidence.",
        "sourceUrls": [
          "https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html"
        ]
      },
      {
        "claim": "MRR and hit rate/success@k need a stronger IR/reference source for exact formula claims.",
        "whyItMatters": "Prevents unsupported exact metric tables.",
        "sourceUrls": [
          "https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)",
          "https://www.pinecone.io/learn/series/vector-databases-in-production-for-busy-engineers/rag-evaluation/"
        ]
      },
      {
        "claim": "Small SaaS teams can combine one observability/workflow tool with one metric library instead of building all evaluation infrastructure from scratch.",
        "whyItMatters": "Useful implementation synthesis, but not a single-source fact.",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://arize.com/docs/phoenix",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics"
        ]
      },
      {
        "claim": "Context relevance decline may indicate retrieval/index/query mismatch, but attribution requires change logs and supporting telemetry.",
        "whyItMatters": "Useful diagnostic caveat; partly inferred.",
        "sourceUrls": [
          "https://www.trulens.org/getting_started/core_concepts/rag_triad"
        ]
      }
    ],
    "parentDecisionNotes": [
      {
        "note": "Use layered evaluation rather than a single metric.",
        "whyItMatters": "Retrieval metrics do not prove faithful or correct generated answers, and judge metrics have bias/non-determinism limits.",
        "evidenceStatus": "verified",
        "suggestedParentDecision": "Approve a multi-metric evaluation plan with human calibration for release gates."
      },
      {
        "note": "Avoid hard thresholds or exact metric formula tables where evidence is partial.",
        "whyItMatters": "MRR/hit-rate formulas and drift thresholds were not fully sourced from authoritative references in this packet.",
        "evidenceStatus": "partially_supported/gap",
        "suggestedParentDecision": "Ask for a follow-up source pass before publishing exact metric definitions or launch thresholds."
      },
      {
        "note": "Treat privacy/security as a blocker for production eval instrumentation.",
        "whyItMatters": "RAG eval datasets and traces may contain sensitive inputs, retrieved documents, responses, and references; RAG also adds indirect prompt-injection risk from retrieved content.",
        "evidenceStatus": "verified/partially_supported",
        "suggestedParentDecision": "Require privacy review, data minimization, access controls, and OWASP-style prompt-injection mitigations before externalizing eval data."
      },
      {
        "note": "Tool choice can be pragmatic; no single audited tool covers every need best for every stack.",
        "whyItMatters": "Evidence supports capabilities across Ragas, TruLens, LangSmith, LlamaIndex, DeepEval, and Phoenix, but some monitoring/CI details remain partial.",
        "evidenceStatus": "verified with partial slots",
        "suggestedParentDecision": "Pick based on existing stack and required workflow features; run a short proof-of-concept before committing."
      }
    ],
    "researchScopeCoverage": [
      {
        "scopeItem": "retrieval metrics",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-001",
          "claim-002"
        ]
      },
      {
        "scopeItem": "answer-grounding checks",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-003",
          "claim-014"
        ]
      },
      {
        "scopeItem": "citation checks",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-004"
        ]
      },
      {
        "scopeItem": "LLM-as-judge approaches",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-005",
          "claim-006"
        ]
      },
      {
        "scopeItem": "human review",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-007"
        ]
      },
      {
        "scopeItem": "synthetic datasets",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-009"
        ]
      },
      {
        "scopeItem": "golden datasets",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-008"
        ]
      },
      {
        "scopeItem": "drift monitoring",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-010",
          "claim-015",
          "claim-016"
        ]
      },
      {
        "scopeItem": "privacy/security risks",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-011",
          "claim-012"
        ]
      },
      {
        "scopeItem": "tools/frameworks",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-013",
          "claim-014",
          "claim-015",
          "claim-016"
        ]
      },
      {
        "scopeItem": "uncertainty",
        "status": "covered",
        "verificationCandidateIds": [
          "claim-002",
          "claim-005"
        ]
      },
      {
        "scopeItem": "small SaaS feasibility",
        "status": "covered_partial",
        "verificationCandidateIds": [
          "claim-008",
          "claim-012",
          "claim-015"
        ]
      }
    ],
    "remainingGaps": {
      "blocking": [
        {
          "gap": "Exact formulas/authoritative definitions for MRR and hit rate/success@k were weak or secondary.",
          "whyItMatters": "Blocks publishing a precise metric reference table or hard thresholds.",
          "relatedFactSlotIds": [
            "slot-001"
          ],
          "nextStep": "Fetch stronger IR/reference or official tool documentation for exact formulas before finalizing metric definitions."
        },
        {
          "gap": "Span-level citation support criteria were not fully harvested.",
          "whyItMatters": "Blocks definitive claims that citations prove each cited span supports each statement.",
          "relatedFactSlotIds": [
            "slot-004"
          ],
          "nextStep": "Inspect ALCE full paper metric section and/or evaluation code docs."
        },
        {
          "gap": "Faithfulness claim decomposition/inference wording remains partially supported after one downgrade.",
          "whyItMatters": "Avoid presenting this exact method as verified until primary docs are rechecked.",
          "relatedFactSlotIds": [
            "slot-003"
          ],
          "nextStep": "Fetch or inspect Ragas and Confident AI faithfulness docs for exact claim-decomposition support."
        },
        {
          "gap": "Privacy review details for traces/logs/labels and third-party judges were not fully directly quoted.",
          "whyItMatters": "Security/privacy language should be precise for compliance or procurement decisions.",
          "relatedFactSlotIds": [
            "slot-010"
          ],
          "nextStep": "Verify vendor-specific data handling, retention, logging, and judge-provider terms before production use."
        }
      ],
      "nonBlocking": [
        {
          "gap": "Inter-rater agreement and adjudication procedures for human review were not sourced.",
          "whyItMatters": "Matters for mature evaluation governance but not for initial sampled review.",
          "relatedFactSlotIds": [
            "slot-006"
          ],
          "nextStep": "Add evaluation-design references if building a formal labeling program."
        },
        {
          "gap": "Synthetic-data distribution mismatch and label-leakage risk are inferred rather than strongly directly sourced.",
          "whyItMatters": "Matters when relying heavily on synthetic test sets.",
          "relatedFactSlotIds": [
            "slot-008"
          ],
          "nextStep": "Validate synthetic cases against production traffic and domain review."
        },
        {
          "gap": "Specific drift thresholds for query mix, retrieval scores, corpus, embeddings, and model changes were not sourced.",
          "whyItMatters": "Avoid hard-coded alert thresholds without local baselines.",
          "relatedFactSlotIds": [
            "slot-009"
          ],
          "nextStep": "Collect local baseline telemetry, then calibrate alerts empirically."
        },
        {
          "gap": "Some tool-specific production monitoring and CI details remain partial, especially TruLens production scope and DeepEval CI/RAG list.",
          "whyItMatters": "May affect tool selection but not the overall evaluation architecture.",
          "relatedFactSlotIds": [
            "slot-012",
            "slot-015"
          ],
          "nextStep": "Run targeted tool documentation checks or a proof-of-concept."
        }
      ]
    },
    "sourceRefJoinFailures": []
  },
  "claimVerdictIndex": {
    "claims": [
      {
        "id": "claim-001",
        "status": "partially_supported",
        "confidence": "medium",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision",
          "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ndcg_score.html",
          "https://www.evidentlyai.com/ranking-metrics/mean-reciprocal-rank-mrr",
          "https://www.evidentlyai.com/ranking-metrics/evaluating-recommender-systems"
        ],
        "factSlotIds": [
          "slot-001"
        ],
        "support": "Individual metric definitions/formulas are documented, but the exact required core set is synthesis.",
        "caveat": "MRR and hit-rate evidence comes from ranking/recommender guidance rather than an authoritative IR standard.",
        "correctionOrCounterclaim": "Use context-dependent wording: these are common retrieval/ranking metrics, not a universally mandated set."
      },
      {
        "id": "claim-002",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/",
          "https://arxiv.org/html/2309.15217",
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness"
        ],
        "factSlotIds": [
          "slot-002",
          "slot-018"
        ],
        "support": "Retrieval/ranking metrics and generated-response grounding/accuracy are separate evaluation dimensions.",
        "caveat": "Supported by definitions and separation of dimensions, not a formal impossibility proof.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-003",
        "status": "partially_supported",
        "confidence": "medium",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness",
          "https://docs.confident-ai.com/docs/metrics-faithfulness"
        ],
        "factSlotIds": [
          "slot-003"
        ],
        "support": "Faithfulness/groundedness evidence points to claim/support checking.",
        "caveat": "Exact claim-decomposition wording was not sufficiently verified.",
        "correctionOrCounterclaim": "Re-inspect primary docs before using as fully verified."
      },
      {
        "id": "claim-004",
        "status": "partially_supported",
        "confidence": "medium",
        "sourceUrls": [
          "https://arxiv.org/abs/2305.14627",
          "https://aclanthology.org/2023.emnlp-main.398",
          "https://raw.githubusercontent.com/princeton-nlp/ALCE/main/README.md",
          "https://raw.githubusercontent.com/princeton-nlp/ALCE/main/eval.py"
        ],
        "factSlotIds": [
          "slot-004"
        ],
        "support": "ALCE supports evaluating correctness and citation quality separately.",
        "caveat": "Exact span-support criteria were not fully harvested.",
        "correctionOrCounterclaim": "Claim citation quality separately; verify full metric section before claiming span-level support checking."
      },
      {
        "id": "claim-005",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://arxiv.org/abs/2306.05685",
          "https://arxiv.org/abs/2303.16634"
        ],
        "factSlotIds": [
          "slot-005",
          "slot-018"
        ],
        "support": "LLM-as-judge scale and biases are documented.",
        "caveat": "Bias magnitude and mitigation depend on model, prompt, task, and calibration.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-006",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://platform.openai.com/docs/guides/evals",
          "https://arxiv.org/abs/2303.16634"
        ],
        "factSlotIds": [
          "slot-005"
        ],
        "support": "OpenAI evals and G-Eval support explicit criteria/structured graders.",
        "caveat": "'Rubric-style' is interpretive wording.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-007",
        "status": "verified",
        "confidence": "medium",
        "sourceUrls": [
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ],
        "factSlotIds": [
          "slot-006"
        ],
        "support": "Industry guide supports domain review and record keeping.",
        "caveat": "Does not specify inter-rater/adjudication procedures.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-008",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/evaluation/how_to_guides/manage_datasets_programmatically"
        ],
        "factSlotIds": [
          "slot-007",
          "slot-017"
        ],
        "support": "LangSmith docs support curated datasets, metadata, regression testing, and feeding production issues back offline.",
        "caveat": "LangSmith-specific docs, not universal standard.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-009",
        "status": "verified",
        "confidence": "medium_high",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/test_data_generation/rag",
          "https://www.evidentlyai.com/llm-guide/rag-evaluation"
        ],
        "factSlotIds": [
          "slot-008"
        ],
        "support": "Ragas supports scenario/test generation; Evidently supports review and real-query grounding.",
        "caveat": "'Distribution mismatch' is an inference from representativeness guidance.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-010",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/observability/how_to_guides/monitoring",
          "https://www.trulens.org/getting_started/core_concepts/rag_triad"
        ],
        "factSlotIds": [
          "slot-009"
        ],
        "support": "Online evaluations, trace monitoring, dashboards/alerts, feedback loops, and RAG triad are documented.",
        "caveat": "No specific drift thresholds sourced.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-011",
        "status": "partially_supported",
        "confidence": "medium",
        "sourceUrls": [
          "https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy",
          "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/",
          "https://docs.ragas.io/en/latest/concepts/components/eval_dataset/",
          "https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/context_precision/"
        ],
        "factSlotIds": [
          "slot-010"
        ],
        "support": "Privacy review is supported for prompts/completions/training data and RAG eval fields including user_input, retrieved_contexts, response, reference.",
        "caveat": "Traces/logs/labels and third-party judges were not fully directly quoted.",
        "correctionOrCounterclaim": "Use narrower wording around prompts/user inputs, retrieved contexts, responses, references, and provider/external-service review."
      },
      {
        "id": "claim-012",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html",
          "https://genai.owasp.org/llmrisk/llm01-prompt-injection"
        ],
        "factSlotIds": [
          "slot-010",
          "slot-017"
        ],
        "support": "OWASP sources directly cover RAG/external-content prompt injection and layered defenses.",
        "caveat": "'Require' is best-practice language, not necessarily compliance mandate.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-013",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics",
          "https://docs.ragas.io/en/stable/concepts/test_data_generation/rag"
        ],
        "factSlotIds": [
          "slot-011"
        ],
        "support": "Ragas metric and test-generation capabilities are listed in official docs.",
        "caveat": "Some metrics are under Nvidia Metrics rather than core RAG subsection.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-014",
        "status": "verified",
        "confidence": "medium_high",
        "sourceUrls": [
          "https://www.trulens.org/getting_started/core_concepts/rag_triad",
          "https://www.trulens.org/reference/trulens/feedback"
        ],
        "factSlotIds": [
          "slot-012"
        ],
        "support": "TruLens RAG triad and feedback functions are documented.",
        "caveat": "Production monitoring scope was not directly verified.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-015",
        "status": "verified",
        "confidence": "high",
        "sourceUrls": [
          "https://docs.smith.langchain.com/evaluation",
          "https://docs.smith.langchain.com/observability/how_to_guides/monitoring"
        ],
        "factSlotIds": [
          "slot-013",
          "slot-017"
        ],
        "support": "LangSmith evaluation and monitoring workflow features are documented.",
        "caveat": "Docs pages lacked explicit version/date snapshot in audited packet.",
        "correctionOrCounterclaim": ""
      },
      {
        "id": "claim-016",
        "status": "verified",
        "confidence": "medium_high",
        "sourceUrls": [
          "https://docs.llamaindex.ai/en/stable/module_guides/evaluating",
          "https://deepeval.com/docs/metrics-introduction",
          "https://arize.com/docs/phoenix"
        ],
        "factSlotIds": [
          "slot-014",
          "slot-015",
          "slot-016"
        ],
        "support": "Official docs support LlamaIndex response/retrieval eval, DeepEval 0-1 thresholded LLM-as-judge metrics, and Phoenix traces/evals/regressions/experiments.",
        "caveat": "DeepEval says almost all predefined metrics use LLM-as-judge, not literally every metric.",
        "correctionOrCounterclaim": ""
      }
    ]
  }
}

```
