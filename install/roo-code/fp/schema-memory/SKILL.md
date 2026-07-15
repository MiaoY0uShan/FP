---
name: fp-schema-memory
description: "Use only when routed by FP after repeated evidence has accumulated; store reusable patterns and stop conditions, never raw context."
---

# FP: Schema Memory

Remember patterns, not everything.

Schema memory replaces semantic memory. It does not store large context, repository summaries, or raw conversation history. It stores reusable work patterns discovered from evidence.

Use schema memory to answer:

- What kind of task is this?
- How does this kind of task usually fail?
- What context is usually useful?
- What context is usually waste?
- What verification pattern works?
- What stop condition prevents drift?

## Use when

- An evidence ledger and adaptive improvement report reveal a reusable pattern.
- The same class of work has appeared more than once.
- A task type has predictable failure modes.
- A context budget pattern can reduce future context use.
- A verification pattern can prevent repeated mistakes.
- A workflow is becoming stable enough to standardize.

## Do not use when

- There is no evidence ledger.
- The insight is a one-off preference.
- The pattern is speculative.
- The pattern would increase context without reducing risk.
- The agent wants to store raw memory instead of a reusable schema.

## Goal

Produce or update a schema memory card.

A schema memory card captures a reusable pattern for a class of work:

- trigger
- problem pattern
- common failure modes
- recommended execution pattern
- context budget pattern
- verification pattern
- files or modules usually involved
- files or modules usually avoided
- evidence required
- promotion history

## Procedure

1. Read the evidence ledger and adaptive improvement report if available.
2. Identify the class of work.
3. Extract the repeatable pattern, not the incidental details.
4. Identify common failure modes.
5. Identify the smallest useful context pattern.
6. Identify the verification pattern that proved the work.
7. Identify stop conditions that would prevent drift.
8. Decide whether to create, update, or reject the schema.
9. Keep the schema short enough to be reused in a future execution brief.

## Schema promotion rules

Do not create or update schema memory from a subjective benefit claim or a single run. First pass `generalization-gate/SKILL.md`.

Promotion requires all of the following:

- at least two distinct task IDs and two distinct session IDs;
- for two to four positive cases, leave-one-case-out with every case held out once;
- every fold is non-inferior to baseline and at least one fold measurably improves;
- at least one near-neighbor negative control and every applicable zero-tolerance invariant pass;
- candidate author, independent evaluator, and parent approver remain separate;
- a bounded trigger and non-trigger boundary, current provenance, complexity budget, passing shadow window, and tested rollback.

Paraphrases, noise variants, or sibling agents from the same run do not satisfy independence. A single severe incident may create a narrow expiring shadow checklist, not schema memory. Do not create a schema just because a task succeeded.

## Output contract

Return this structure:

```md
# Schema Memory Card

## Schema Name

## Trigger

## Problem Pattern

## Common Failure Modes

## Recommended Execution Pattern

## Context Budget Pattern

## TDD / Verification Pattern

## Files Or Modules Usually Involved

## Files Or Modules Usually Avoided

## Evidence Required

## Stop Conditions

## Promotion History

## Last Updated Because
```

## Rules

- Store patterns, not raw context.
- Prefer short reusable rules over long explanations.
- Do not summarize the whole repository.
- Do not add context just because it might be useful later.
- Do not turn one run into a permanent rule.
- Do not average away a failing holdout, negative control, or invariant.
- Archive stale agent-created cards; never auto-delete them or curate user-owned rules.
- Schema memory should make future runs smaller, not bigger.

## Failure mode

If the pattern is not reusable, return:

```md
# Schema Memory Decision

Decision: reject

Reason:
This appears to be a one-off lesson and should remain in the evidence ledger or adaptive improvement report.
```


## Metrics pattern

When a schema is updated from repeated runs, record any stable metric pattern:

- typical files read;
- typical files touched;
- typical scope creep risks;
- typical verification checks;
- typical rework causes;
- proxy TVP trend, if available.

Do not update schema metrics from one weak or unverifiable run.


## Context Diet Map handoff

Schema memory should help reduce future context load.

When a schema is relevant, provide:

- likely files to read;
- likely files to avoid;
- relevant schema cards;
- common irrelevant context;
- reason for exclusion.

This should feed the Context Diet Map in the next Compiled Execution Brief.
