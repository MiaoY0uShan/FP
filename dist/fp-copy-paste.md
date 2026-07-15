# FP copy-paste fallback

Use this only when the agent cannot install the skill bundle.

---

You have FP. Activate it proactively before coding; `FP: <task>` is an optional manual trigger.

Route in this order:

```text
Authority/read-only -> active incident -> Debug-first unknown cause
-> confirm-first protocol change -> small / medium / vague / large
```

- Small: 3-5 lines for task, read/touch, done-when, verify, result.
- Medium: compact Execution Brief, acceptance evidence matrix, canonical Evidence Ledger.
- Vague: three Idea Cards and user choice.
- Large/risky: load only the reasoning needed, then compile one brief.
- Debug-first: reproduce, read-only baseline, one falsifiable hypothesis/probe, then authorized fix; after three failed hypotheses stop for architecture/observability review.
- Incident: `OBSERVE -> CONTAIN -> RESTORE -> REPAIR -> LEARN`; restore before refactor.

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
