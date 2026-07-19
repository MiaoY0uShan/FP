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
10. If the schema relates to other schema or lesson cards, populate the `related-schemas` YAML frontmatter with typed edges before finalizing. Use `templates/memory-graph-traversal.md` to check blast-radius effects.
11. Populate the `task-types` YAML frontmatter with 3-5 keywords that describe the class of work. These keywords enable cluster retrieval via `memory-graph.js`. Use compact, grep-friendly terms: prefer `["bug", "validation", "auth"]` over `["validation logic for authentication tokens"]`.
12. If this is a Map of Content (MOC), set `is_moc: true`, leave `task-types` empty, and use `informs` edges to list sub-cards. Create a MOC when 3 or more existing cards share a theme.
13. For Folgezettel sequences, use `next` and `previous` edges to capture the narrative order of your thinking. These are NOT semantic edges — they capture trajectory, not argument structure.
14. Follow the Zettelkasten conventions in `templates/zettelkasten-conventions.md`: atomicity (one pattern per card), bidirectional links, MOC at N≥3, refinement pipeline, serendipity traversal, and card size constraints.

## Graph-Aware Retrieval

When the task context justifies it (multi-module, risk of missed dependencies, or update to an existing schema), use the memory graph traversal protocol (`templates/memory-graph-traversal.md`) to expand retrieval beyond the directly-matched schema.

Build the graph snapshot before querying:
```bash
node fp/contracts/memory-graph.js build
```

### When loading one schema, check its edges

After finding a relevant schema card for the task:

1. Read the card's `related-schemas` YAML frontmatter.
2. Check `depends_on` cards first — these are foundational and may contain prerequisites or constraints that the directly-matched card assumes.
3. Check `informs` cards next — these may provide complementary context.
4. Do NOT automatically load `conflicts_with` or `supersedes` cards unless the task involves reconciling conflicting recommendations.

Bound: at most 3 additional cards loaded this way. If the directly-matched card has no `related-schemas`, skip this step.

### When updating a card, compute blast radius

Before finalizing an update to a schema card:

1. Run the Blast-Radius Protocol (section 1 of `memory-graph-traversal.md`).
2. List every card that links to the updated card (reverse fan-out).
3. For each, decide whether the change requires a re-read of the dependent card's `## Trigger`, `## Problem Pattern`, and `## Evidence Required` sections.
4. Record the blast-radius check in the evidence ledger under the update's acceptance evidence.

If the blast-radius set contains a hub card (in_degree >= 3 per `node fp/contracts/memory-graph.js hubs`), pause and confirm the update is safe before proceeding.

### When a task type matches a cluster

If the task has well-defined keywords (e.g., "validation" + "bug" + "auth"), run the Cluster Retrieval Protocol (section 2 of `memory-graph-traversal.md`):
```bash
node fp/contracts/memory-graph.js cluster validation bug auth
```

This replaces ad-hoc "search for relevant schemas" with a structured sweep that also catches schemas linked by edges but not by keyword match alone.

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

## Refinement Pipeline

FP follows the Zettelkasten refinement pipeline. Load `templates/zettelkasten-conventions.md` for the full model.

| Stage | Zettelkasten | FP Artifact | Location |
|---|---|---|---|
| 1. Capture | Fleeting note | Raw observation from a task | `evidence-ledger` `unverified_claims` |
| 2. Observe | Literature note | Anti-pattern with evidence | `lessons-learned/` card, `status: observation` |
| 3. Generalize | Permanent note | Evidence-backed schema | `schema-memory/` card, `status: promoted` / `active` |

**When creating a schema card from evidence:**

1. Verify the observation appears in at least two independent evidence ledgers.
2. Run `node fp/contracts/memory-graph.js cluster <keywords>` to check no existing card covers this pattern.
3. If an existing card partially overlaps, use `informs` or `generalizes` to connect — don't duplicate.
4. Link the new card back to its source lesson cards and evidence ledgers via `[[wikilink]]`.
5. Only `generalization-gate` can promote to `active` — schema creation alone stays at `proposed`.

## MOC Creation Guide

A Map of Content (MOC) is an index card that groups related cards under a theme. Load `templates/zettelkasten-conventions.md` for the full convention.

**Create a MOC when:**
- 3 or more schema or lesson cards share a recognizable theme.
- `memory-graph.js stats` shows a growing community without a hub node.
- `memory-graph.js cluster <keywords>` returns 3+ cards.

**How to create a MOC:**
1. Create a new schema card.
2. Set `is_moc: true` and `task-types: []`.
3. Set `## Schema Name` to the theme (e.g., "Remote System Patterns").
4. List sub-cards via `informs` edges. Do NOT use `depends_on` from sub-cards back to the MOC.
5. The `## Trigger` section should describe when any of the sub-cards might apply.
6. The `## Problem Pattern` section should list the sub-cards with brief descriptions.

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
- proxy TVP trend, if available;
- graph in-degree / out-degree trend for this schema type.

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

### Graph-enriched handoff

When the graph traversal protocol was used for this task, the Context Diet Map must include:

- **Relevant schema cards:** the directly-matched card plus any cluster cards loaded through `depends_on` or `informs` edges.
- **Exclusion reason for pruned cluster cards:** e.g., "trigger mismatch — this schema applies to API endpoints, not CLI scripts."
- **Blast-radius note (if updating):** list of dependent cards checked and their re-evaluation status.

All graph-traversal decisions are bounded: the agent records which protocol section was used, the seed card(s), the depth limit, and the cards loaded or excluded.
