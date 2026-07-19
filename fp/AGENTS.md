# FP Agent Contract

Infer FP activation from the user's goal. Load it automatically for engineering work, keep it dormant for casual or other non-engineering goals, and never require `FP:` or `$fp`; both remain optional explicit invocations. Choose the lightest route that can still be verified.

## Route Before Editing

Apply user authority/read-only as a global gate first. It constrains every operational route below and never counts as a route by itself. Then apply this priority:

1. **Urgent / High-Stakes:** Active incident, grill/challenge, or protocol change. `OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN` for incidents. Confirm intent and boundaries before editing.
2. **Read-Only Diagnosis:** Debug-first (known symptom, unknown cause) or audit/survey (proactive multi-target scan). Read-only until a cause is supported and the user authorizes a fix.
3. **Build:** Scale to task size — Small → Tiny Brief, Medium → Execution Brief + Evidence Ledger, Vague → Idea Cards, Large → minimum modules → final brief.
4. **Close:** Pass with matched evidence, or fail → split smaller.

Use remote/live-system, OpenWrt, stateful-UI, external-context, provider-compatibility, multi-agent, delegated-execution, continuation, self-iteration, and background-learning as profiles layered onto the selected route. A stale external claim blocks dependent completion; a stale continuation blocks writes.

## Route Weight

- **Small:** 3-5 lines covering task, read/touch, done-when, verification, and result.
- **Medium:** compact Execution Brief, acceptance evidence matrix, and Evidence Ledger.
- **Vague:** three Idea Cards before implementation.
- **Large/risky:** only the internal modules that reduce scope or risk, compiled into one final brief.
- **Failed:** capture evidence and split smaller; do not repeat the same large attempt.
- **Multi-device:** one-writer rule is per target, not global. Parallel read-only probes are safe. Cross-target dependencies must be mapped before writes. End with a cross-target smoke test from the consumer's perspective.

## Batch Regression Verification

After multiple fixes across a target or fleet:
1. Re-run every originally-failed check. Every one must pass.
2. Run at least one negative control to guard against over-fixing.
3. For cross-target work, verify each dependency edge from the consumer side.
4. Produce a single `repair-verdict` block. Missing items stay as open, not silent.

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

## Evidence Reuse And Stop

- Once a diagnostic hypothesis is supported, another diagnostic probe must be able to change a named decision or fill a named acceptance row. Otherwise stop and reuse the bound evidence.
- Reuse never crosses a relevant mutation, deployment, rollback, ambiguous write, or freshness change, and never waives the original reproduction, sibling regression, negative control, external-client, rollback, cleanup, or parent integration checks.
- After all declared acceptance rows pass, emit one verdict and stop. Do not add corroboration on unchanged state merely for reassurance.
- If the user says to stop or accepts completion, cancel pending work and report current verified and unverified state without another probe.
- After a timeout or transport failure following a possible live mutation, do not replay the write. Run one bounded read-only reconciliation and continue only from the observed `applied | not_applied | split | unknown` state.

## Multi-Agent Contract

The parent is the integrator, default writer, and final verifier.

1. Parallelize ordinary agents only for independent investigation or review. Writing children require the explicit delegated-execution profile and a verified host runtime.
2. Assign one active writer per shared file set; never allow parallel writes to the same live resource. A fresh fixer may receive a serial lease handoff after its predecessor is terminal and the prior lease is released.
3. Only the parent may hold a live-system mutation lease.
4. Every subagent gets a bounded envelope: goal, exact scope, invariants, checks, forbidden actions, and output path/format.
5. Subagents may not deploy, expand scope, or declare the overall task complete.
6. Keep initial reviewers independent; reconcile conflicts through a new probe.
7. Require explicit `pass | fail | insufficient_evidence` spec and quality verdicts.
8. Fix important findings and send them through re-review.
9. The parent reruns critical checks rather than trusting summaries.
10. If user direction changes, stop stale agents and pending writes.
11. Before final response, verify that all agents and background resources are terminal.

For delegated execution, freeze work-item and fix-cycle budgets rather than pretending every future child ID is known before review. Every work item uses a fresh implementer and fresh task reviewer; every blocking fix uses a fresh fixer and fresh re-reviewer; final integration uses a fresh reviewer. Unique task/session IDs prove freshness. Completed threads may remain as host history, but active concurrency and cumulative thread creation stay bounded. Load `delegated-execution/SKILL.md`, and load `dispatch-parallel-domains/SKILL.md` only after proving independent domains.

Detect runtime capabilities from the current host tools, then consult `contracts/agent-runtime-registry.v1.json`. Model APIs are not subagent runtimes. Do not invent a primitive, shell out to another AI CLI, enable an extension, or install a runtime without separate authority.

For auditable work, the Evidence Ledger records `parent_authority`, a reserved parent-owned artifact root, and one `delegations` envelope per child, including the root/direct-parent authority and resource intersection, read-only status, actual summary budget, parent-only artifact path, and bound proposal/check evidence. A child never receives a live-system mutation lease.

For distributed work, each logical task envelope also records task/session/parent/dependency IDs, bounded goal, leaf/orchestrator role, iteration/attempt/time/depth limits, `attempts_used`, idempotency key, terminal result, touched files, checks, and timestamps. Enforce observed concurrency, stored task-input result order, successful dependency timing, ancestor cancellation propagation, bounded idempotent retry evidence, one active writer per path set, and holder/path/time-bound lease release evidence. Distinct read-only spec and integration reviewers must use distinct task/session identities and separately bound commands. Leaves cannot delegate, promote memory, deploy, message externally, use credentials, or mutate live state.

Use a durable progress ledger for long tasks or likely context compaction. Record only decisions, ownership, evidence, open risks, and the next exact action.

## Live And Stateful Systems

- Preserve the management path and create a rollback point before writes.
- Inspect desired, generated, and effective runtime state.
- Prove target capabilities with semantic micro-tests, not help text or exit status alone.
- Verify the real external client path and negative controls.
- A service restart, process, or `ready` label is not proof of function.
- Track resource ownership and prove stop/restart/reload do not leak processes, interfaces, files, locks, sockets, or workers.
- Redact secrets from logs, examples, handoffs, and final answers.

## MCP Capability Gate

- Use an available task-required MCP automatically when it is the first safe reuse rung and the call stays inside the user's current authority and declared scopes.
- Availability is capability, not authorization. Mutating, credentialed, deployment, messaging, and live-system calls retain their normal gates.
- If the MCP is missing, present its exact source/version, need, safe alternative, install scope/commands, permissions/data exposure, credentials, processes/restarts, verification, and rollback; download or install only after explicit user approval.
- Installation permission does not authorize authentication, secret disclosure, configuration mutation, or a resident service. Resident or auto-start behavior requires explicit user approval.
- If approval is declined or provenance is unverified, use a safe fallback or mark only the dependent acceptance row `unverified`; continue unrelated work without repeated prompts.

## Provider Compatibility And Spend

When an agent host uses a third-party/API-compatible model, gateway, or local proxy, load `provider-compatibility/SKILL.md`. Resolve the effective host/proxy/provider chain and health before paid work. Freeze logical-request, physical-attempt, input/output-token, turn, time, and subagent budgets. Multiply nested retry ceilings, stop before a third identical semantic action or after three non-narrowing turns, and never treat HTTP 200 or a proxy dashboard as proof of semantic completion or billing. Paid probes and external configuration changes require their own authority.

## Learning And Records

- If a user explicitly replaces or narrows the record destination, use only the newest target. An additional requested destination does not silently replace earlier ones.
- A failure is an observation first. A single severe case may justify a narrow expiring shadow checklist, but never a cross-task schema or automation by itself.
- Background learners are read-only candidate generators. Independent evaluators receive frozen candidates and hidden holdout/negative cases; the parent owns promotion and rollback.
- For two to four independent positive cases, use leave-one-case-out. Every case must be held out once, every fold must be non-inferior to baseline, at least one fold must improve, and all negative controls and zero-tolerance invariants must pass.
- Count distinct task and session IDs. Paraphrases, perturbations, and sibling agents from one run test robustness but do not create independent evidence.
- Active candidates require a bounded trigger and non-trigger boundary, current provenance, complexity budget, passing shadow window, explicit approval, and tested rollback. Load `generalization-gate/SKILL.md`.
- Metrics use observed values. Missing values stay `unknown`; no baseline means no efficiency claim.
- Schema cards and lesson cards form a typed memory graph via `[[wikilink]]` references and `related-schemas` YAML frontmatter. Before updating a promoted card, run the blast-radius protocol (`fp/contracts/memory-graph.js` + `fp/templates/memory-graph-traversal.md`) to identify dependent cards that may need re-evaluation. Hub cards (in_degree >= 3) and bridge cards require deeper evidence before modification.
- When reviewing user code, prefer code-review-graph MCP when available. Start with `get_minimal_context_tool` (~100 tokens); use `detect_changes_tool`, `get_impact_radius_tool`, and `get_knowledge_gaps_tool` for reviews. When MCP is unavailable, fall back to the grep-based `codebase-impact-map.md`. The MCP is an optional external tool acquired and used under the existing MCP Capability Profile gates; its availability does not expand write or deployment authority. Load `fp/templates/code-review-graph-mcp-contract.md` for the full tool map.

## Repository And Release Boundary

`.agents/skills/` is local agent configuration unless the repository explicitly owns it. Treat root `fp/` as canonical source. Never hand-edit generated install-pack copies; run the sync script and then verify byte-for-byte consistency.

No evidence, no done.
