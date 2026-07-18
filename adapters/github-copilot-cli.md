# FP adapter: github-copilot-cli

FP is agent-agnostic.

## Default behavior

Infer FP from the user's goal. Activate it automatically for engineering work and keep it dormant for casual or other non-engineering goals. `FP:` and `$fp` are optional, never required.

- **Small change:** Generate a 3-5 line brief and capture the validation result.
- **Medium task:** Create a compact Execution Brief, run verification, and produce an Evidence Ledger.
- **Large, vague, architectural, or risky task:** Use Idea Cards or the full chain before compiling an Execution Brief.
- **Failed task:** Split smaller instead of retrying the same large task.
- **Protocol or agent-behavior change:** Confirm intent and boundaries before editing.
- **Debug-first:** Gather read-only, discriminating evidence before editing an unknown-cause failure.
- **Multi-agent:** Ordinary children handle independent investigation/review. Writing children use delegated execution, one writer per shared file set, and parent verification.

## Delegated execution runtime

Detect the exact surface. Copilot CLI may expose `task`, `list_agents`, `read_agent`, and `write_agent`; compatible editor surfaces may expose `runSubagent`. A new `task`/`runSubagent` is fresh, while `read_agent`/`write_agent` continues an existing child. `/fleet` is high-level fan-out and does not prove per-child cancellation. Activate full delegated execution only when the installed surface exposes every required lifecycle gate.

## Rules

- Check `fp/lessons-learned/` before planning.
- State what to read, what to touch, and how to verify before editing.
- No evidence, no done.
