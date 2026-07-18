# FP Contracts

FP is not a longer prompt. It is a small set of execution contracts.

## Execution Brief

Before editing, define the real goal, scope, file/context budget, seven-rung reuse decisions, acceptance evidence matrix, checks, authority, and stop condition. Multi-agent briefs also freeze the parent authority ceiling and every child task envelope. Background-learning briefs freeze candidate identity and blind evaluation gates before a child sees training data.

## Context Budget

Bound files to read/touch/avoid, forbidden context, notes, checks, and violation handling. Exceeding the contract means stop, split, or explicitly revise it.

## Evidence Ledger v1

The normative machine contract is `fp/contracts/evidence-ledger.v1.schema.json` **plus** `fp/contracts/evidence-ledger.js`. The portable schema owns structure and basic conditionals; the zero-dependency semantic validator owns cross-field authority, path/glob scope, evidence references, route/profile completion gates, and continuation rehydration. They are tested and versioned together. The ledger records:

- task, route/phase/profiles, authority mode, write authorization, and separate explicit repository-read, network-read, and write scopes;
- embedded required checks, expected exit codes, acceptance rows, and required claims;
- files read/touched and exact check evidence;
- hypothesis/probe/result/decision experiments;
- verified and unverified claims;
- scope/context violations and remaining risk;
- remote/live, external-context, delegated-execution, and provider-compatibility evidence when applicable;
- optional continuation, deferred items, distributed delegation envelopes, and finite-sample learning evidence;
- decision and next action.

Markdown is an optional view. Legacy Markdown/JSON is accepted for one migration cycle as parse-only evidence with a warning; it is downgraded to partial/unverified and can never count as verified progress. Strict validation requires v1.

## Acceptance Evidence Matrix

Every medium, debug, live, or risky task maps:

```text
requirement -> observable -> check/probe -> pass condition -> evidence location
```

The original symptom is mandatory acceptance evidence for a bug fix.

## Failure-To-Smaller-Task

Failure does not authorize repeating the same patch. Record the observation, shrink to a falsifiable slice, and use a new check.

## Continuation

An incomplete long run may embed a structured continuation in the ledger. Resume recomputes the documented `fp-worktree-v1` fingerprint and verifies task/repository/revision/evidence references before continuing; it never auto-replays writes. Completed ledgers cannot carry continuations.

## Context Retrieval

External documentation is optional and version-pinned. Queries are single-topic, redacted, bounded, freshness-recorded, and reduced to claim-relevant evidence. Provider failure cannot block the base protocol, but an unknown fact required for acceptance blocks the dependent edit and completion.

## Distributed Delegation

The parent records its authority ceiling and one task/result envelope per child: parent/dependency IDs, stable input order, bounded goal/context, role, granted authority, tools/resources, writer ownership, time/iteration/depth limits, idempotency key, result evidence, and terminal cleanup. The semantic validator rejects privilege escalation, cycles, overlapping writers, live mutation in children, unplanned envelope changes, stale leases, and non-terminal descendants.

`delegated_execution_evidence` additionally binds the observed host runtime and fresh implementer/reviewer/fixer/re-review/final-review chain to frozen work items. Serial, dependency-ordered writer lease transfer is allowed; parallel overlapping writers remain invalid. Completed host threads may remain as history, while active concurrency and cumulative thread creation remain independently bounded.

## Provider Compatibility And Spend

`provider_compatibility_evidence` records the effective host/proxy/provider chain, exact nested retry multiplier, frozen and observed request/token/subagent budgets, semantic-action loop guard, host/proxy/provider usage reconciliation, strict UTF-8 classification, and semantic stream/tool completion. The validator derives `(max_retries + 1)` multiplication and blocks successful execution completion on retry/spend/loop overruns, unexplained accounting, unresolved model/proxy encoding corruption, or transport-only success.

## Generalization

Adaptive improvement stages a frozen candidate; `generalization-gate` decides whether evidence supports observation, shadow, active, rejection, or archive. Two to four independent positive cases use leave-one-case-out. Active promotion requires distinct source-ledger/task/session/family evidence, hidden-context isolation, complete holdout coverage, same-unit baseline/candidate measurements plus a bound oracle from one independent evaluator, no regression, at least one derived improvement, near-neighbor negative control, zero-tolerance invariants, complexity budget, three distinct future shadow records, explicit promotion authority, an applied target whose bytes match the frozen hash, current source provenance, and tested rollback. This adapts external policy; it is not model-weight training.

Distributed completion is likewise evidence-bound: root and direct-parent envelopes intersect authority/resources/depth; URL scopes use origin and path-segment boundaries rather than string prefixes; dependency timing, input order, concurrency, attempts, timeouts, ancestor cancellation, actual summary size, artifact isolation, and writer lease release are derived from recorded data. Distinct spec and integration reviewers use distinct task/session identities and separate commands bound to the run, producer, gate, and covered tasks.

Active learning and delegated completion require a ledger timestamp. Freeze, source, shadow, child, and release times are ordered against it and against the validator's trusted current clock with a five-minute default skew allowance. Callers may inject `nowMs` and `maxClockSkewMs` for deterministic offline validation; the clock source remains an explicit host trust boundary.
