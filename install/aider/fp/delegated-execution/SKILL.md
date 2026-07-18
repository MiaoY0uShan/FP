---
name: fp-delegated-execution
description: "Use only when routed by FP after an executable plan is accepted and the current host exposes a verified subagent runtime; dispatch a fresh implementer, task reviewer, bounded fixer/re-review loop, final integration reviewer, and parent verification."
---

# FP Delegated Execution

Execute a frozen plan through fresh, task-local agent threads. The parent coordinates, integrates, and verifies; it does not silently replace a required delegated stage with its own implementation or review.

## Entry Gate

Enter only when all are true:

- the user authorized execution;
- the plan has bounded work items, ownership, checks, stop conditions, maximum active concurrency, maximum cumulative threads, and maximum fix cycles;
- `multi_agent` and `delegated_execution` are active;
- the current host exposes a subagent runtime verified by capability detection against `../contracts/agent-runtime-registry.v1.json`;
- the parent can observe spawn, completion, cancellation or interruption, and terminal status.

Load `../templates/agent-runtime-adapters.md` and `../templates/multi-agent-review-protocol.md`. If two or more problem domains may run concurrently, load `../dispatch-parallel-domains/SKILL.md` and prove independence first.

Do not activate this profile from a model name alone. A model API is not a subagent runtime. Do not install a runtime, invoke another AI CLI through the shell, or invent a missing tool. If no verified runtime is available, continue serially in the parent only when delegated execution was optional; if the user required delegation, report the unmet capability.

## Per-Task Chain

Run every planned work item through these stages in order:

1. Dispatch a **fresh implementer** with only that work item's brief, relevant interfaces, owned paths, tests, invariants, and report contract. The implementer follows TDD where applicable, self-reviews, and returns observed checks.
2. After the implementation lease is released, dispatch a **fresh task reviewer** in read-only mode. It independently returns both `spec verdict` and `quality verdict`; implementer self-review never substitutes for this gate.
3. For any Critical or Important finding, dispatch a **fresh fixer** with the complete bounded finding set, the same work-item ownership, and the covering checks. Never fix the finding in the parent.
4. After the fixer releases its lease, dispatch a **fresh re-reviewer** with the updated evidence and diff. Repeat fresh fixer plus fresh re-reviewer only within `max_fix_cycles`; otherwise split smaller or report the blocker.
5. Mark the work item passed only when its latest task reviewer has both verdicts `pass` and no blocking finding. After every work item passes, dispatch a **fresh final integration reviewer** over the integrated change, all work-item requirements, regressions, packaging, and cleanup.
6. If final review finds blocking issues, dispatch one fresh integration fixer for the bounded final finding set, then a fresh final integration reviewer. The parent finally reruns the declared integration, original-symptom, regression, and negative-control checks on the resulting state.

Every implementer, reviewer, fixer, re-reviewer, integration fixer, and final reviewer has a unique task ID and session/thread ID. A message or follow-up to an existing thread may clarify the same active envelope; it never turns that thread into a fresh stage.

## Scheduling And Thread History

Task chains are serial by default. Fan out only domains accepted by `fp-dispatch-parallel-domains`; do not run conflicting implementation agents in parallel. One active writer owns a path set. An implementer may hand the same paths to a later fixer only through an explicit dependency, terminal handoff, non-overlapping execution windows, and released mutation leases.

Completed agent threads may accumulate in host history so their artifacts and verdicts remain auditable. This is not active concurrency: keep active concurrency bounded by the brief, stop spawning at the cumulative thread budget, and require every live thread to be terminal before completion. If the host offers explicit close, use it after preserving needed evidence; otherwise a completed/cancelled/interrupted terminal state is sufficient.

## Evidence And Stop Conditions

Record `delegated_execution_evidence` and the ordinary `multi_agent_evidence`. Bind runtime detection, implementation, task review, fix, re-review, final review, and parent integration to observed commands and their producing task IDs. The compiled brief freezes work items and budgets, while fresh runtime instance IDs may be created after a review finding only inside those bounds.

Stop without another spawn when:

- runtime capability becomes unavailable or stale;
- a requested stage would exceed active-concurrency, cumulative-thread, fix-cycle, authority, time, or scope limits;
- work items prove coupled beyond their frozen ownership;
- a user change makes pending envelopes stale;
- a live target, credential, deployment, or external message would be delegated.

No child may delegate, mutate live state, use credentials, deploy, message externally, promote memory, or claim overall completion. No child summary is completion evidence. The parent owns the final integrated verdict.
