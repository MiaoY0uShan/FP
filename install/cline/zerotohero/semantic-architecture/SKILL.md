---
name: zerotohero-semantic-architecture
description: "Use only when routed by ZeroToHero after delete-scope and only when the scoped MVP crosses modules or has real coupling risk."
---

# ZeroToHero: Semantic Architecture

Create a lightweight architecture sketch after MVP scope is deleted.

This skill turns a scoped MVP into a small module map so the agent can build the MVP first and avoid accidental coupling.

Do not write code while using this skill.

## Use when

Use this skill after `delete-scope` when:

- The task describes a project, system, new feature, refactor, workflow, or automation.
- The work may span multiple modules, files, skills, templates, or docs.
- The MVP nucleus is clear but module boundaries are not obvious.
- Scope could expand quickly.
- Coupling risk matters.
- The agent is tempted to plan implementation without first identifying module boundaries.

Do not use this skill for:

- typo fixes,
- small documentation edits,
- obvious one-file changes,
- narrowly scoped bug fixes with clear files and checks.

## Goal

Produce a concise semantic architecture report that defines:

1. the project goal,
2. the smallest MVP slice,
3. the main modules,
4. module relationships,
5. high-coupling risks,
6. decoupling rules,
7. MVP-first build order,
8. deferred modules,
9. the recommended next ZeroToHero step.

This skill is for planning and context reduction. It is not a graph database, automatic repository indexer, diagram engine, or runtime.

## Core principle

Architecture is useful only if it helps the agent do less.

The report should make the next task smaller, safer, and easier to verify.

## Inputs

Use available context from:

- the user request,
- `delete-scope` output,
- stated goal,
- likely real goal,
- success criteria,
- non-goals,
- failure paths,
- known project structure if provided.

If project structure is unknown, infer a minimal module map and label it as an assumption.

## Procedure

### 1. Restate the clarified goal

Use the MVP nucleus from `delete-scope` if available.

```text
Scoped MVP:
...
```

### 2. Define the MVP slice

Identify the smallest useful version that proves the goal.

Ask:

```text
If only 20% can be built now, what proves this is worth continuing?
```

Output:

```text
MVP slice:
...
```

The MVP slice must be smaller than the full idea.

### 3. Identify modules

List only the modules relevant to the MVP and immediate architecture decision.

For each module, include:

```text
- name:
  purpose:
  owns:
  should not own:
  status: MVP | later | avoid
```

A module may be a code area, skill, template, document, state artifact, or workflow step.

### 4. Map relationships

Describe relationships in plain text.

Use directional dependencies:

```text
A -> B: reason
```

Prefer simple relationships:

- produces
- consumes
- validates
- informs
- should not depend on
- optional input

Do not invent a complex graph schema.

### 5. Draw a lightweight diagram

Use ASCII or Mermaid-style text if helpful.

Keep it small enough to scan.

Example:

```text
[question-requirements]
  -> [delete-scope]
  -> [semantic-architecture]
  -> [optimize-path]
  -> [execution-brief]

[execution-result]
  -> [evidence-ledger]
  -> [learn-after-run]
```

### 6. Identify coupling risks

Ask:

```text
Where could this design become too tangled?
Which module might start owning too much?
Which optional module might become a hard dependency?
What future feature would pull this off the MVP path?
```

Output concrete coupling risks.

### 7. Define decoupling rules

Write rules that keep the MVP modular.

Good rules:

```text
- semantic-memory may inform context, but must not be required for every task.
- learn-after-run may propose skill patches, but must not modify skills automatically.
- semantic-architecture should guide planning, not become a required runtime.
```

Bad rules:

```text
- Keep it modular.
- Make it clean.
```

### 8. Define MVP-first build order

List the smallest sequence of work.

Each item should be verifiable.

```text
1. Add semantic-architecture skill.
2. Add semantic-architecture-report template.
3. Add one example using ZeroToHero itself.
4. Update README and AGENTS.md to make the skill optional.
```

### 9. Defer non-MVP work

List what should not be built now.

Typical deferrals:

- graph database,
- automatic diagram generation,
- repository-wide indexing,
- runtime dependency graph,
- visual UI,
- forced architecture step for small tasks.

### 10. Choose next skill

Usually choose:

- `delete-scope` if the MVP scope is still too large,
- `optimize-path` if the MVP is clear,
- `shorten-iteration` if the work is still too large,
- `semantic-memory` if the next task requires a narrow context slice.

## Output contract

Return:

```md
# Semantic Architecture Report

## Clarified Goal

## MVP Slice

## Modules

## Module Relationships

## Lightweight Diagram

## Coupling Risks

## Decoupling Rules

## MVP-first Build Order

## Deferred Modules

## Decision

## Recommended Next Skill
```

## Decision values

Choose one:

```text
mvp_ready
reduce_scope
needs_context
stop
```

Use:

- `mvp_ready` when the module map is clear enough for `optimize-path`.
- `reduce_scope` when too many modules are being pulled into the first version.
- `needs_context` when basic project structure is unknown and blocks the module map.
- `stop` when the architecture would violate the project's non-goals or make the workflow too heavy.

## Failure mode

If architecture cannot be sketched safely from available context, do not invent detail.

Return:

```text
Decision: needs_context
Missing context:
...
Smallest context needed:
...
Recommended Next Skill: semantic-memory
```

## Constraints

- Do not write code.
- Do not create a complex graph system.
- Do not require this skill for small tasks.
- Do not turn optional modules into hard dependencies.
- Do not expand the MVP.
- Do not replace `delete-scope`; this skill should consume its MVP nucleus.
- Do not produce architecture that cannot be verified by the next task.
