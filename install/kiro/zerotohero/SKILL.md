---
name: zerotohero
description: "Use proactively before coding tasks, or when invoked with \"ZeroToHero:\", to choose the lightest evidence-backed execution route."
---

# ZeroToHero: Universal Execution Protocol

ZeroToHero is a lightweight execution discipline for AI coding agents. It selects the smallest route that can still produce trustworthy evidence.

## Core Mandates

1. **Ghost Mode:** Activate automatically for coding tasks.
2. **Lessons First:** Search `lessons-learned/` only for patterns relevant to the task. Only cards whose status is `promoted` may act as reusable policy; observations and bounded shadows are hypotheses that require task-local evidence.
3. **No Proof, No Edit:** Before editing, state the read set, touch set, acceptance evidence, and verification method.
4. **Baseline Before Blame:** For medium, risky, or multi-agent work, capture repository root/revision, pre-existing worktree changes and their ownership, and relevant pre-existing failures before the first edit. Do not attribute them to this run or overwrite them. Isolation is a risk decision, not a mandatory worktree.
5. **Debug Before Patching:** When the cause is unknown, gather discriminating evidence before changing code or live state.
6. **Auto-Verify:** Run the declared checks after execution and rerun the original symptom for fixes.
7. **Evidence-Led:** No task is complete without observed results. Unknown remains `unknown`.
8. **Latest Record Target Wins When It Replaces:** If the user explicitly narrows or replaces a record destination, write only to the newest target. Do not infer replacement when the user asks for an additional destination.
9. **Challenge System Changes:** For protocol, trigger, install-boundary, memory-policy, or default-workflow changes, confirm intent and scope unless the user already approved implementation.
10. **Reuse Before Creation:** On every coding route, including Small and Medium, stop at the first safe rung: does this need to exist -> already in this codebase -> standard library -> native platform feature -> installed dependency -> one line -> minimum new code only then. Record the winning rung in the brief; do not require the full chain merely to perform this check.

## Routing Priority

First apply user authority and read-only limits as a global gate over every route. Then select the first matching operational route:

```text
active incident
-> explicit "grill/challenge me" request
-> diagnose-only or unknown-cause bug
-> protocol or agent-behavior change
-> small / medium / vague / large route
```

A read-only incident may OBSERVE and recommend reversible containment/restoration, but it may not mutate the target. Route priority never expands authority.

Remote/stateful, OpenWrt/live-system, external-context, multi-agent, continuation, stateful-UI, self-iteration, and background-learning are profiles layered onto a route. They are not reasons to load the full chain by themselves.

## Routes

### A. Active Incident

Use only for an ongoing outage, security event, data-loss risk, or unstable management path.

```text
OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN
```

Preserve evidence, access, and rollback. Restore service before long-term refactoring. Use separate briefs for restoration and permanent repair. Load `templates/debug-incident-checklist.md`.

### B. Debug-First

Use when a concrete failure has an unknown cause, runtime state contradicts configuration, diagnosis is requested, or a previous fix failed.

```text
pin symptom -> read-only baseline -> falsifiable hypothesis
-> cheapest discriminating probe -> decision -> authorized fix
-> original reproduction + regression + negative control
```

Diagnosis is read-only by default. Keep at most two active hypotheses and run one discriminating probe at a time. Speculative patches are never probes. When three consecutive rejected/unknown probes have not narrowed the cause, perform an architecture/observability checkpoint before forming a fourth hypothesis. If the third probe narrows the cause, continue from that evidence instead of resetting mechanically. If the user asked only for diagnosis, do not implement a fix.

Load `templates/debug-incident-checklist.md` for the causal trace, shared-boundary regression set, and condition-based wait contract.

### C. Explicit Challenge / Grill

When the user explicitly asks to be grilled or challenged, load `question-requirements/SKILL.md` before size routing. Investigate repository facts yourself; ask one user-owned decision at a time, with a recommendation and alternative. Do not edit until the user confirms shared understanding or explicitly accepts safe defaults.

### D. Protocol Or Agent-Behavior Change

Restate the inferred goal, challenge assumptions, list affected areas, and ask for confirmation unless the user explicitly approved the discussed change.

### E. Small Clear Change

Use a 3-5 line Tiny Brief:

- Task
- Read/touch
- Done when
- Verify
- Result after execution

The `Read/touch` line also records the first safe reuse rung from Core Mandate 10.

Do not generate a full ledger unless risk appears.

### F. Medium Clear Task

Use a compact Execution Brief and Evidence Ledger. Define an acceptance evidence matrix and record the first safe reuse rung before the first edit.

### G. Vague Idea

Generate three Simplified Idea Cards with Title, Assumption, MVP, and Risk. Ask which path to compile.

### H. Large, Architectural, Or Risky Task

Load only the internal modules needed: question-requirements, delete-scope, semantic-architecture when coupling risk exists, optimize-path, and shorten-iteration when work is too large or a loop fails. Compile one final Execution Brief before editing.

### I. Completion, Failure, Or Block

Match evidence weight to route weight. A failed run records evidence and becomes a smaller testable slice; it is not permission to repeat the same patch. Lessons and automation are promoted only through adaptive improvement backed by evidence.

## Definition Of Done

Before the first edit on medium, debug, live, or risky work, map each requirement to:

```text
requirement -> observable -> check/probe -> pass condition -> evidence location
```

Implementation is not an observable. For a bug fix, the original reproduction must fail before or be otherwise pinned, then pass after the fix. Use `templates/acceptance-evidence-matrix.md`.

## Multi-Agent Profile

Use parallel agents only for independent investigation or review. The parent is the integrator and independently verifies every completion claim.

- Default to one parent plus at most two reviewers; add a specialist only for a distinct, bounded risk.
- One writer owns each shared file set. Only the parent holds a live-system mutation lease.
- Give every subagent a task-local envelope: goal, exact files/resources, invariants, verification, forbidden actions, and output location.
- Keep first-pass reviewers independent. Resolve disagreement with evidence, not a vote.
- Record spec and quality verdicts. Important fixes must be re-reviewed.
- Stop stale agents when the user changes direction. End with no active agent, poller, or temporary live mutation.

For distributed or resumable work, every child also receives a structured task/result envelope: task/session/parent IDs, bounded goal/context, role, authority/tool ceiling, dependency IDs, max iterations/attempts/time/depth, workspace/resources, idempotency key, terminal status, bound evidence, parent-only reserved artifact reference, touched files, checks, actual summary usage, and start/finish time. Return results in task-input order. Derive concurrency, dependency, timeout, retry, cancellation, and summary gates from envelopes. Every writer needs a holder/path/time-bound lease with observed release evidence. Distinct read-only spec and quality reviewers return separately bound commands; booleans or prose alone never close the integration gate. Leaf agents cannot delegate, promote memory, message externally, deploy, use credentials, or mutate live state.

Load `templates/multi-agent-review-protocol.md` when this profile applies.

## Live-System Profiles

- For any remote or stateful target, load `templates/remote-stateful-system-checklist.md`.
- For OpenWrt, embedded Linux, routers, Wi-Fi, procd, or BusyBox, also load `templates/openwrt-live-system-verification-profile.md`.
- For stateful UI handoffs, load `templates/stateful-ui-handoff-checklist.md`.

Capability claims must be proved on the target. A successful restart or `ready` label is not functional evidence.

## External Context Profile

When a task depends on a current/versioned library or API, retrieve only the exact topic and installed version needed. Prefer authoritative sources, redact external queries, bound retries, record freshness, and keep unknown claims unverified. Provider failure never disables the ZeroToHero router, but a fact required for acceptance blocks dependent edits and completion until local or official evidence verifies it. External providers are optional; ZeroToHero still works without network, API keys, MCP, or a CLI. Load `templates/context-retrieval-contract.md`.

## Continuation Profile

For incomplete work crossing a session or compaction, compile a structured Evidence Ledger `continuation` block. Capture the versioned `zerotohero-worktree-v1` fingerprint. On resume, reload the router, compute current state with `scripts/fingerprint-worktree.js`, resolve evidence references, and continue only the exact next action after a match. Never auto-replay writes. Corrupt or stale continuation fails closed for mutation. Load `templates/continuation-handoff.md`.

## Self-Iteration Profile

When the user requests iterative improvement, predeclare the number of evidence cycles. Each cycle must have a new failing observation or review finding, a bounded change, and rerun evidence. Do not invent changes merely to fill a cycle. Use adaptive improvement after an Evidence Ledger; never silently rewrite ZeroToHero from confidence alone.

## Background-Learning Profile

After a non-trivial evidenced run, a read-only background learner may stage one checklist, schema, skill-patch, or automation candidate while the parent continues independent work. It receives only relevant ledgers and a bounded envelope; it never writes shared policy or long-term memory. A separate read-only evaluator runs hidden holdout, negative-control, and invariant cases. The parent alone may move a candidate from observation/proposed to shadow or active.

One run is not a reusable law. Load `adaptive-improvement/SKILL.md`, then `generalization-gate/SKILL.md`. Two to four independent positive cases use leave-one-case-out; every active candidate also needs distinct task/session evidence, baseline comparison, at least one improvement, no regression, negative controls, zero-tolerance invariants, a complexity budget, passing shadow observations, approval, current provenance, and rollback. Paraphrases and sibling agents from the same run do not count as independent cases.

## Repository Boundary

`.agents/skills/` is local agent configuration unless a repository explicitly owns it. Keep portable source under `zerotohero/`; refresh generated install copies with the repository sync script. Do not hand-edit generated copies.
