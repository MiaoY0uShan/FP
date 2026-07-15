---
name: fp-delete-scope
description: "Use only when routed by FP after requirements work to apply the seven-rung reuse ladder, delete scope, and define the smallest verifiable MVP."
---

# FP: Delete Scope

Delete before architecture.

This skill takes the real goal from `question-requirements` and reduces it to the smallest verifiable MVP.

It uses:

- first-principles reasoning
- Occam's Razor
- MVP-first scope cutting
- early decoupling boundaries

Do not design the full system while using this skill.
Do not write code while using this skill.

---

## When to use

Use this skill after `question-requirements` when:

- the real goal has been identified,
- the task has more than one possible implementation,
- the request contains nice-to-have work,
- the agent may add premature abstractions,
- the task may sprawl across modules,
- the user wants an MVP,
- the architecture should stay decoupled.

For tiny edits, do not run the full process.

---

## Core principles

### 1. First principles

Keep only what is necessary to satisfy the real goal.

Ask:

```text
What must be true for the user outcome to be achieved?
What capability is irreducible?
What evidence proves that the outcome exists?
What is merely an implementation assumption?
```

### 2. Occam's Razor

Do not add entities without necessity.

An entity can be a feature, command, file, module, abstraction, adapter, workflow, automation, runtime, state file, database, agent role, example, test surface, or documentation page.

If the MVP still works without it, delete or defer it.

### 3. MVP before architecture

Do not design the full system before the minimum useful version is defined.

Architecture should be based on the MVP, not on imagined future scale.

---

## Required input

Use the output from `question-requirements` if available:

- likely real goal
- success criteria
- failure paths
- assumptions
- non-goals
- decision

If the real goal is still unclear, stop and return:

```text
Decision: ask_user
Reason: delete-scope requires a clarified real goal.
Smallest useful question: ...
```

---

## Procedure

### 1. Restate the real goal

Use the clarified goal from `question-requirements`.

Output:

```text
Real goal:
...
```

### 2. Derive the first-principles core

Identify the irreducible center of the task.

Output:

```text
First-principles core:
- Required user outcome:
- Irreducible capability:
- Required evidence:
- Hard constraints:
```

The required evidence should be observable.

### 3. Inventory candidate entities

List candidate entities that the agent might be tempted to create, modify, or depend on.

Output:

```text
Entity inventory:
- Entity:
  Type:
  Needed for MVP: yes/no/unclear
  Reason:
```

Ask for each entity:

```text
Does this directly serve the real goal?
Does the MVP fail without it?
Is it only for future scale?
Does it increase coupling?
Does it increase installation burden?
Does it increase context load?
Does it make verification harder?
```

Before keeping any new entity, run the reuse ladder and stop at the first rung that holds:

```text
1. Does this need to exist?   -> no: skip it (YAGNI)
2. Already in this codebase?  -> reuse it; do not rewrite
3. Standard library does it?  -> use it
4. Native platform feature?   -> use it
5. Installed dependency?      -> use it
6. One line is sufficient?    -> use one clear line
7. Only then                  -> keep the minimum that works
```

Run the ladder after understanding the real flow, not instead of reading it. Trust-boundary validation, data-loss prevention, security, accessibility, rollback, and required evidence cannot be deleted as “complexity.” Record which rung resolved each kept capability.

### 4. Apply Occam filter

Separate entities into three groups.

Output:

```text
Keep:
- ...

Delete now:
- ...

Defer:
- ...
```

Rules:

- `Keep` only if the MVP fails without it.
- `Delete now` if it does not serve the real goal.
- `Defer` if it may be useful later but is not required now.

Be aggressive. The default for non-essential entities is `defer`, not `keep`.

### 5. Define MVP nucleus

The MVP nucleus is the smallest version that proves the real goal.

Output:

```text
MVP nucleus:
- One user outcome:
- One primary workflow:
- Minimum artifacts:
- Minimum verification:
- Explicit non-goals:
```

The MVP should be small enough to implement, inspect, and verify in one bounded iteration if possible.

### 6. Define scope boundary

Turn the cuts into hard boundaries.

Output:

```text
Scope boundary:
- In scope:
- Out of scope:
- Files or modules likely to touch:
- Files or modules to avoid:
- Stop condition:
```

The stop condition should prevent scope creep.

### 7. Define minimum evidence

State what proof is enough for the MVP.

Output:

```text
Minimum evidence:
- ...
```

The evidence should later feed the evidence ledger.

### 8. Prepare module candidates for decoupling

Do not design the architecture yet.

Only identify module candidates and boundaries that should feed `semantic-architecture`.

Output:

```text
MVP module candidates:
- Module:
  Responsibility:
  Should not own:
  Depends on:
  Should stay independent from:
```

Rules:

- A module should have one responsibility.
- A module should not own another module's decision.
- Avoid bidirectional dependencies.
- Avoid making optional modules required by the MVP.

### 9. Make a decision

Choose one:

```text
continue
reduce_scope
ask_user
stop
```

Recommend the next skill:

- `semantic-architecture` if the MVP still has multiple modules or coupling risk.
- `optimize-path` if the MVP is already small and single-slice.
- `shorten-iteration` if the MVP must be split into smaller tasks.
- `question-requirements` if the real goal is still unclear.

---

## Output format

Return:

```md
# Delete Scope Report

## Input From Question Requirements

## First-Principles Core

## Entity Inventory

## Reuse Ladder Decisions

## Occam Filter

### Keep

### Delete Now

### Defer

## MVP Nucleus

## Scope Boundary

## Minimum Evidence

## MVP Module Candidates

## Decoupling Notes

## Decision

## Recommended Next Skill
```

---

## Failure mode

If the scope cannot be cut safely, output:

```md
# Delete Scope Blocked

## Reason

## Blocking Unknown

## Risk

## Smallest Useful Question

## Recommended Next Skill
question-requirements
```

Ask only the smallest question needed to continue.

---

## Constraints

- Do not write code.
- Do not design the full architecture.
- Do not add entities without necessity.
- Do not create a helper, dependency, wrapper, or module before checking existing code, standard library, native features, and installed dependencies in that order.
- Do not preserve future-proofing by default.
- Do not turn optional modules into MVP requirements.
- Do not refactor unrelated modules.
- Do not continue if the MVP cannot be verified.
