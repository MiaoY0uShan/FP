# FP Execution Protocol

```text
task -> route -> smallest brief -> bounded execution -> evidence
```

The top router chooses internal modules. Users should not call child skills manually.

## Before Editing

1. Establish authority and route.
2. Read only relevant lessons and the real code path.
3. Separate facts to investigate from decisions the user owns.
4. Run the seven-rung reuse ladder.
5. Define scope, acceptance observables, checks, evidence locations, and stop conditions.

## During Work

- Unknown-cause diagnosis stays read-only.
- One experiment changes one decision.
- Parallel agents investigate independently; one writer owns shared files/live state.
- Live-system writes preserve management access and rollback.
- External context is version-pinned, redacted, and bounded.
- Available task-required MCPs are used automatically within current authority; missing MCPs require an exact acquisition brief and explicit approval before download/install.
- Long work uses structured continuation, not transcript summaries.

## Completion

- Small: observed validation line.
- Medium: canonical Evidence Ledger v1.
- Debug/live/risky: original reproduction, regression, negative control, and profile evidence.
- Multi-agent: spec/quality verdicts, blocking-finding re-review, parent rerun, all agents terminal.

Metrics run only when measurement matters. Adaptive improvement stages evidence-backed observations; it does not silently rewrite the protocol.

## Boundary

FP is a portable skill bundle. It has no bundled database, daemon, scheduler, autonomous executor, MCP server, or required network service. A task-specific MCP may be acquired only with explicit approval, and resident/auto-start behavior requires separate authorization. Maintainer validators and install scripts are not runtime dependencies.
