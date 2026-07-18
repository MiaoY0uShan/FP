# FP Router

FP activates implicitly when the user's goal is engineering work and stays dormant for casual or other non-engineering goals. `FP: <task or idea>` and `$fp <task or idea>` are optional explicit invocations, never requirements.

## Priority

```text
user authority/read-only constraints
-> Urgent / High-Stakes (incident, grill, protocol change)
-> Read-Only Diagnosis (debug-first or audit/survey)
-> Build (scale to size: Small / Medium / Vague / Large)
-> Close (pass/fail)
```

Profiles—remote/stateful, OpenWrt, external context/MCP, provider compatibility, multi-agent, delegated execution, continuation, stateful UI, self-iteration, and background learning—layer onto a route without forcing the full chain.

## Routes

- **Urgent / High-Stakes:** Incident: `OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN`; restoration and permanent repair use separate briefs. Grill: investigate facts, one decision at a time. Protocol: confirm intent unless already approved.
- **Read-Only Diagnosis:** Debug-first: pin symptom, read-only baseline, at most two active hypotheses, one discriminating probe, then authorized fix; three non-narrowing probes force an architecture/observability checkpoint. Audit/survey: read-only per-target baseline, cross-target comparison, P0/P1/P2 triaged report; do not mutate until user approves.
- **Build:** Scale the output: Small → Tiny Brief, Medium → Execution Brief + Evidence Ledger, Vague → three Idea Cards, Large/risky → minimum required modules → one final brief.
- **Close:** Pass with matched evidence, emit one verdict, and stop; fail → split smaller. Extra diagnosis after a supported cause must change a named decision or fill an acceptance row. A user stop cancels pending work without another probe.

Before creating anything, stop at the first safe rung:

```text
need -> existing code -> standard library -> native feature
-> installed dependency -> one line -> minimum new implementation
```

Multi-device work applies the one-writer rule per target, not globally. Cross-target dependencies must be mapped before writes. End with a cross-target smoke test from the consumer side.

After multiple fixes, run batch regression: re-check every originally-failed item, run at least one negative control, and produce a `repair-verdict` block.

Evidence reuse is state-bound: relevant mutations and declared safety checks still require fresh proof. After a timeout following a possible remote mutation, read back effective state once and classify `applied | not_applied | split | unknown` before any retry.

Metrics and learning are optional and evidence-gated. Background learning stages read-only proposals; `generalization-gate` separates author from evaluator and blocks single-case schema/automation promotion. Unknown stays unknown; no baseline means no improvement claim.

Delegated execution activates only for a frozen executable plan and an observed host-native subagent runtime. It creates fresh implementer/reviewer/fixer/re-review/final-review threads within active and cumulative limits. Independent-domain fan-out requires disjoint mutable resources; otherwise task chains stay serial.

Provider compatibility activates for third-party model endpoints, gateways, local proxies, or suspected loops/spend/cache/encoding faults. It resolves the effective chain, checks local proxy health, multiplies nested retry limits, freezes request/token/subagent budgets, and fails closed on semantic loops or incomplete stream/tool evidence. A paid diagnostic request needs explicit authority.

An available task-required MCP is called automatically within current authority. A missing MCP requires an explicit acquisition brief and user approval before download/install; installation does not grant credentials, broader mutations, or resident-process permission.
