# Lesson: Explicit Record Replacement Supersedes Earlier Targets

## Status

observation

This legacy card predates the v0.3 generalization contract and is not promoted reusable policy.

## Context
When a user changes where histories, summaries, handoffs, logs, or audit records should be written during a long task.

## Related
- [[L002-stateful-ui-handoffs]](mitigated_by) — record precedence prevents stale handoff data from corrupting the updated target. When a UI handoff also involves redirecting output destinations, combining the two lessons is safer than applying either alone.
- [[L001-remote-stateful-service-chain]](related_to) — both involve state management across boundaries. L001 handles runtime state (processes, configs, ports); L003 handles record state (handoffs, ledgers, logs).

## Anti-Pattern
Continue writing to an older destination after the user says to use a newer destination instead, or assume every additional requested destination replaces all prior destinations.

## Correction

- Treat wording such as “only,” “instead,” “from now on,” or an explicit narrowing as replacement.
- Treat “also,” “and,” or a second requested deliverable as addition unless the user says otherwise.
- Record the current destination in the durable progress ledger and recheck it before each write.
- Never copy secrets or unrelated history into the new destination.

## Evidence

- Multiple long task sessions exposed stale handoffs continuing to write an earlier record after the user narrowed the target.
- A separate UI handoff run showed that combining record precedence with browser-state behavior obscured both responsibilities; splitting the lessons makes the rule safer.

## Reuse Trigger
Apply whenever record destinations change while work is still active or resumed after compaction.

## Safety Boundary
Do not infer replacement from mere recency. Follow explicit user semantics and preserve legally or operationally required records unless authorized to change them.

## Backlinks (computed — do not author)

> community-14 | leaf | in_degree=1 out_degree=2 | rebuilt 2026-07-19

- [[L002-stateful-ui-handoffs]](mitigated_by)
