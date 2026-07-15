# Acceptance Evidence Matrix

Use before the first edit for medium, debug, live-system, or risky work. One row may cover more than one requirement only when the same observable proves them all.

| Requirement | Observable | Check Or Probe | Pass Condition | Evidence Location |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Rules

- A source edit, implementation note, process ID, or `ready` label is not user-visible acceptance evidence by itself.
- Pin the original symptom for bug fixes and rerun the same path after the change.
- Include at least one negative control when allow/deny, auth, filtering, fallback, or state transitions matter.
- Mark unavailable evidence as `unverified`; do not weaken the pass condition after execution.
- If a requirement changes, update the matrix before making the corresponding edit.
