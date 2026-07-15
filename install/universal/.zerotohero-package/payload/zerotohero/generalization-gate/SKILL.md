---
name: generalization-gate
description: "Evaluate evidence-backed checklist, schema, skill-patch, or automation candidates before shadowing or promotion. Use after adaptive improvement, for background-learning proposals, or whenever a rule inferred from a small number of runs could overfit, underfit, leak its holdout cases, or cause negative transfer."
---

# ZeroToHero: Generalization Gate

Promote a reusable policy only after it survives evidence it was not built to memorize. This gate evaluates external skills, checklists, and automation; it does not train model weights.

## Required Inputs

Require a canonical Evidence Ledger, a bounded candidate diff or content hash plus freeze time, a rollback, and cases with recomputable canonical source-ledger snapshot hashes plus task/session identity. Reject unverifiable summaries. Every observed command used by the gate must bind the frozen candidate hash, producer, stage, subject, and variant; a generic passing command cannot prove a learning claim.

Separate three roles:

- candidate agent: sees only the training fold and proposes one bounded semantic change;
- evaluator: read-only, receives the frozen candidate plus hidden holdout/negative cases;
- parent/integrator: verifies evidence, decides state, and is the only actor allowed to promote.

The candidate agent and evaluator must be different delegations. Do not leak expected answers, prior reviewer conclusions, or holdout contents into the candidate context.

## Finite-Evidence Protocol

Count independent task instances, not prompts or agents. Paraphrases, noise injection, and multiple subagents from one run are robustness variants, not independent evidence.

- Zero independent cases: reject.
- One case: keep an `observation`, or a narrow expiring `shadow` checklist for a clearly evidenced severe risk. Never promote it to a cross-task schema or automation.
- Two to four positive cases: run leave-one-case-out. Freeze the candidate from `n-1` cases, let an independent evaluator test the unseen case, rotate until every case was held out once, and keep only the smallest semantic intersection that passes every fold.
- Five or more cases: use bounded folds, but require every case to appear in a holdout at least once and keep task/session independence.

Every promotion set also requires:

1. at least one near-neighbor negative control that must abstain or preserve behavior;
2. invariant checks for authority, scope, safety, cancellation, idempotency, and other zero-tolerance boundaries that apply;
3. a baseline-versus-candidate measurement on each fold with the same metric and unit; derive `improved`, `non_inferior`, or `regressed` from direction, scores, and tolerance instead of trusting a prose verdict;
4. a public behavior seam and a separately evidenced oracle, with baseline, candidate, and oracle all returned by the same blind evaluator;
5. a predeclared complexity unit and delta, with distinct bound baseline/candidate measurements, so examples do not each add permanent exception text.

Failing training cases indicate underfitting. A holdout or invariant regression indicates overfitting. A negative-control failure indicates over-broad triggering. Do not average away any of these failures.

## Background Learning Pipeline

Run background learning only as bounded delegated work:

```text
observed ledgers
-> read-only candidate extraction
-> read-only boundary/negative-case construction
-> independent blind evaluation
-> parent verification
-> observation | shadow | active | rejected
```

Use task-local context, time/iteration/depth limits, idempotency keys, stable result ordering, cancellation propagation, and terminal cleanup. A background worker may propose; it may not edit shared policy, write long-term memory, deploy, or grant itself authority.

## Shadow And Promotion

Before `active`, require:

- all folds, negative controls, and invariants pass with observed evidence references;
- at least two distinct task IDs and two distinct session IDs;
- evaluator producer independence, hidden-context isolation, and no train/holdout fingerprint or source-ledger overlap;
- candidate complexity within its declared delta;
- an approved target hash/diff whose applied target bytes match that hash, plus a bounded trigger and non-trigger boundary;
- a passing shadow window with zero failures and distinct source-snapshot/task/session/fingerprint/evidence records whose observed times follow the candidate freeze;
- a tested rollback and current source provenance.

Use at least three future qualifying shadow observations unless a stricter project rule applies. One severe false trigger immediately rejects or rolls back the candidate. Archive stale agent-created candidates; never auto-delete them or curate user-owned rules.

## Output

Record `learning_evidence` using `templates/generalization-evaluation.md` and the canonical JSON contract. Return one state:

- `observation`: evidence exists but generalization is not claimed;
- `proposed`: frozen candidate awaiting evaluation;
- `shadow`: narrow, expiring, and not authoritative;
- `active`: every machine promotion gate passed and parent approval exists;
- `rejected`: a falsifier, regression, leak, or scope violation occurred;
- `archived`: stale agent-created candidate retained for audit.

Report counts such as `4/4 folds` and `3/3 negative controls`; do not invent statistical confidence from a small sample.
