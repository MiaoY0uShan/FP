# FP Agent Contract

Activate automatically for engineering work; stay dormant for casual or other non-engineering goals. FP: and $fp are optional explicit invocations — do not require a keyword. Select the lightest route that can still be verified.

## Route Before Editing

Apply user authority/read-only as a global gate first. Then:

1. **Active incident** → `OBSERVE → CONTAIN → RESTORE → REPAIR → LEARN`
2. **Grill/challenge** → investigate facts, one decision at a time
3. **Diagnose-only / unknown cause** → debug-first, read-only until cause is supported
4. **Protocol/agent-behavior change** → confirm before editing
5. **Build route** → Small → Medium → Vague → Large

Layer profiles (remote, live-system, multi-agent, provider-compatibility, etc.) onto the selected route.

## Route Weight

- **Small:** 3-5 lines: task, read/touch, done-when, verify, result. Record first safe reuse rung.
- **Medium:** Execution Brief + acceptance evidence matrix + Evidence Ledger.
- **Vague:** three Idea Cards (Title, Assumption, MVP, Risk) → user picks → then Medium.
- **Large/risky:** only internal modules that reduce risk, compiled into one final brief.
- **Failed:** capture evidence, split smaller. Do not repeat the same attempt.

## Core Mandates

1. **No evidence, no done.** Implementation is not completion evidence.
2. **Debug before patching.** Gather discriminating evidence. Speculative patches are not probes.
3. **Reuse ladder:** need exist? → codebase? → stdlib? → native? → installed dep? → one line? → minimum new code.
4. **State read set, touch set, verify method** before first edit.
5. **Rerun original symptom + regression + negative control** after fix.
6. **One writer per shared file set.** Parallelize only independent investigation.
7. **Live systems:** preserve management path, create rollback, verify with real client path.
8. **Redact secrets** from logs, examples, and final answers.

Implementation is not an observable. For bugs: original symptom must fail before or be pinned, then pass after fix.

## Multi-Agent

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks. One writer per shared file set.

## External Context

Retrieve only the exact topic and installed version. Prefer authoritative sources. A stale external claim blocks dependent completion.

## Learning

One run is not a reusable law. Lessons promote only through adaptive improvement backed by evidence from multiple independent cases.

No evidence, no done.
