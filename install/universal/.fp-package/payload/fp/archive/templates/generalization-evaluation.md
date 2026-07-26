# Generalization Evaluation

Use this after adaptive improvement proposes a reusable checklist, schema, skill patch, or automation. The canonical machine record is the Evidence Ledger `learning_evidence` object; this view helps plan the blind evaluation.

```md
Candidate ID, content hash, and freeze time:
Kind and target:
Trigger invariant:
Non-trigger boundary:
Candidate delegation:
Independent evaluator delegation(s):

Independent cases:
- recomputable source-ledger snapshot hash / observed time / task ID / session ID / family / fingerprint / kind / bound evidence

Folds:
- training case IDs
- hidden holdout case IDs
- hidden context ref and blinding check
- baseline evidence / score / metric / unit
- candidate evidence / score / same metric and unit
- independent oracle evidence
- direction / tolerance / derived comparison: improved | non_inferior | regressed

Negative controls:
- case ID / expected abstention or preserved behavior / evidence

Zero-tolerance invariants:
- case ID / boundary / evidence

Complexity:
- baseline units / candidate units / allowed delta

Shadow:
- narrow scope / expiry / required future observations
- each observation: task / session / fingerprint / bound evidence / result

Approval and rollback:
- authority source / approval state / rollback reference / rollback check
- applied target hash check / activation evidence

Verdict:
- pending | pass | fail
- observation | proposed | shadow | active | rejected | archived
```

Case IDs, source-ledger hashes, fingerprints, and task/session IDs must show that training, holdout, negative controls, and future shadow observations are independent. Every passing case, fold variant, oracle, shadow observation, rollback, and activation points to a distinct observed command bound to the frozen hash, producer, stage, subject, and variant. A candidate cannot become `active` by prose verdict or unrelated passing command.
