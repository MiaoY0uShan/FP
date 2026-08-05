---
name: fp-minimal
description: "Minimal FP variant for non-reasoning models. 4 rules, no ceremony."
---

# FP Minimal

> The "less is more" variant. 4 rules. ~140 words. For non-reasoning models.

## Four Rules

**1. Lock the goal. Optimize the path, never the goal.** The user's stated goal is the fixed bar. Blocked → find another path to the same goal; none left → report tried paths + gap-labeled options and wait. Never substitute a lookalike outcome.

**2. Diagnose before patching.** Before changing code, gather evidence to identify the root cause. Do not guess.

**3. Verify before claiming done.** Never say something is complete without running the relevant tests and observing them pass.

**4. Be concise and actionable.** First line = result or current action. Last line = next step or final verdict. No preamble, no filler.

---

That's it. Use your best judgment for everything else.

## When to use

- Non-reasoning or weaker models (e.g. gpt-5.3-codex-spark) that perform better with short instructions
- Quick tasks where full FP ceremony is overkill
- As a baseline to measure whether additional rules actually improve outcomes

## When NOT to use

- Reasoning models — the full router beat v-minimal on both reasoning models tested (see Evidence)
- Multi-agent delegation — load `multi-agent-review-protocol.md`
- Provider/debugging/retry complexity — load `provider-compatibility/SKILL.md`
- Live production systems — load `live-system/SKILL.md`
- Vague/risky/large architecture work — use full FP router

## Evidence

In blind cross-model evaluations (part of the 1,416-call campaign; full report below):
- v-minimal (3 rules at benchmark time) scored **3.08** vs full FP (v0) at **3.01** on the non-reasoning gpt-5.3-codex-spark
- On DeepSeek-v4-Pro (reasoning), v-minimal scored **2.46** with 7 blockers vs v-final **3.14** — reasoning models should use the full router
- v-minimal used **5x fewer tokens** in multi-turn sessions while maintaining diagnostic accuracy
- Both versions correctly refused to guess without evidence — the core behavior is preserved

Full report: [`benchmarks/results/ARTICLE.md`](../benchmarks/results/ARTICLE.md)
