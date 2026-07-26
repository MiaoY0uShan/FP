# Semantic Architecture Report

## Clarified Goal

<!-- Use the real goal from question-requirements if available. -->

## MVP Slice

<!-- The smallest useful version that proves the goal. -->

## Modules

<!-- Keep this list short. Include only modules relevant to the MVP or immediate architecture decision. -->

- name:
  purpose:
  owns:
  should not own:
  status: MVP | later | avoid

## Module Relationships

<!-- Use directional relationships. -->

- A -> B: reason
- A should not depend on B: reason

## Lightweight Diagram

```text
[Module A]
  -> [Module B]
  -> [Module C]
```

## Coupling Risks

- ...

## Decoupling Rules

- ...

## MVP-first Build Order

1. ...
2. ...
3. ...

## Deferred Modules

- ...

## Decision

Choose one:

- `mvp_ready`
- `reduce_scope`
- `needs_context`
- `ask_user`
- `stop`

Decision:

Reason:

## Recommended Next Skill

Usually one of:

- `delete-scope`
- `optimize-path`
- `shorten-iteration`

For `needs_context`, use `none` and record the smallest bounded read-only discovery step. Inspect only the relevant local files or state; for a current, versioned, or external fact, load `templates/context-retrieval-contract.md`. Use `Decision: ask_user` and `none` only for a blocking user-owned decision. Do not use `schema-memory` for task-local context retrieval.
