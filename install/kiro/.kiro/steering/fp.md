---
inclusion: always
---

# FP — Goal-Matched Execution Discipline

FP activates automatically when the user's goal is engineering work: build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling. Stay dormant for casual conversation and other non-engineering goals. No keyword required; `FP:` and `$fp` remain optional explicit invocations.

## Route Before Editing

Apply user authority and read-only limits as a global gate first. Then:

1. **Active incident** → `OBSERVE → CONTAIN → RESTORE → REPAIR → LEARN` within current authority.
2. **Explicit grill/challenge** → investigate facts, ask one decision at a time.
3. **Diagnose-only or unknown-cause** → debug-first, read-only until a cause is supported.
4. **Protocol/agent-behavior change** → confirm intent and boundaries before editing unless already approved.
5. **Small → Medium → Vague → Large** route.

Layer remote/live-system, OpenWrt, stateful-UI, external-context, multi-agent, continuation, self-iteration, and background-learning as profiles on the selected route. They are not reasons to load the full chain by themselves.

## Route Weight

- **Small:** 3-5 lines: task, read/touch, done-when, verify, result. Record the first safe reuse rung.
- **Medium:** compact Execution Brief + acceptance evidence matrix + Evidence Ledger.
- **Vague:** three Idea Cards (Title, Assumption, MVP, Risk) before implementation.
- **Large/risky:** only the internal modules that reduce scope or risk, compiled into one final brief.
- **Failed:** capture evidence, split smaller. Do not repeat the same large attempt.
- **Remote/stateful, OpenWrt, continuation, multi-agent, or background-learning tasks**: layer the matching profile onto the selected route; they are not reasons to load the full chain by themselves.

## Core Rules

1. **No evidence, no done.** Implementation or child summary is not completion evidence.
2. **Debug before patching.** Gather discriminating evidence before changing code. Speculative patches are not probes.
3. **Reuse before creation:** need to exist? → already in codebase? → stdlib? → native platform? → installed dep? → one line? → only then add minimum new code.
4. **State read set, touch set, verify method** before the first edit.
5. **Rerun original symptom + regression + negative control** after a fix.
6. **One writer per shared file set.** Parallelize only independent investigation or review.
7. **Live systems**: preserve management path, create rollback point, inspect desired/generated/effective state, verify with real client path. A service restart or `ready` label is not proof of function.
8. **Redact secrets** from logs, examples, handoffs, and final answers.

## Multi-Agent

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks rather than trusting summaries.

## External Context

Retrieve only the exact topic and installed version needed. Prefer authoritative sources. A stale external claim blocks dependent completion; a stale continuation blocks writes. Provider failure never disables routing.

## Learning

One run is not a reusable law. Lessons are promoted only through adaptive improvement backed by evidence from multiple independent cases. A failure is an observation first; a single severe case may justify a narrow expiring shadow checklist, never a cross-task schema.
