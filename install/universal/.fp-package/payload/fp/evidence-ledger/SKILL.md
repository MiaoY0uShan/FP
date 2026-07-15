---
name: fp-evidence-ledger
description: "Use only when routed by FP after execution, failure, or handoff to record canonical claims, checks, scope, authority, experiments, and optional continuation evidence."
---

# FP: Evidence Ledger

Every completion claim needs evidence. The canonical machine record is JSON v1 validated by `contracts/evidence-ledger.v1.schema.json`; Markdown is only a human view.

## Use When

- A medium, debug, live-system, multi-agent, or risky task executed.
- A task failed, blocked, exceeded scope, or needs a durable handoff.
- Metrics or adaptive improvement will consume the result.

Small clear changes may use the Tiny Evidence form instead.

## Procedure

1. Record task ID, authority mode, write authorization, and scope.
2. List files read and touched using normalized repository-relative paths when possible.
3. Record each command/check with exact result and evidence; do not equate “ran” with “passed.”
4. For debug work, record hypothesis, probe, actual result, decision, and next step. Before completion, add `debug_evidence` with the causal chain, first divergence, condition-based wait evidence or a justified fixed wait, and distinct direct/sibling observed checks for any touched shared boundary.
5. Tie every verified claim to evidence and list every remaining unverified claim.
6. Record scope and context-budget violations explicitly.
7. Record remaining risk, decision, and next action.
8. For remote/stateful work, record baseline, rollback, effective runtime, external-client and negative-control evidence.
9. For externally retrieved context, record source, version, structured freshness basis, authoritative page, claim, and unresolved gap.
10. For incomplete cross-session work, compile a continuation block; never use it to auto-replay writes.
11. When a deliberate shortcut is accepted because it has a known safe limit, add `deferred_items` with its location, shortcut, ceiling, observable upgrade trigger, evidence, and an `evidence_ref` that resolves to observed command or verified-claim evidence. Do not create debt entries for vague future work or use them to excuse a current acceptance failure.
12. For multi-agent work, record the parent authority ceiling and every delegation envelope, including allowed resources, read-only status, summary budget, artifact path, and observed proposal evidence references.

## Completion Gate

- `result=pass` needs at least one passing check and one evidenced claim.
- `decision=complete` needs `result=pass`.
- Required checks come from the Execution Brief and must all pass.
- Report-only work cannot touch files or claim write authority.
- Unknown values stay `unknown`/`null`.
- A stale live-system observation is historical evidence, not current state.

## Output

Use `templates/evidence-ledger.md`. Run:

```text
node scripts/lint-contracts.js --ledger <ledger.json> --brief <brief.json>
```

If the run needs metrics, pass the canonical JSON and its brief to `metrics`. Use adaptive improvement only when the ledger contains evidence for a reusable change.
