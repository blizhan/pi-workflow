# Executive summary

**Bottom line:** Working conclusion: for small teams running AI coding agents locally and in CI, the best-supported baseline is defense-in-depth rather than trust in the model: run local agents in per-agent microVMs where feasible or hardened rootless/non-privileged containers as a fallback; use hosted ephemeral CI runners or ephemeral/JIT self-hosted runners; keep filesystem and network access narrow; use least-privilege short-lived credentials; default agent tools to read/ask modes with explicit deny rules; require human gates for dependency/workflow/deployment/merge/destructive actions; and retain enough telemetry for incident response. The audited verifier found…

**Top findings**
- Isolation is the first control boundary: local agents with shell/package/Docker access should run inside per-agent microVMs where feasible; hardened rootless/non-privileged containers are a fallback, not an equivalent guarantee. (docs.docker.com: https://docs.docker.com/ai/sandboxes/security/)
- CI agent jobs should prefer clean hosted ephemeral runners; when self-hosting is necessary, use ephemeral/JIT or isolated runners and avoid persistent shared shell-style runners for untrusted code. (docs.github.com: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- Credentials should be least-privilege and short-lived: minimize repo token permissions, prefer OIDC/temporary cloud credentials, avoid passing secrets via CLI args or repo CI files, and rotate/delete exposed secrets/logs after exposure. (docs.github.com: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

**Recommended next steps**
- Adopt a two-tier execution policy: normal coding-assistant use may run in a hardened container/devcontainer with no host Docker socket and narrow writable paths; high-risk autonomous runs that execute package managers, Docker, cloud… (docs.docker.com: https://docs.docker.com/ai/sandboxes/security/isolation/)
- In CI, run agent-generated or untrusted code on hosted ephemeral runners by default; if self-hosting, use ephemeral/JIT runners or isolated non-privileged Docker/VM runners and avoid persistent shell runners for untrusted jobs. (docs.github.com: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners)
- Set credential policy before expanding agent autonomy: minimum repository token permissions, OIDC/temporary cloud credentials instead of long-lived secrets, protected/masked variables where applicable, no secrets in CLI arguments, and a documented rotate/delete-log procedure…

**Key caveats / gaps**
- Keep the narrower supported policy as mandatory; treat the broader exclusions as prudent default-deny review items unless separately sourced for your stack.
- Do not present curated dependency egress as a platform mandate; use it as a higher-maturity control.

**Audit trail:** Full evidence remains in `final-audit.control.json`: 13 verified, 3 partially supported, 0 unsupported, 0 conflicting claims; fact slots 12 filled, 2 partial, 0 missing/conflicting.
