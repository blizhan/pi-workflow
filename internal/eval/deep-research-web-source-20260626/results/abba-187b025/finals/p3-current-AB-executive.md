# Executive summary

**Bottom line:** Use a defense-in-depth baseline for coding agents: treat repo/tool/web/CI content as untrusted, run agents in constrained workspaces, minimize filesystem/network access, gate privileged tools with human approval, lock down CI tokens/secrets, control package-install scripts, preserve logs/artifacts, and pre-plan secret-rotation incident response.

**Top findings**
- Prompt injection and untrusted content are the core threat model for coding agents with tools. (genai.owasp.org: https://genai.owasp.org/llmrisk/llm01-prompt-injection)
- Local agent execution should be isolated with non-root/rootless containers, constrained devcontainer run arguments, read-only mounts where possible, and narrow workspace mounts. (docs.docker.com: https://docs.docker.com/engine/security/rootless)
- Network denial with Docker `--network none` is verified for cases that do not need egress, but allowlisted egress patterns remain under-evidenced in this packet. (docs.docker.com: https://docs.docker.com/engine/network/drivers/none)

**Recommended next steps**
- Define all repository content, issues, PR comments, logs, fetched web pages, and tool outputs as untrusted data; keep system/developer instructions separate and enforce code-side authorization for tools. (cheatsheetseries.owasp.org: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
- Run local coding agents in a constrained container/devcontainer: rootless or non-root where feasible, mount only required paths, make host mounts read-only unless writes are required, and encode Docker CLI sandbox flags in… (docs.docker.com: https://docs.docker.com/engine/storage/bind-mounts)
- For CI, set minimum required GITHUB_TOKEN permissions, prefer read-only contents by default, escalate only at job scope, and do not run untrusted PR code inside privileged `pull_request_target` or `workflow_run` designs. (evidence: verified)

**Key caveats / gaps**
- Repository files, issues, PR comments, and logs should be treated as untrusted agent inputs.
- A small-team maturity model is appropriate, but it is synthesized from verified component controls rather than a single authoritative framework.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 16 verified, 0 partially supported, 0 unsupported, 0 conflicting claims; fact slots 8 filled, 4 partial, 0 missing/conflicting.
