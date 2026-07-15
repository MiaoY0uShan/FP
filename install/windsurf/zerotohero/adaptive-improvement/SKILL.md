---
name: zerotohero-adaptive-improvement
description: "Use only when routed by ZeroToHero after a non-trivial evidenced run to stage a reusable checklist, schema, or automation candidate."
---

# ZeroToHero: Adaptive Improvement

Learn from evidence, not confidence. This skill stages improvements; it is not an autonomous self-modifying loop.

## Inputs

An Evidence Ledger is mandatory. Add a Metrics Report only when observed measurements matter. Execution Briefs, review findings, and prior promoted lessons may provide context.

Without an Evidence Ledger, return `Decision: reject — no evidence`.

## Evidence Cycle

1. Classify the run: pass, fail, blocked, or partial.
2. Extract the concrete observation and its evidence reference.
3. Identify what worked, failed, drifted, or wasted context/scope.
4. Check whether it is repeated, clearly prevents a severe failure, or measurably improves verification/scope/context.
5. Choose one bounded change: local observation, checklist/template, schema candidate, skill-patch candidate, or automation candidate.
6. State what the change could make worse.
7. Stage a proposal with target, origin/owner, evidence references, exact diff or content hash, rollback, falsifying check, and approval state.
8. Freeze the candidate before evaluation. Keep training case IDs separate from hidden holdout and negative-control case IDs.
9. Send reusable candidates to `generalization-gate/SKILL.md`; the candidate author may not evaluate or approve its own proposal.
10. Apply only with user authorization and a passing promotion gate, then rerun a check capable of falsifying it.
11. Record the new result before another cycle.

When the user requests N self-iterations, predeclare N cycles. Each cycle requires a new failing check or independent review finding, one bounded change, and rerun evidence. Do not invent changes to fill a cycle; a clean adversarial review is itself the final evidence for that cycle.

## Promotion States

- `observation`: one run; keep in the ledger/report. A clearly evidenced severe risk may become only a narrow, expiring shadow checklist.
- `observe_more`: plausible but not yet reusable.
- `promote_to_checklist`: repeated and generalization-gated; a severe single case remains shadow-only until independent evidence exists.
- `promote_to_schema`: stable cross-task pattern that passed held-out, negative-control, invariant, shadow, and rollback gates.
- `automation_candidate`: repeated, deterministic, bounded, reversible, independently evaluated, and already covered by checks.
- `reject`: speculative, redundant, or increases ceremony without reducing risk.

Never automate confusion. Prefer a small checklist or validator over a new skill/runtime. Paraphrases, prompt perturbations, and multiple subagents from one task are robustness checks, not independent promotion evidence.

## Output

Use `templates/adaptive-improvement-report.md` and include:

- source evidence and quality;
- cycle number and run result;
- observation vs repeated pattern;
- bounded proposed change;
- expected benefit and falsifying check;
- safety/regression risk;
- promotion decision;
- actual post-change result, when authorized.
- proposal owner/origin, exact diff or hash, rollback, falsifying check, and approval state.
- distinct task/session IDs, training IDs, hidden holdout IDs, negative controls, baseline/candidate evidence, complexity delta, and shadow/expiry state.

Do not silently edit ZeroToHero, repository rules, lessons, or schemas. Promotion changes still obey protocol-change confirmation unless the user already authorized them.
