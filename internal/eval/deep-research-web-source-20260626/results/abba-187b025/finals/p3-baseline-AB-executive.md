# Executive summary

**Bottom line:** Working conclusion: operate AI coding agents as constrained, auditable, least-privilege automation rather than trusted developers. For a small team, the most supportable baseline is: default to read-only or workspace-scoped local permissions; keep network disabled or allowlisted; keep CI tokens/secrets least-privilege and gated; treat dependency installs/build scripts as high-risk code execution; require human approval for secrets, deploys, dependency policy changes, workflow changes, and broad tool/network access; retain enough logs/session traces for review while assuming logs may contain sensitive data; and prepare an incident checklist for exposed…

**Top findings**
- Local coding-agent security controls exist, but defaults differ by product and mode. (developers.openai.com: https://developers.openai.com/codex/agent-approvals-security)
- Network controls should be treated as allowlist/risk-reduction mechanisms, not complete boundaries. (developers.openai.com: https://developers.openai.com/codex/config-reference)
- Secrets and CI credentials require least privilege, short-lived credentials where practical, and protected access paths for untrusted PR/MR code. (docs.github.com: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)

**Recommended next steps**
- Set local agents to the narrowest workable mode: read-only for exploration, workspace-write for routine edits, and avoid full-access/bypass modes except in disposable environments with explicit human approval. (docs.anthropic.com: https://docs.anthropic.com/en/docs/claude-code/security)
- Default network to off or domain-allowlisted for agent sessions; require review before enabling broad internet access, especially when secrets or untrusted content are present. (docs.anthropic.com: https://docs.anthropic.com/en/docs/claude-code/sandboxing)
- Harden CI for agent-authored or untrusted code: least-privilege job tokens, protected secrets/environments, no secrets for untrusted fork code unless explicitly reviewed, and short-lived/OIDC cloud credentials where supported.

**Key caveats / gaps**
- Agent-specific incident response is only partially covered by primary sources.
- Version/product-scope anchoring is incomplete.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 16 verified, 0 partially supported, 0 unsupported, 0 conflicting claims; fact slots 10 filled, 2 partial, 0 missing/conflicting.
