# FP adapter: generic

FP is agent-agnostic.

## Default behavior

Infer FP from the user's goal. Activate it automatically for engineering work and keep it dormant for casual or other non-engineering goals. `FP:` and `$fp` are optional, never required.

- **Small change:** Generate a 3-5 line brief and capture the validation result.
- **Medium task:** Create a compact Execution Brief, run verification, and produce an Evidence Ledger.
- **Large, vague, architectural, or risky task:** Use Idea Cards or the full chain before compiling an Execution Brief.
- **Failed task:** Split smaller instead of retrying the same large task.
- **Protocol or agent-behavior change:** Confirm intent and boundaries before editing.
- **Debug-first:** Gather read-only, discriminating evidence before editing an unknown-cause failure.
- **Multi-agent:** Parallelize independent work, keep a single writer per shared file set, and have the parent verify.

## Rules

- Check `fp/lessons-learned/` before planning.
- State what to read, what to touch, and how to verify before editing.
- No evidence, no done.
