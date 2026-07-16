---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP: Universal Execution Protocol

FP is a lightweight execution discipline for AI coding agents. It selects the smallest route that can still produce trustworthy evidence. Infer activation from the user's goal; an explicit keyword is optional.

## Core Mandates

1. **Goal-Matched Ghost Mode:** Activate automatically for engineering goals. Do not require `FP:` or `$fp`, and stay dormant for casual or other non-engineering goals.
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
-> audit/survey (scan a fleet, cluster, or multi-device target for issues)
-> protocol or agent-behavior change
-> small / medium / vague / large route
```

A read-only incident may OBSERVE and recommend reversible containment/restoration, but it may not mutate the target. Route priority never expands authority.

Remote/stateful, OpenWrt/live-system, external-context, multi-agent, continuation, stateful-UI, self-iteration, and background-learning are profiles layered onto a route. They are not reasons to load the full chain by themselves.

## Routes

Select the first matching route. Every route below sub-routes by scale or scenario internally.

### 1. Urgent / High-Stakes

Use for active incidents, explicit grill/challenge requests, or protocol/behavior changes that affect the agent's own rules.

**Active incident (ongoing outage, security event, data-loss risk, unstable management path):**

```text
OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN
```

Preserve evidence, access, and rollback. Restore service before long-term refactoring. Use separate briefs for restoration and permanent repair. Load `templates/debug-incident-checklist.md`.

**Grill / challenge:** Load `question-requirements/SKILL.md` before any other routing. Investigate repository facts yourself; ask one user-owned decision at a time, with a recommendation and alternative. Do not edit until the user confirms shared understanding or explicitly accepts safe defaults.

**Protocol / agent-behavior change:** Restate the inferred goal, challenge assumptions, list affected areas, and ask for confirmation unless the user explicitly approved the discussed change.

### 2. Read-Only Diagnosis

Use when the target has an unknown failure, the user asked for diagnosis without a fix, or the user wants a proactive scan across multiple targets (fleet / cluster / routers / VMs / containers / repos).

**Debug-first (known symptom, unknown cause):**

```text
pin symptom -> read-only baseline -> falsifiable hypothesis
-> cheapest discriminating probe -> decision -> authorized fix
-> original reproduction + regression + negative control
```

Diagnosis is read-only by default. Keep at most two active hypotheses and run one discriminating probe at a time. Speculative patches are never probes. Three consecutive non-narrowing probes trigger an architecture/observability checkpoint. If the third probe narrows the cause, continue from that evidence. When the user asked only for diagnosis, stop before any fix.

Load `templates/debug-incident-checklist.md` for the causal trace, shared-boundary regression set, and condition-based wait contract.

**Audit / survey (no known failure, proactive discovery):**

```text
read-only -> per-target baseline -> cross-target comparison -> triaged report
```

1. Gather current state from every target in parallel (read-only probes only).
2. Compare against known-good baselines (config, sysctl, firewall, services, logs, resources).
3. Prioritize findings by severity: P0 (degraded/broken) -> P1 (measurable impact) -> P2 (cosmetic/idle).
4. Report with per-target evidence before offering to fix.
5. After user authorization, apply fixes in serial per target to avoid correlated blast radius.

A one-target audit degenerates to a read-only survey. Do not mutate any target until the user approves specific findings for repair.

### 3. Build

Scale the output template to task size and uncertainty. Every build route records the first safe reuse rung (Core Mandate 10) before the first edit.

| Scale | Trigger | Output |
|-------|---------|--------|
| **Small** | Clear, single-file, 3-5 lines of change | Tiny Brief: task, read/touch, done-when, verify, result |
| **Medium** | Clear, multi-file, bounded scope | Execution Brief + acceptance evidence matrix + Evidence Ledger |
| **Vague** | Underspecified, uncertain requirements | Three Idea Cards (Title, Assumption, MVP, Risk), then user choice |
| **Large/risky** | Architectural, multi-module, breaking | Only the internal modules that reduce risk, compiled into one final brief |

Do not generate a full ledger for small changes unless risk appears.

### 4. Close

**Pass:** Evidence weight matches route weight. All required checks passed. The original symptom no longer reproduces.

**Fail / blocked:** Record evidence, split into a smaller testable slice. A failure is not permission to repeat the same patch. Lessons and automation are promoted only through adaptive improvement backed by evidence.

## Definition Of Done

Before the first edit on medium, debug, live, or risky work, map each requirement to:

```text
requirement -> observable -> check/probe -> pass condition -> evidence location
```

Implementation is not an observable. For a bug fix, the original reproduction must fail before or be otherwise pinned, then pass after the fix. Use `templates/acceptance-evidence-matrix.md`.

### Batch Regression Verification

After completing multiple fixes across a target or fleet, run a closing sweep before declaring done:

1. Re-run every originally-failed check from the pre-fix baseline. Every one must pass.
2. Run at least one negative control: a check that should still fail (or still be absent) and does. This guards against over-fixing.
3. For cross-target work, verify each dependency edge from the consumer side (e.g., DNS resolution from a client, not just the DNS server's own `nslookup`).
4. Produce a single `repair-verdict` block listing each fix, its post-repair observed value, and the verifying check. Missing or still-broken items stay as open items, not silent successes.

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

### Multi-Device Coordination

When a task spans multiple independent targets (routers, VMs, containers, physical hosts), the one-writer rule applies per target, not globally. Parallel read-only probes across targets are safe. Serialize writes within a single target; parallel writes to different targets are permitted when they share no dependency or blast-radius coupling.

1. Document each target's identity (hostname, IP, role) before the first probe.
2. Each target gets its own read set, touch set, and rollback point.
3. Cross-target dependencies (e.g., DNS on A, proxy on B) must be mapped before any write.
4. After all fixes, run a cross-target smoke test: verify each dependency pair from the consumer's perspective, not the provider's.

## Live-System Profiles

- For any remote or stateful target, load `templates/remote-stateful-system-checklist.md`.
- For OpenWrt, embedded Linux, routers, Wi-Fi, procd, or BusyBox, also load `templates/openwrt-live-system-verification-profile.md`.
- For stateful UI handoffs, load `templates/stateful-ui-handoff-checklist.md`.

Capability claims must be proved on the target. A successful restart or `ready` label is not functional evidence.

## External Context Profile

When a task depends on a current/versioned library or API, retrieve only the exact topic and installed version needed. Prefer authoritative sources, redact external queries, bound retries, record freshness, and keep unknown claims unverified. Provider failure never disables the FP router, but a fact required for acceptance blocks dependent edits and completion until local or official evidence verifies it. External providers are optional; FP still works without network, API keys, MCP, or a CLI. Load `templates/context-retrieval-contract.md`.

## Continuation Profile

For incomplete work crossing a session or compaction, compile a structured Evidence Ledger `continuation` block. Capture the versioned `fp-worktree-v1` fingerprint. On resume, reload the router, compute current state with `scripts/fingerprint-worktree.js`, resolve evidence references, and continue only the exact next action after a match. Never auto-replay writes. Corrupt or stale continuation fails closed for mutation. Load `templates/continuation-handoff.md`.

## Self-Iteration Profile

When the user requests iterative improvement, predeclare the number of evidence cycles. Each cycle must have a new failing observation or review finding, a bounded change, and rerun evidence. Do not invent changes merely to fill a cycle. Use adaptive improvement after an Evidence Ledger; never silently rewrite FP from confidence alone.

## Background-Learning Profile

After a non-trivial evidenced run, a read-only background learner may stage one checklist, schema, skill-patch, or automation candidate while the parent continues independent work. It receives only relevant ledgers and a bounded envelope; it never writes shared policy or long-term memory. A separate read-only evaluator runs hidden holdout, negative-control, and invariant cases. The parent alone may move a candidate from observation/proposed to shadow or active.

One run is not a reusable law. Load `adaptive-improvement/SKILL.md`, then `generalization-gate/SKILL.md`. Two to four independent positive cases use leave-one-case-out; every active candidate also needs distinct task/session evidence, baseline comparison, at least one improvement, no regression, negative controls, zero-tolerance invariants, a complexity budget, passing shadow observations, approval, current provenance, and rollback. Paraphrases and sibling agents from the same run do not count as independent cases.

## Repository Boundary

`.agents/skills/` is local agent configuration unless a repository explicitly owns it. Keep portable source under `fp/`; refresh generated install copies with the repository sync script. Do not hand-edit generated copies.
