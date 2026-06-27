# Executive summary

**Bottom line:** A small SaaS can report AI inference energy/carbon defensibly, but confidence depends on telemetry access. Highest confidence comes from self-hosted or dedicated infrastructure with GPU/CPU energy counters plus request/runtime metrics. Cloud carbon dashboards support account-level baselines but are not usually request-level AI telemetry. Hosted AI APIs generally expose usage denominators such as tokens or requests, not provider-side energy per call in the retrieved docs, so per-call carbon estimates should be labelled proxy-only/low-confidence.

**Top findings**
- Use direct hardware telemetry for the most defensible inference measurements on self-hosted or dedicated systems: NVIDIA NVML exposes cumulative GPU energy on supported devices, and Linux powercap exposes RAPL energy files for supported CPU… (docs.nvidia.com: https://docs.nvidia.com/deploy/nvml-api/group__nvmlDeviceQueries.html)
- Request/runtime allocation should use serving metrics, not request counts alone. NVIDIA Triton/DCGM exposes request timing, queue/compute phase metrics, GPU power, and utilization metrics useful for allocation analysis. (docs.nvidia.com: https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/metrics.html)
- Cloud carbon products are useful for account or project baselines. Google Cloud Carbon Footprint supports monthly usage/region allocation and product/project/region breakdown; AWS CCFT reports MTCO2e with Scope 2/3 defaults and is deprecated June 30… (cloud.google.com: https://cloud.google.com/carbon-footprint/docs/methodology)

**Recommended next steps**
- For self-hosted inference, instrument NVML GPU energy, Linux powercap/RAPL CPU energy where supported, and serving-layer request/token/timing metrics; report component scope and unsupported hardware explicitly. (kernel.org: https://www.kernel.org/doc/html/latest/power/powercap/powercap.html)
- For cloud-hosted workloads, use provider carbon dashboards or Cloud Carbon Footprint for account/project baselines, but do not market these as exact request-level AI emissions unless allocation is separately instrumented and disclosed. (docs.aws.amazon.com: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ccft-overview.html)
- For third-party LLM APIs, report usage-normalized proxy estimates only when necessary, clearly labelled low-confidence, and ask vendors for energy/allocation telemetry before making customer-facing per-call carbon claims. (evidence: verified_absence_limited_to_retrieved_pages)

**Key caveats / gaps**
- SCI supports software carbon intensity with functional units and examples such as API-call or ML-run, but token/customer allocation is not explicitly specified by the cited SCI text.
- CodeCarbon, Carbontracker, and Cloud Carbon Footprint are practical candidates, but the exact hardware-counter requirement differs by tool: Carbontracker needs supported hardware/permissions; CodeCarbon can use RAPL for improved accuracy but also…

**Audit trail:** Full evidence remains in `final-audit.control.json`: 12 verified, 4 partially supported, 0 unsupported, 0 conflicting claims; fact slots 11 filled, 1 partial, 0 missing/conflicting.
