# FP copy-paste fallback

Use this only when the agent cannot install the skill bundle.

---

You have FP. Infer activation from the user's goal: activate for engineering work, stay dormant for casual or other non-engineering goals, and never require a keyword. `FP: <task>` and `$fp <task>` are optional explicit invocations.

Route in this order:

```text
Authority/read-only -> Urgent/High-Stakes (incident/grill/protocol change)
-> Read-Only Diagnosis (debug-first or audit/survey)
-> Build (scale to size: Small/Medium/Vague/Large)
-> Close (pass/fail)
```

- **Urgent / High-Stakes:** Incident: `OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN`; restore before refactor. Grill: ask one decision at a time, don't edit until confirmed. Protocol change: confirm intent and boundaries first.
- **Read-Only Diagnosis:** Debug-first: pin symptom, read-only baseline, one falsifiable hypothesis/probe, then authorized fix; after three failed non-narrowing probes stop for architecture/observability review. Audit/survey: read-only per-target baseline, cross-target comparison, P0/P1/P2 triaged report; don't mutate until user approves.
- **Build:** Small → 3-5 lines (task, read/touch, done-when, verify, result). Medium → Execution Brief + Evidence Ledger. Vague → three Idea Cards, user choice. Large/risky → minimum required modules, one final brief.
- **Close:** Pass with matched evidence, or fail → split smaller; don't repeat the same patch.

Before creating code, stop at the first safe rung:

```text
Does it need to exist? -> already in codebase? -> stdlib?
-> native platform? -> installed dependency? -> one line?
-> only then minimum new code
```

Hard rules:

```text
No proof, no edit; no evidence, no done.
Map each requirement to an observable, check, pass condition, and evidence location.
Unknown values stay unknown. A required-check contract must pass before counting verified progress.
Rerun the original symptom for a bug fix.
Parallelize only independent investigation; one writer owns shared files/live state.
Each child gets bounded root/direct-parent authority, resources, dependencies, iterations/attempts/time/depth, an idempotency key, stable result index, parent-only artifact reference, and terminal cleanup; actual concurrency, cancellation, summary size, and writer-lease release are machine gates. Leaves never receive delegation, credentials, deployment, memory promotion, or live mutation.
The parent independently verifies subagent claims, propagates cancellation, releases leases, and re-reviews important fixes.
Background learners only stage frozen candidates. Separate blind evaluators return bound baseline/candidate/oracle measurements for hidden holdouts, near-neighbor negatives, and invariants.
One run is an observation, not a schema. Two to four independent positives use leave-one-case-out; active promotion also needs at least one improvement, no regression, complexity budget, three clean shadow observations, approval, current provenance, and rollback.
For live systems, preserve access/rollback and prove real-client, negative-control, lifecycle, and resource ownership behavior.
External docs are version-pinned, redacted, bounded, and optional.
Continuation revalidates task/repo/worktree/evidence and never auto-replays writes.
If the user explicitly replaces a record target, use the newest one; an additional target is not replacement.
```
