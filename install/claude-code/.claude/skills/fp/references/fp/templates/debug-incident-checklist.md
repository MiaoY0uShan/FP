# Debug-First And Incident Checklist

Use debug-first for unknown-cause failures. Use incident mode only for an ongoing outage, security event, data-loss risk, or unstable management path.

## Debug-First

### Symptom Contract

- Exact symptom and user-visible impact:
- Smallest reliable reproduction:
- Expected result:
- Actual result:
- First known bad / last known good, if known:
- Scope and permissions: diagnose-only | diagnose-and-fix

### Observability Map

| Layer | Desired State | Effective State | Probe | Evidence |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

### Causal Boundary Trace

- Causal boundary chain (producer -> transforms -> consumer -> visible failure):
- First divergence between expected and observed state:
- Earliest source or owner that can explain the divergence:
- Direct callers/consumers of the shared boundary being changed:

Trace backward to the first evidenced divergence; do not patch only the deepest error site. When a fix changes a shared function, interface, or state transition, rerun the direct failing path and at least one sibling regression through the same boundary.

### Experiment Ledger

Keep at most two active hypotheses. Run one cheap, discriminating probe at a time.

| # | Falsifiable Hypothesis | Probe / Command | Actual Result | Decision | Next Step |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | supported / rejected / unknown | ... |

Speculative patches are never probes. After three consecutive rejected/unknown probes without a narrowed cause, stop and record an architecture/observability checkpoint. Recheck ownership, hidden state, stale runtime, environmental assumptions, and missing observability before forming a fourth hypothesis. A third probe that narrows the cause does not trigger a mechanical reset.

For asynchronous behavior, record the condition predicate, polling interval, deadline, and final observed state on timeout. Prefer condition-based waiting; use a fixed sleep only when elapsed time itself is the behavior under test and record that reason.

For a completed debug Evidence Ledger, compile these fields into `debug_evidence.causal_chain`, `debug_evidence.first_divergence`, and `debug_evidence.wait_evidence`. If a shared boundary applies, `shared_boundary_evidence.direct_evidence_ref` and `sibling_evidence_ref` must be different pointers to observed passing command records. If waiting or a shared boundary does not apply, record `applies=false` with the concrete reason.

### Fix Gate

- Root cause or bounded cause supported by:
- User authorized implementation:
- Smallest writable layer:
- Rollback:
- Acceptance matrix ready:

### Final Reproduction

- Original reproduction:
- Focused regression:
- Sibling regression through a touched shared boundary, when applicable:
- Negative control:
- Residual uncertainty:

## Active Incident

```text
OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN
```

| Stage | Goal | Required Evidence | Exit Condition |
|---|---|---|---|
| OBSERVE | Pin impact and preserve evidence | timestamps, symptoms, baseline, management path | impact and evidence source known |
| CONTAIN | Limit further harm | authorized reversible action and rollback | blast radius stable |
| RESTORE | Recover essential service | real functional probe | essential path works |
| REPAIR | Remove supported root cause | focused change plus regression evidence | original symptom and controls pass |
| LEARN | Record reusable evidence | Evidence Ledger and staged observation | no active operational work remains |

Use separate briefs for RESTORE and REPAIR. Before restoration, avoid long-term refactors. Every incident write records time, purpose, expected result, rollback, and observed result. Containment never expands authorization.

## Stop Conditions

- A probe would mutate important state without authorization.
- The management path or evidence source becomes unstable.
- Three consecutive rejected/unknown probes did not narrow the cause and the checkpoint is not complete.
- The required next probe needs broader authority or unavailable external coordination.
