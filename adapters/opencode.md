# FP adapter: opencode

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
- multi-agent task -> use a fresh blocking `task` only when exposed; keep one writer and parent verification

## Delegated execution runtime

Map a new blocking `task` call to fresh spawn plus join. Background handles and resume are experimental/surface-dependent and may be used only when the installed schema exposes them; FP never enables experimental flags implicitly. Without observable status/cancel, use serial fresh review stages or parent execution rather than claiming the full delegated lifecycle.

This adapter does not add a runtime, CLI, npm package, npx installer, pip package, or database.
