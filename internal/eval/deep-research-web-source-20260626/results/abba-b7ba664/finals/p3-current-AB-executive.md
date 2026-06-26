# Executive summary

**Bottom line:** Working conclusion: adopt a default-deny, least-privilege operating model for AI coding agents. Run local agent work in a sandbox/container/worktree with narrow filesystem mounts, deny network egress unless needed, keep secrets out of agent-reachable environments, require human review for code/dependency/CI/deploy changes, and retain PR/CI/audit evidence for incident response. This is strongly supported for general controls, GitHub Actions, GitLab runner risk, Docker no-network isolation, npm/pip install risks, OWASP prompt-injection defenses, Claude Code settings, and GitHub Copilot firewall/environment behavior. Treat OpenAI Codex, Gemini, small-team cost claims, and full…

**Top findings**
- Network and secret exposure are the highest-risk paths; combine egress denial/allowlists with least-privilege credentials and OIDC where supported.
- Prompt injection is not just chat input: repository content, issues, web pages, tool outputs, and similar context must be treated as untrusted data and separated from trusted instructions.
- Local isolation should use explicit sandbox/container boundaries and narrow mounts; devcontainers isolate runtimes but still expose mounted workspace files.

**Recommended next steps**
- Adopt a tiered autonomy policy: read-only agents may inspect code; write-capable agents require sandboxed workspace and PR review; shell/network/CI/deploy actions require explicit allowlists and human approval. (evidence: verified/partial)
- For local runs, use a disposable worktree/container/devcontainer with no broad home or secrets mounts; use Docker --network none or equivalent when internet is not required. (evidence: verified)
- For CI, separate untrusted agent-produced code from privileged jobs, use least-privilege tokens, avoid long-lived cloud secrets via OIDC where available, and gate secret/deploy environments with deployment reviews. (evidence: verified)

**Key caveats / gaps**
- GitHub Copilot cloud agent is supported as running in its own ephemeral GitHub Actions-powered environment and making changes on a branch before a PR, but strict repository/branch/one-PR-per-task scoping was over-specific. (docs.github.com: https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent)
- An AI-agent compromise playbook is sensible, and NIST/GitHub support planned incident handling, logs, and secret rotation, but inspected evidence did not directly cover every listed playbook element. (csrc.nist.gov: https://csrc.nist.gov/pubs/sp/800/61/r2/final)

**Audit trail:** Full evidence remains in `final-audit.control.json`: 14 verified, 2 partially supported, 0 unsupported, 0 conflicting claims; fact slots 9 filled, 3 partial, 0 missing/conflicting.
