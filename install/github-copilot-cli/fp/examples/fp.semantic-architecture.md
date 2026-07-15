# Semantic Architecture Report

## Clarified Goal

Add a lightweight semantic architecture step to FP so an agent can turn an already scoped MVP into module boundaries, identify coupling risks, and prepare the smallest implementation path.

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

- name: `delete-scope`
  purpose: reduce the clarified goal to the smallest verifiable MVP
  owns: MVP nucleus, non-goals, deferred scope, files to avoid
  should not own: module relationships or implementation path
  status: MVP

- name: `semantic-architecture`
  purpose: turn the scoped MVP into a lightweight module map and decoupling rules
  owns: module relationships, coupling risks, MVP-first build order
  should not own: graph runtime, repository indexer, or automatic diagrams
  status: MVP

- name: `optimize-path`
  purpose: create the smallest verified implementation path
  owns: execution brief, context budget, checks, evidence required
  should not own: architecture discovery
  status: MVP

- name: `adaptive-improvement`
  purpose: evaluate a reusable change only after an Evidence Ledger supports it
  owns: evidence-backed candidate and promotion recommendation
  should not own: automatic skill mutation
  status: later

## Module Relationships

- `question-requirements` -> `delete-scope`: provides clarified goal, non-goals, failure paths, and success criteria.
- `delete-scope` -> `semantic-architecture`: provides the MVP nucleus and scope boundaries.
- `semantic-architecture` -> `optimize-path`: provides module boundaries, coupling risks, and build order.
- `optimize-path` -> `execution-brief`: creates the plan the agent follows.
- `execution-result` -> `evidence-ledger`: records what changed and what was verified.
- `evidence-ledger` -> `adaptive-improvement`: provides facts for evaluating a reusable change.

## Lightweight Diagram

```text
[question-requirements]
  -> [delete-scope]
  -> [semantic-architecture]
  -> [optimize-path]
  -> [execution-brief]

[execution-result]
  -> [evidence-ledger]
  -> [adaptive-improvement, only with reusable evidence]
```

## Coupling Risks

- `semantic-architecture` could become a required step for every task, making FP heavy.
- Context discovery could expand into an unnecessary repository-wide index.
- `adaptive-improvement` could overreach if it runs without ledger evidence or starts editing skills automatically.
- Architecture diagrams could become decorative instead of reducing scope.

## Decoupling Rules

- `semantic-architecture` is optional and only used for projects, systems, features, refactors, workflows, or multi-module tasks.
- `semantic-architecture` produces a planning artifact, not a runtime dependency.
- Missing local context is discovered through the smallest bounded read-only inspection, not through a repository index.
- Current or versioned external facts use `templates/context-retrieval-contract.md`; user-owned decisions use `ask_user`.
- `adaptive-improvement` may evaluate a candidate only after an Evidence Ledger exists, and it must not modify skills automatically.
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

Reason: the feature can be added as one optional skill and one template without changing FP's portable bundle model.

## Recommended Next Skill

`optimize-path`
