# FP adapter: gemini-cli

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
- unknown-cause failure or diagnose-only request -> debug-first, read-only evidence before edits
- multi-agent task -> independent investigation/review by default, one writer per shared file set, parent re-verification

## Delegated execution runtime

When the installed tool catalog exposes `invoke_agent`, use a new blocking invocation as fresh spawn plus join. Do not invent status, resume, or cancellation handles. Because a blocking invocation may lack observable status/cancel, use the full delegated-execution profile only when every required lifecycle gate is actually exposed; otherwise use bounded review-only delegation or parent-serial execution.

This adapter does not add a runtime, CLI, npm package, npx installer, pip package, or database.
