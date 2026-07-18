# FP adapter: codex

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
- multi-agent task -> ordinary children are for independent investigation/review; writing children use delegated execution, one writer per shared file set, and parent re-verification

## Delegated execution runtime

Detect the current tool catalog. When present, map fresh dispatch to `spawn_agent`, join to `wait_agent`, status to `list_agents`, and cancellation to `interrupt_agent`. `send_message` and `followup_task` continue one existing envelope and never count as a fresh implementer, reviewer, fixer, or re-reviewer. Keep semantic task IDs in the ledger; any human nickname shown by the UI is cosmetic.

Load `fp/delegated-execution/SKILL.md`, `fp/templates/agent-runtime-adapters.md`, and the runtime registry only after the frozen brief activates delegated execution. If required primitives are absent, degrade explicitly instead of shelling out to another AI CLI.

`.agents/skills/` is local agent configuration unless a repository explicitly opts in. Do not commit a project-root `.agents/skills/` directory by accident.

This adapter does not add a runtime, CLI, npm package, npx installer, pip package, or database.
