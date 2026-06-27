# Executive summary

**Bottom line:** Working conclusion: a small SaaS team should report AI inference energy/carbon as an engineering estimate, not a compliance-grade carbon inventory. Use an SCI-style boundary and functional unit; collect direct GPU/CPU/host telemetry when infrastructure is controlled; use AWS/GCP/Azure aggregate cloud carbon exports for cloud-estate context; and use token/request/runtime logs plus labeled proxies for managed GenAI APIs because inspected OpenAI, Bedrock, and Vertex/Gemini API references do not expose per-call energy/carbon fields. Avoid universal factors for grid carbon intensity, PUE, or model energy; publish assumptions and confidence.

**Top findings**
- Direct telemetry is strongest when the team controls inference infrastructure: NVIDIA DCGM/dcgm-exporter can expose GPU power/energy and utilization, and Linux powercap/RAPL exposes CPU package energy counters.
- Major cloud carbon tools are useful for delayed aggregate cloud-emissions reporting, but not per-request AI inference telemetry.
- For managed LLM APIs, inspected OpenAI, Bedrock, and Vertex/Gemini references expose usage, token, invocation, or generation metadata rather than per-call energy/carbon fields.

**Recommended next steps**
- Adopt an SCI-style reporting template for any customer/product/request estimate: boundary, functional unit, measurement period, energy source, carbon-intensity source, PUE treatment, embodied-emissions treatment, allocation denominator, and confidence label. (github.com: https://github.com/Green-Software-Foundation/sci/blob/main/SPEC.md)
- If self-hosting or controlling GPU nodes, instrument DCGM/dcgm-exporter for GPU counters and collect workload logs that include model, prompt/prefill tokens, decode/output tokens, batch size, latency, cache status, and hardware-time denominator.
- For managed LLM APIs, do not claim measured per-call energy/carbon unless the provider supplies such telemetry. Report token/request-based estimates as modeled proxies and label provider coverage gaps.

**Key caveats / gaps**
- Credible AI inference reporting should disclose uncertainty/confidence, but inspected SCI sources support boundary/methodology/factor disclosure more directly than a formal uncertainty requirement.
- Small-SaaS tool choice by stack is supported at the category level, but exact production fit and maintenance quality require current release/activity checks.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 14 verified, 2 partially supported, 0 unsupported, 0 conflicting claims; fact slots 10 filled, 2 partial, 0 missing/conflicting.
