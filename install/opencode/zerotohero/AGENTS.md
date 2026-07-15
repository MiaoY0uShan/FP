# ZeroToHero Agent Contract

Use ZeroToHero proactively for coding work, while choosing the lightest route that can still be verified. Manual trigger remains `ZeroToHero: <task or idea>`.

## Route Before Editing

Apply user authority/read-only as a global gate first. It constrains every operational route below and never counts as a route by itself. Then apply this priority:

1. Active incident: `OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN` within current authority.
2. Explicit grill/challenge request: investigate facts and ask one user-owned decision at a time.
3. Diagnose-only or unknown-cause failure: debug-first and read-only until a cause is supported.
4. Protocol/agent-behavior change: confirm unless implementation was already approved.
5. Small, medium, vague, or large route.

Use remote/live-system, OpenWrt, stateful-UI, external-context, multi-agent, continuation, self-iteration, and background-learning as profiles layered onto the selected route. A stale external claim blocks dependent completion; a stale continuation blocks writes.

## Route Weight

- **Small:** 3-5 lines covering task, read/touch, done-when, verification, and result.
- **Medium:** compact Execution Brief, acceptance evidence matrix, and Evidence Ledger.
- **Vague:** three Idea Cards before implementation.
- **Large/risky:** only the internal modules that reduce scope or risk, compiled into one final brief.
- **Failed:** capture evidence and split smaller; do not repeat the same large attempt.

Before any edit, state what will be read, what will be touched, what must not change, and how each acceptance condition will be observed.

For medium, risky, or multi-agent work, first capture the repository root, branch/revision, pre-existing status, ownership of existing changes, and relevant baseline-check failures. Preserve unrelated dirty work and distinguish an existing failure from a regression introduced by this run. Use an isolated worktree only when the risk and current authority justify it.

## Debug-First Rules

- Pin the exact symptom and reproduction.
- Capture a read-only baseline and observability map.
- Keep at most two falsifiable hypotheses; test one with the cheapest discriminating probe.
- Record hypothesis, probe, actual result, decision, and next step.
- Speculative patches do not count as probes and are forbidden before a cause is supported.
- After three consecutive rejected/unknown probes that did not narrow the cause, checkpoint architecture, ownership, assumptions, and missing observability before a fourth hypothesis.
- Implement only when the user authorized a fix.
- Rerun the original symptom, regression checks, and a negative control.

## Multi-Agent Contract

The parent is the integrator, default writer, and final verifier.

1. Parallelize only independent investigation or review.
2. Assign one writer per shared file set; never allow parallel writes to the same live resource.
3. Only the parent may hold a live-system mutation lease.
4. Every subagent gets a bounded envelope: goal, exact scope, invariants, checks, forbidden actions, and output path/format.
5. Subagents may not deploy, expand scope, or declare the overall task complete.
6. Keep initial reviewers independent; reconcile conflicts through a new probe.
7. Require explicit `pass | fail | insufficient_evidence` spec and quality verdicts.
8. Fix important findings and send them through re-review.
9. The parent reruns critical checks rather than trusting summaries.
10. If user direction changes, stop stale agents and pending writes.
11. Before final response, verify that all agents and background resources are terminal.

For auditable work, the Evidence Ledger records `parent_authority`, a reserved parent-owned artifact root, and one `delegations` envelope per child, including the root/direct-parent authority and resource intersection, read-only status, actual summary budget, parent-only artifact path, and bound proposal/check evidence. A child never receives a live-system mutation lease.

For distributed work, each logical task envelope also records task/session/parent/dependency IDs, bounded goal, leaf/orchestrator role, iteration/attempt/time/depth limits, `attempts_used`, idempotency key, terminal result, touched files, checks, and timestamps. Enforce observed concurrency, stored task-input result order, successful dependency timing, ancestor cancellation propagation, bounded idempotent retry evidence, unique writer ownership, and holder/path/time-bound lease release evidence. Distinct read-only spec and integration reviewers must use distinct task/session identities and separately bound commands. Leaves cannot delegate, promote memory, deploy, message externally, use credentials, or mutate live state.

Use a durable progress ledger for long tasks or likely context compaction. Record only decisions, ownership, evidence, open risks, and the next exact action.

## Live And Stateful Systems

- Preserve the management path and create a rollback point before writes.
- Inspect desired, generated, and effective runtime state.
- Prove target capabilities with semantic micro-tests, not help text or exit status alone.
- Verify the real external client path and negative controls.
- A service restart, process, or `ready` label is not proof of function.
- Track resource ownership and prove stop/restart/reload do not leak processes, interfaces, files, locks, sockets, or workers.
- Redact secrets from logs, examples, handoffs, and final answers.

## Learning And Records

- If a user explicitly replaces or narrows the record destination, use only the newest target. An additional requested destination does not silently replace earlier ones.
- A failure is an observation first. A single severe case may justify a narrow expiring shadow checklist, but never a cross-task schema or automation by itself.
- Background learners are read-only candidate generators. Independent evaluators receive frozen candidates and hidden holdout/negative cases; the parent owns promotion and rollback.
- For two to four independent positive cases, use leave-one-case-out. Every case must be held out once, every fold must be non-inferior to baseline, at least one fold must improve, and all negative controls and zero-tolerance invariants must pass.
- Count distinct task and session IDs. Paraphrases, perturbations, and sibling agents from one run test robustness but do not create independent evidence.
- Active candidates require a bounded trigger and non-trigger boundary, current provenance, complexity budget, passing shadow window, explicit approval, and tested rollback. Load `generalization-gate/SKILL.md`.
- Metrics use observed values. Missing values stay `unknown`; no baseline means no efficiency claim.

## Repository And Release Boundary

`.agents/skills/` is local agent configuration unless the repository explicitly owns it. Treat root `zerotohero/` as canonical source. Never hand-edit generated install-pack copies; run the sync script and then verify byte-for-byte consistency.

No evidence, no done.
