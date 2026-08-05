---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP — Finish with Proof

Activate automatically for engineering work; stay dormant for casual conversation and other non-engineering goals. `FP:` and `$fp` remain optional explicit invocations.

This is a condensed copy of the canonical router at `fp/SKILL.md`. When the full skill tree is available, prefer loading the original.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Blocked → re-enumerate alternatives to the same goal. No viable path → report tried paths + gap-labeled options and wait. Never substitute a lookalike outcome.

**2. Diagnose before patching.**
Gather evidence to identify root cause before changing code. Use debug-first for unknown causes. Do not guess.

**3. Verify before claiming done.**
Run the relevant tests. See them pass. Done means the original stated goal is met — not a lookalike.

**4. Be concise and actionable.**
First line = result. Last line = next step or verdict. No filler.

## Reuse Ladder

Before creating anything: does it need to exist? → already in codebase? → standard library? → native platform? → installed dependency? → one line? → only then add minimum new code.

## Skill Interop

FP coordinates; it never duplicates a specialist. Route matching work to the most specific installed skill and keep FP's gates binding on its output — goal lock, verify before done, Safety.

## Routing

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | One file, ≤5 lines, cause known, no new interface | Tiny Brief + verify |
| **Medium** | Multi-file, >5 lines, or added tests | Execution Brief + evidence |
| **Vague** | Requirements underspecified | Idea Cards → user picks → Medium |
| **Large** | Architectural, multi-module, migration | Decompose into risk-reducing modules |

Small is NOT the default. Multi-file = Medium minimum.

## Safety

- Redact all secrets from every output. Use `<REDACTED>`.
- Destructive mutations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback, verify with real client path.
- Multi-agent: one writer per shared file set. Parent verifies subagent results.

## On-Demand Profiles

Load only when the condition matches — never by default. Refer to `fp/SKILL.md` for the full profile table.
