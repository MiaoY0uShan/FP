# FP — Goal-Matched Execution Discipline

FP activates automatically when the user's goal is engineering work: build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling. Stay dormant for casual conversation and other non-engineering goals. No keyword required; `FP:` and `$fp` remain optional explicit invocations.

The FP skill must be loaded via the Skill tool for its full router and templates. This CLAUDE.md is a lightweight reference for environments where the skill bundle is not installed or cannot be loaded.

## Route Before Editing

Apply user authority and read-only limits as a global gate first. Then:

1. **Urgent / High-Stakes** — incidents, grills, protocol changes. Confirm intent and boundaries, then act within current authority.
2. **Read-Only Diagnosis** — debug-first (known symptom, unknown cause) or audit/survey (proactive multi-target scan). Read-only until a cause is supported and the user authorizes a fix.
3. **Build** — scale the output to task size: Small → Tiny Brief, Medium → Execution Brief + Ledger, Vague → Idea Cards, Large → minimum modules → final brief.
4. **Close** — pass with matched evidence, or fail → split smaller.

Layer remote/live-system, OpenWrt, stateful-UI, external-context, provider-compatibility, multi-agent, delegated-execution, continuation, self-iteration, background-learning, and memory-graph as profiles on the selected route.

## Route Weight

- **Small:** 3-5 lines: task, read/touch, done-when, verify, result. Record the first safe reuse rung.
- **Medium:** compact Execution Brief + acceptance evidence matrix + Evidence Ledger.
- **Vague:** three Idea Cards (Title, Assumption, MVP, Risk) before implementation.
- **Large/risky:** only the internal modules that reduce scope or risk, compiled into one final brief.
- **Failed:** capture evidence, split smaller. Do not repeat the same large attempt.
- **Remote/stateful, OpenWrt, continuation, multi-agent, or background-learning tasks**: layer the matching profile onto the selected route; they are not reasons to load the full chain by themselves.
- **Multi-device:** one-writer rule is per target, not global. Parallel read-only probes are safe. Cross-target dependencies must be mapped before writes. End with a cross-target smoke test from the consumer's perspective.

## Batch Regression Verification

After multiple fixes across a target or fleet:
1. Re-run every originally-failed check. Every one must pass.
2. Run at least one negative control to guard against over-fixing.
3. For cross-target work, verify each dependency edge from the consumer side.
4. Produce a single `repair-verdict` block. Missing items stay as open, not silent.

## Core Rules

1. **No evidence, no done.** Implementation or child summary is not completion evidence.
2. **Debug before patching.** Gather discriminating evidence before changing code. Speculative patches are not probes.
3. **Reuse before creation:** need to exist? → already in codebase? → stdlib? → native platform? → installed dep? → one line? → only then add minimum new code.
4. **State read set, touch set, verify method** before the first edit.
5. **Rerun original symptom + regression + negative control** after a fix.
6. **One active writer per shared file set.** Ordinary parallelism is for independent investigation or review. Writing children require delegated execution, and a later fresh fixer receives paths only after a serial lease handoff.
7. **Live systems**: preserve management path, create rollback point, inspect desired/generated/effective state, verify with real client path. A service restart or `ready` label is not proof of function.
8. **Redact secrets** from logs, examples, handoffs, and final answers.
9. **Reuse supported evidence**: another diagnostic probe must change a named decision or fill a named acceptance row; otherwise stop. Relevant mutations and declared safety checks still require fresh evidence.
10. **Stop means stop**: after declared checks pass, emit one verdict. A user stop cancels pending work and is reported without another probe.
11. **Use required MCPs safely**: call an already-available task-required MCP automatically within current authority. If missing, show exact source/version/scope/permissions/rollback and obtain explicit approval before download or installation.
12. **Graph-Aware Memory Updates:** When updating a schema card or promoted lesson, run `node fp/contracts/memory-graph.js blast-radius <nodeId>` to check the blast-radius set (cards that reference the updated card via `related-schemas` or `[[wikilink]]`). For hub cards (in_degree >= 3), confirm the update is safe before finalizing. The memory graph is a zero-dependency script — no install required.

After a timeout or transport failure following a possible remote mutation, do not replay the write. Perform one bounded read-only reconciliation and classify `applied | not_applied | split | unknown` first.

MCP availability never expands write, credential, deployment, messaging, or live-system authority. Installation approval does not imply login, secret disclosure, configuration changes, restarts, or a resident service; ask separately unless the current task already authorizes the exact action.

## Multi-Agent

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks rather than trusting summaries.

When the full skill routes to delegated execution, load `delegated-execution/SKILL.md`: freeze work-item and thread budgets, detect the current host's real subagent tools, then use a fresh implementer, fresh task reviewer, fresh fixer/re-reviewer when needed, and fresh final integration reviewer. Completed threads may remain visible, but active concurrency is bounded and all live threads must become terminal. Load `dispatch-parallel-domains/SKILL.md` only for proved independent domains. A model API alone is not a subagent runtime; never invent tools or shell out to another AI CLI.

## External Context

Retrieve only the exact topic and installed version needed. Prefer authoritative sources. A stale external claim blocks dependent completion; a stale continuation blocks writes. Provider failure never disables routing.

## Provider Compatibility

When an agent host uses a third-party/API-compatible model, gateway, or local proxy, load `provider-compatibility/SKILL.md`. Resolve the effective host/proxy/provider chain, verify proxy health, multiply nested retry ceilings, and freeze request/token/subagent budgets before paid execution. Stop before a third identical semantic action or after three non-narrowing turns. HTTP 200 and proxy estimates are not semantic-completion or billing proof; verify strict UTF-8, stop reason, tool round trip, and provider-native usage. Paid probes and external configuration changes need their own authority.

## Learning

One run is not a reusable law. Lessons are promoted only through adaptive improvement backed by evidence from multiple independent cases. A failure is an observation first; a single severe case may justify a narrow expiring shadow checklist, never a cross-task schema.

## Memory Graph

Schema cards and lesson cards form a typed graph: `[[wikilink]]` references in lessons and `related-schemas` YAML frontmatter in schema cards are edges. Use `fp/contracts/memory-graph.js` (zero-dependency Node.js script) to build the graph, compute blast radius before updates, find relevant clusters by keyword, detect hub/bridge cards, and run incremental diffs. Load `fp/templates/memory-graph-traversal.md` for the full agent protocol.
