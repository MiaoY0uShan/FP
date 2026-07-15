# FP Lessons Learned

This directory stores candidate observations and promoted reusable anti-patterns—not raw conversation memory. Only cards whose status is `promoted` may act as reusable policy.

## Workflow

1. Search only for lessons relevant to the current task and inspect each card's status.
2. Apply only `promoted` cards in the Execution Brief. Treat `observation` and `bounded_shadow` cards as task-local hypotheses until fresh evidence supports them.
3. A failure starts as an `observation` in the Evidence Ledger or Adaptive Improvement Report.
4. A severe one-off may create only a narrow expiring `bounded_shadow`; it does not become a reusable law.
5. Promote a Lesson Card only after `generalization-gate` passes distinct task/session evidence, holdouts, negative controls, invariants, shadow, approval, and rollback.
6. Revalidate promoted lessons when new evidence contradicts them or source provenance becomes stale.

Do not create a Lesson Card merely because a check failed once. Do not store secrets, raw logs, or long transcripts.

## Lesson Card

```md
# Lesson: <title>

## Status
observation | bounded_shadow | promoted

## Context

## Anti-Pattern

## Correction

## Evidence
- independent run/evidence reference 1
- independent run/evidence reference 2
- generalization, negative-control, invariant, shadow, and rollback references

## Reuse Trigger

## Safety Boundary
What this lesson must not cause agents to over-apply.
```

## Promoted Lessons

- None yet under the v0.3 evidence standard.

## Legacy Observations Awaiting Revalidation

- `L001-remote-stateful-service-chain.md`: live systems need target capability probes, rollback, effective-state proof, real clients, negative controls, and ownership/leak evidence.
- `L002-stateful-ui-handoffs.md`: stateful UI handoffs need durable client state, recoverable stale state, and served-runtime proof.
- `L003-record-target-precedence.md`: explicit record-target replacement supersedes earlier targets; an additional target does not silently replace them.

These cards predate the v0.3 generalization contract. They remain searchable as bounded historical observations, but agents must not inject them as global policy until each card links evidence that passes the current promotion gate.
