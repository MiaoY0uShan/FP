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
- `stop`

Decision:

Reason:

## Recommended Next Skill

Usually one of:

- `delete-scope`
- `optimize-path`
- `shorten-iteration`
- `semantic-memory`
