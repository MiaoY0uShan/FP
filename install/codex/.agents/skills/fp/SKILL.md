---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP

FP is the goal-matched execution discipline layer for AI coding agents.

Infer FP from the user's goal. Load it for engineering work, keep it dormant for casual or other non-engineering goals, and never require a keyword.

Bundled references are under:

```text
references/fp/
```

## Canonical router

Read `references/fp/SKILL.md` before choosing a route, then load only the template or internal module that route names. The bundled router is the canonical behavior contract.

## Implicit trigger

Use FP when the user asks to build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling. Do not load the full router for casual conversation or other non-engineering goals.

## Default behavior

- Small change -> produce a 3-5 line brief and validation result.
- Medium task -> produce a compact Execution Brief and Evidence Ledger.
- Large, vague, architectural, or risky task -> use Idea Cards or the full chain before execution.
- Protocol or agent-behavior change -> confirm intent and boundaries before editing.
- Unknown-cause failure or diagnose-only request -> use debug-first and stay read-only until a cause is supported.
- Multi-agent work -> parallelize independent investigation, keep one writer per shared file set, and require parent verification.
- Failed task -> use Failure-to-Smaller-Task Protocol.

## Repository boundary

`.agents/skills/` is local agent configuration, not project source, unless the repository explicitly opts in.

## Optional explicit invocation

```text
FP: <task or idea>
$fp <task or idea>
```

## Hard rules

1. Pick small, medium, full-chain, or confirm-first routing before editing.
2. Confirm before changing protocol, trigger rules, install boundaries, memory policy, or default workflow unless already approved.
3. State what to read, what to touch, and how to verify.
4. Respect files to read, files to touch, and files to avoid.
5. If vague, generate Idea Cards before asking many questions.
6. If blocked or over budget, split smaller instead of retrying.
7. No evidence, no done.
8. FP learns from evidence, not confidence.
