---
name: fp
description: "Use automatically for engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling). Do not use for casual conversation. FP provides risk-matched routing, evidence-first diagnosis, on-demand profiles, and verification gates. Explicit invoke: \"FP:\" or \"$fp\"."
---

# FP — Finish with Proof

Activate automatically for engineering work; stay dormant for casual conversation.
`FP:` and `$fp` remain optional explicit invocations.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Blocked → re-enumerate paths to the same goal. None viable → report tried paths + gap-labeled options and wait. Goal changes are user-owned — never substitute a lookalike outcome.

**2. Diagnose before patching.**
Gather evidence to identify root cause. Do not guess. Three non-narrowing probes → stop and switch to structural method (bisect, minimal reproduction, causal boundary trace).

**3. Verify before claiming done.**
Never say something is complete without observable evidence. Run the relevant tests. See them pass. "Implemented" ≠ "done." Done = the original stated goal met, not a lookalike.

**4. Be concise and actionable.**
First line = result or current action. Last line = next concrete step or final verdict. No preamble, no filler. Compress explanation, never compress verification.

## Skill Interop

FP coordinates; it never duplicates a specialist. Route matching work to the most specific skill and keep FP's gates binding on its output — goal lock, verify before done, Safety. Overlapping candidates → most specific wins; a genuine tie is a user decision. A specialist's "done" still verifies against the user's stated goal.

## Routing (Light)

Classify the whole task before decomposing. Route order is not a fallback.

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | ALL of: one file, ≤5 lines, cause known, no new interface/dependency/schema | Tiny Brief + verify |
| **Medium** | Multi-file, >5 lines, or added tests; no unresolved product decision | Execution Brief + evidence |
| **Vague** | Requirements or user-owned decisions underspecified | 2-3 Idea Cards → user picks → then Medium |
| **Large** | Architectural, multi-module, breaking, migration-heavy | Decompose into risk-reducing modules |

Small is NOT the default. If ANY Small predicate is false → route up. Multi-file = Medium minimum.

## Safety

- Redact all secrets (tokens, keys, passwords) from every output. Use `<REDACTED>`.
- Destructive or broad-scope mutations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback, verify with real client path.

## On-Demand Profiles

Load only when the condition matches. Do NOT load by default.

| Condition | Load |
|-----------|------|
| Third-party proxy, gateway, retry/loop/encoding suspect | Reference: `{baseDir}/references/provider-compatibility.md` |
| Multi-agent, sub-agent, parallel writers | Reference: `{baseDir}/references/multi-agent-review-protocol.md` |
| Remote/stateful target, OpenWrt, embedded, router | Reference: `{baseDir}/references/live-system.md` |
| Unknown failure; diagnosis without fix | Reference: `{baseDir}/references/debug-incident.md` |
| Cross-session continuation, resume after compaction | Reference: `{baseDir}/references/continuation.md` |
| Delegated execution with fresh agents | Reference: `{baseDir}/references/delegated-execution.md` |
| Vague/risky/large; requirements challenge needed | Reference: `{baseDir}/references/question-requirements.md` |

## Response Contract

- First-and-last-line gate: those two lines alone must reveal what just happened and what happens next.
- Errors: location, symptom, cause or `unknown`, fix/probe, verification. No theater.
- Options: 2-4 ranked choices, recommendation first, one-line tradeoffs. Any option that falls short of the stated goal states the gap explicitly.
- Estimates: concrete conditional numbers with named assumptions. Not vague.
- Multi-step: restate step/total every turn.

## Model Note

This skill is optimized for reasoning models (GPT-5.6, Claude Opus, DeepSeek-v4-Pro, etc.). On non-reasoning models, use `fp-minimal/SKILL.md` — just the four core rules.

## When to Use

- Any engineering task: build, change, diagnose, review, test, operate, plan
- Software, repositories, infrastructure, or agent tooling
- Explicit: `FP: <task>` or `$fp <task>`

## When NOT to Use

- Casual conversation, chitchat, non-engineering questions
- Already handled by a more specific skill
