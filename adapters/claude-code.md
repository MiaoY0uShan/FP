# FP adapter: claude-code

FP is agent-agnostic.

## Default behavior (Goal-Matched Ghost Mode)

Infer FP from the user's goal. Activate it automatically for engineering work and keep it dormant for casual or other non-engineering goals. `FP:` and `$fp` are optional, never required.

- **Small change:** Generate a 3-5 line brief and capture the validation result.
- **Medium task:** Create a compact Execution Brief, run verification, and produce an Evidence Ledger.
- **Large, vague, architectural, or risky task:** Use Idea Cards or the full chain before compiling an Execution Brief.
- **Failed task:** Split smaller instead of retrying the same large task.
- **Protocol or agent-behavior change:** Confirm intent and boundaries before editing.
- **Debug-first:** Gather read-only, discriminating evidence before editing an unknown-cause failure.
- **Multi-agent:** Ordinary children handle independent investigation/review. Writing children use delegated execution, a single writer per shared file set, and parent verification.

## Delegated execution runtime

Detect `Agent` (or the compatible `Task` alias) in the active tool list. A new call is a fresh stage; foreground return or task notification is join, `TaskList` is status, and `TaskStop` is cancellation when exposed. `SendMessage`/resume continues the same child and is never fresh. Even when the installed release supports nested children, FP removes `Agent` from leaves and the parent dispatches every implement/review/fix/re-review stage.

When `ANTHROPIC_BASE_URL` points to a third-party provider or local proxy, also load `fp/provider-compatibility/SKILL.md`: verify proxy health, calculate nested retry multiplication, and freeze request/token/subagent budgets before execution.

## Rules

- Check `fp/lessons-learned/` before planning.
- State what to read, what to touch, and how to verify before editing.
- No evidence, no done.
