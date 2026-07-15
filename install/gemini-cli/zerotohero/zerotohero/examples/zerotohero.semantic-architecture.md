# Semantic Architecture Report

## Clarified Goal

Add a lightweight semantic architecture step to ZeroToHero so an agent can sketch module boundaries, choose an MVP slice, and identify coupling risks before planning multi-module work.

## MVP Slice

Add one optional skill and one template:

- `semantic-architecture/SKILL.md`
- `templates/semantic-architecture-report.md`

Update README, AGENTS.md, and examples so users know when to use it.

Do not build a graph database, automatic indexer, diagram renderer, CLI, npm package, or runtime.

## Modules

- name: `question-requirements`
  purpose: reveal real goal, failure paths, assumptions, and success criteria
  owns: requirement challenge and decision gate
  should not own: architecture planning or implementation path
  status: MVP

- name: `semantic-architecture`
  purpose: turn clarified requirements into a lightweight module map, MVP slice, and decoupling rules
  owns: module relationships, coupling risks, MVP-first build order
  should not own: graph runtime, repository indexer, or automatic diagrams
  status: MVP

- name: `delete-scope`
  purpose: remove unnecessary work after the module map is clear
  owns: non-goals, deferred scope, files to avoid
  should not own: requirement root-cause analysis
  status: MVP

- name: `optimize-path`
  purpose: create the smallest verified implementation path
  owns: execution brief, context budget, checks, evidence required
  should not own: architecture discovery
  status: MVP

- name: `semantic-memory`
  purpose: select relevant context slices and files to avoid
  owns: context selection
  should not own: architecture decisions or graph database behavior
  status: later

- name: `learn-after-run`
  purpose: extract reusable learning after evidence exists
  owns: learning note and promotion recommendation
  should not own: automatic skill mutation
  status: later

## Module Relationships

- `question-requirements` -> `semantic-architecture`: provides clarified goal, non-goals, failure paths, and success criteria.
- `semantic-architecture` -> `delete-scope`: provides module map, coupling risks, and deferred modules.
- `delete-scope` -> `optimize-path`: provides minimum scope and boundaries.
- `optimize-path` -> `execution-brief`: creates the plan the agent follows.
- `execution-result` -> `evidence-ledger`: records what changed and what was verified.
- `evidence-ledger` -> `learn-after-run`: provides facts for learning.
- `semantic-architecture` should not depend on `semantic-memory`: architecture sketching must remain usable without a memory system.

## Lightweight Diagram

```text
[question-requirements]
  -> [semantic-architecture]
  -> [delete-scope]
  -> [optimize-path]
  -> [execution-brief]

[execution-result]
  -> [evidence-ledger]
  -> [learn-after-run]

[semantic-memory]
  -> optional context slice for any step
```

## Coupling Risks

- `semantic-architecture` could become a required step for every task, making ZeroToHero heavy.
- `semantic-memory` could become a hidden dependency if architecture reports require a repository index.
- `learn-after-run` could overreach if it starts editing skills automatically.
- Architecture diagrams could become decorative instead of reducing scope.

## Decoupling Rules

- `semantic-architecture` is optional and only used for projects, systems, features, refactors, workflows, or multi-module tasks.
- `semantic-architecture` produces a planning artifact, not a runtime dependency.
- `semantic-memory` may inform the architecture report, but is not required.
- `learn-after-run` may propose changes, but must not modify skills automatically.
- `optimize-path` consumes architecture boundaries; it should not rewrite the architecture.

## MVP-first Build Order

1. Add `semantic-architecture/SKILL.md`.
2. Add `templates/semantic-architecture-report.md`.
3. Add this example.
4. Update README and AGENTS.md to show the optional flow.
5. Update validation to require the new skill and template.

## Deferred Modules

- Automatic architecture diagram generation.
- Graphify-style graph database.
- Repository-wide semantic indexing.
- CLI or npm workflow.
- Forced architecture step for small tasks.
- Visual UI.

## Decision

Decision: `mvp_ready`

Reason: the feature can be added as one optional skill and one template without changing ZeroToHero's portable bundle model.

## Recommended Next Skill

`delete-scope`
