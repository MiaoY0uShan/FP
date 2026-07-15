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
- Long work uses structured continuation, not transcript summaries.

## Completion

- Small: observed validation line.
- Medium: canonical Evidence Ledger v1.
- Debug/live/risky: original reproduction, regression, negative control, and profile evidence.
- Multi-agent: spec/quality verdicts, blocking-finding re-review, parent rerun, all agents terminal.

Metrics run only when measurement matters. Adaptive improvement stages evidence-backed observations; it does not silently rewrite the protocol.

## Boundary

FP is a portable skill bundle. It has no database, daemon, scheduler, autonomous executor, or required network service. Maintainer validators and install scripts are not runtime dependencies.
