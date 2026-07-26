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
- Bind evidence to the observed state. A relevant mutation, rollback, ambiguous write, or freshness change invalidates affected rows and requires their declared checks again.
- After a diagnostic hypothesis is supported, add another diagnostic check only when its possible outcomes can change a named decision or fill a named row. Decision-neutral corroboration reuses the existing evidence instead.
- A user stop leaves unfinished rows `unverified`; it does not authorize one more probe for a cleaner completion record.
