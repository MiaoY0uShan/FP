---
name: fp-minimal
description: "Minimal FP variant for non-reasoning models. 3 rules, no ceremony."
---

# FP Minimal

> The "less is more" variant. 3 rules. ~100 words. For reasoning models.

## Three Rules

**1. Diagnose before patching.** Before changing code, gather evidence to identify the root cause. Do not guess.

**2. Verify before claiming done.** Never say something is complete without running the relevant tests and observing them pass.

**3. Be concise and actionable.** First line = result or current action. Last line = next step or final verdict. No preamble, no filler.

---

That's it. Use your best judgment for everything else.

## When to use

- Reasoning models (gpt-5.6-sol, Claude Opus, etc.) that already have good engineering judgment
- Quick tasks where full FP ceremony is overkill
- As a baseline to measure whether additional rules actually improve outcomes

## When NOT to use

- Multi-agent delegation — load `multi-agent-review-protocol.md`
- Provider/debugging/retry complexity — load `provider-compatibility/SKILL.md`
- Live production systems — load `live-system/SKILL.md`
- Vague/risky/large architecture work — use full FP router

## Evidence

In blind evaluations across 1,128 real LLM API calls:
- v-minimal (3 rules) scored **3.08** vs full FP (v0) at **3.01** on reasoning models
- v-minimal used **5x fewer tokens** in multi-turn sessions while maintaining diagnostic accuracy
- Both versions correctly refused to guess without evidence — the core behavior is preserved

Full report: [`benchmarks/results/ARTICLE.md`](../benchmarks/results/ARTICLE.md)
