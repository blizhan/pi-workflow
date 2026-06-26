# Executive summary

**Bottom line:** Working conclusion: for a small SaaS, report AI inference carbon as a bounded software-intensity estimate, not as precise per-request truth or an organization inventory. If using managed AI APIs, start with request/model/token/region/customer logs plus clearly labelled modeled estimates. If self-hosting, instrument GPU/CPU energy and allocate shared/idle infrastructure using an SCI-style boundary and functional unit. Public comparative provider/model claims should be avoided unless methods, boundaries, and functional units are aligned and substantiated.

**Top findings**
- Major cloud carbon dashboards are useful for monthly/account/project/resource context but do not solve per-request AI inference attribution. (docs.aws.amazon.com: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ccft-overview.html)
- Self-hosted inference can be instrumented with hardware energy telemetry, but readings are scoped to devices/packages/domains rather than automatically representing whole-service emissions. (docs.nvidia.com: https://docs.nvidia.com/datacenter/dcgm/latest/dcgm-api/dcgm-api-field-ids.html)
- SCI-style reporting is the best practical framing: define software boundary, functional unit, energy, carbon intensity, embodied allocation, and disclose methodology. (sci.greensoftware.foundation: https://sci.greensoftware.foundation/)

**Recommended next steps**
- Use a three-tier disclosure: measured self-hosted components, modeled managed-API components, and monthly cloud-provider carbon context. Label each tier separately. (cloudcarbonfootprint.org: https://www.cloudcarbonfootprint.org/docs/methodology)
- For managed AI APIs, log provider, model/version, region if known, request timestamp, customer/tenant, prompt tokens, output tokens, latency, cache/batch indicators if available, and cost/usage fields; publish only modeled ranges or internal directional…
- For self-hosted inference, collect GPU/CPU energy telemetry and request/runtime metrics, then allocate energy to a functional unit such as request or 1k tokens with explicit treatment of idle/reserved capacity.

**Key caveats / gaps**
- Major managed AI APIs did not show verified per-request energy/kWh/CO2e fields in inspected primary docs, but this is a negative claim and was not exhaustively proven across all schemas/providers.
- Small-SaaS effort/credibility ranking is a synthesis, not a directly sourced benchmark.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 15 verified, 1 partially supported, 0 unsupported, 0 conflicting claims; fact slots 9 filled, 3 partial, 0 missing/conflicting.
