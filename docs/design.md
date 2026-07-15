# FP design

FP is a portable execution discipline layer for AI coding agents.

It is not a CLI, runtime, database, package manager, or automatic executor.

## Product principle

Users should be able to work normally. Manual override remains:

```text
FP: <task or idea>
```

FP should decide the workflow and keep the process weight proportional to the task.

## Main loop

```text
FP trigger
-> router
-> smallest useful brief
-> bounded execution
-> evidence
-> optional metrics
-> staged candidate -> blind generalization -> shadow/active or reject
```

## Routing levels

- Active incident -> restore before permanent repair.
- Unknown cause / diagnose-only -> debug-first and read-only evidence before edits.
- Small change -> 3-5 line brief plus validation result.
- Medium task -> compact Execution Brief plus Evidence Ledger.
- Large, vague, architectural, or risky task -> Idea Cards or full chain, then compact Execution Brief and Evidence Ledger.
- Protocol or agent-behavior change -> confirm intent and boundaries before editing.

Profiles for live systems, OpenWrt, external context, multi-agent work, continuation, stateful UI, self-iteration, and background learning are layered on demand.

Distributed work is a protocol, not a bundled scheduler. The host may run bounded children concurrently, but the parent keeps one integration authority, freezes task envelopes, requires idempotent retries and cancellation cleanup, and validates the resulting DAG/evidence before completion.

Background learning is also bounded host work, not a resident service. A read-only candidate agent sees training evidence, separate read-only evaluators see the frozen hash plus registered hidden cases, and only the parent can approve a reversible shadow/active policy change. Promotion evidence is bound to producer/stage/subject/hash; fold improvement is derived from same-unit measurements and an independent oracle, then confirmed by distinct future shadow observations.

## Why a router exists

Earlier versions required the user to know the internal workflow.

That is too hard.

The router hides the internal skill structure and decides what to use.

## Idea Cards

Idea Cards are used when the user does not know the real requirement yet.

They prevent the agent from asking a long questionnaire too early.

They give the user three close implementation paths to choose from.

## Estimated budgets

Use explicit budgets only when the task is medium or large enough for budget risk to matter.

## Portable boundary

FP remains portable:

```text
No CLI
No npm
No npx
No pip
No database
No runtime
No automatic executor
```

Maintainer validators, tests, pack sync, and release scripts are build-time tooling, not user runtime dependencies.
