# FP adapter: cursor

FP is agent-agnostic.

Default behavior:

```text
Infer FP from the user's goal. Activate it automatically for engineering work and keep it dormant for casual or other non-engineering goals. `FP:` and `$fp` are optional, never required.
```

Optional explicit invocation:

```text
FP: <task or idea>
$fp <task or idea>
```

Expected behavior:

- small change -> 3-5 line brief plus validation result
- medium task -> compact Execution Brief plus Evidence Ledger
- large, vague, architectural, or risky task -> full chain
- failed task -> Failure-to-Smaller-Task Protocol and a smaller brief
- protocol or agent-behavior change -> confirm intent and boundaries before editing
- multi-agent UI -> treat worktree fleets and multitask UI as user-facing orchestration; do not claim fresh model-callable subagents without an observed spawn/join schema

## Delegated execution runtime

No stable model-callable Cursor subagent lifecycle is assumed. Consult `fp/contracts/agent-runtime-registry.v1.json` and the active tool catalog. If spawn/join/status/cancel are not observed, execute serially in the parent or use only user-authorized external/UI orchestration; never invent tools.

This adapter does not add a runtime, CLI, npm package, npx installer, pip package, or database.
