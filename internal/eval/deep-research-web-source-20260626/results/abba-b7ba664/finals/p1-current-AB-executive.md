# Executive summary

**Bottom line:** Working conclusion: for a small SaaS or applied AI team, the most defensible approach is a layered estimate, not a claim of exact per-request truth. Use hardware/runtime telemetry for owned inference, cloud carbon dashboards or Cloud Carbon Footprint for cloud allocation, request/token/model/customer metadata for attribution, and SCI/GHG Protocol-style disclosures for boundaries, functional units, grid factors, and uncertainty. Third-party AI APIs should be reported as proxy or attributed estimates, not measured provider-side inference energy, unless the vendor provides explicit energy/carbon telemetry and methodology.

**Top findings**
- Owned infrastructure can be measured or estimated with credible low-level telemetry on NVIDIA/Linux stacks.
- Cloud provider carbon dashboards are useful for cloud/account/project/product/region/month allocation context, but are not request/token/model-level AI inference meters.
- SCI provides the strongest software-specific reporting frame: define a boundary and functional unit, include provisioned hardware energy, and disclose method and assumptions. (sci.greensoftware.foundation: https://sci.greensoftware.foundation/)

**Recommended next steps**
- Build reporting as an estimate pipeline with explicit evidence tiers: measured owned hardware, allocated cloud footprint, and proxy third-party API estimates. (evidence: verified components plus partially supported synthesis)
- For owned inference, collect request id, customer/tenant, model/version, input/output tokens, latency, batch/concurrency, hardware id, region, GPU power/energy where available, CPU/package energy where relevant, and utilization. (evidence: verified/partial)
- Use SCI-style functional units such as per request, per 1,000 tokens, per completed workflow, or per customer-month, and disclose the boundary and allocation driver. (evidence: verified)

**Key caveats / gaps**
- AWS CCFT details were partially supported but failed a strict evidence-row gate, so use AWS dashboard claims cautiously until the exact primary evidence is re-inspected.
- KV-cache/batching affects throughput, but the direct energy amortization implication needs additional energy-specific support.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 12 verified, 4 partially supported, 0 unsupported, 0 conflicting claims; fact slots 5 filled, 5 partial, 0 missing/conflicting.
