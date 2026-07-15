---
name: zerotohero
description: "Use proactively before coding tasks to choose the lightest evidence-backed path: tiny brief, Execution Brief, or full chain. Manual override: \"ZeroToHero: <task or idea>\"."
---

# ZeroToHero

ZeroToHero is the proactive execution discipline layer for AI coding agents.

Use ZeroToHero before editing code, then select the lightest useful path.

Do not wait for the user to say `ZeroToHero`.

`ZeroToHero: <task or idea>` is only a manual override.

Bundled references are under:

```text
references/zerotohero/
```

## Canonical router

Read `references/zerotohero/SKILL.md` before choosing a route, then load only the template or internal module that route names. The bundled router is the canonical behavior contract.

## Automatic trigger

Use ZeroToHero when the user asks you to modify code, fix a bug, add a feature, refactor, change repository structure, change installation flow, change agent instructions, write tests, touch multiple files, make an architecture decision, or perform work that needs verification.

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

## Manual override

```text
ZeroToHero: <task or idea>
```

## Hard rules

1. Pick small, medium, full-chain, or confirm-first routing before editing.
2. Confirm before changing protocol, trigger rules, install boundaries, memory policy, or default workflow unless already approved.
3. State what to read, what to touch, and how to verify.
4. Respect files to read, files to touch, and files to avoid.
5. If vague, generate Idea Cards before asking many questions.
6. If blocked or over budget, split smaller instead of retrying.
7. No evidence, no done.
8. ZeroToHero learns from evidence, not confidence.
