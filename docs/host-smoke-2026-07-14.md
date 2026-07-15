# Exact-host smoke evidence — 2026-07-14

This is an environment-specific discovery smoke, not a claim that every supported host executed the protocol. Each installed host was launched from its own isolated project containing the universal ZeroToHero 0.3.0 pack. The prompt prohibited file changes and asked the host to route a one-heading README rename.

| Host | Exact version | Headless/read-only result | Discovery verdict |
| --- | --- | --- | --- |
| Codex CLI | `0.144.1` | Started in read-only sandbox, then the model request returned HTTP 401 because no usable CLI credential was present. | `blocked_auth`; instruction response not observed |
| Claude Code | `2.1.201` | Started print mode and returned `Not logged in · Please run /login`. | `blocked_auth`; instruction response not observed |
| Gemini CLI | `0.43.0` | Started headless plan mode, but both the protocol prompt (60 seconds) and a minimal control prompt (25 seconds) timed out without output. | `blocked_timeout`; instruction response not observed |

Copilot, Cursor, Windsurf, Cline/Roo, OpenCode, Kiro, Qoder, OpenClaw, Aider, and Zed executables were not present on this machine, so they were not run and remain `not_run` rather than implied passes.

Safety evidence:

- each isolated install contained 86 files before launch;
- no host added a project-local file or changed the newest project timestamp during the attempted run;
- the ownership verifier passed for all three projects after the host attempts, proving that every installer-owned file and managed block still matched its manifest;
- verified uninstall then passed for all three projects and removed the owned paths while preserving project files and backup snapshots.

A future authenticated run should repeat the same prompt and record the returned route, required artifact, and verification. Until then, automatic instruction discovery in these exact versions is deliberately unverified.
