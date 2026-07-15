---
name: zerotohero-optimize-path
description: "Use only when routed by ZeroToHero after MVP scope is defined to choose the first safe reuse rung and compile the final Execution Brief."
---

# ZeroToHero: Optimize Path

Choose the smallest stable path that can produce verified progress.

Then compile the selected route into the final **Execution Brief**.

This skill does not write code. It does not expand the MVP. It converts upstream ZeroToHero reports into a short execution contract that a coding agent can follow.

---

## Primary output

The primary output of this skill is not a long plan.

The primary output is a compiled Execution Brief:

```text
question-requirements output
+ delete-scope output
+ semantic-architecture output
+ optimize-path selected route
+ shorten-iteration TDD loops, if needed
= compiled Execution Brief
```

The brief is the contract for execution.

---


## Contract compiler requirement

`optimize-path` must compile upstream ZeroToHero outputs into the final Compiled Execution Brief.

The final brief must include:

- Context Budget Contract;
- Context Diet Map;
- files to read, touch, and avoid;
- selected path;
- TDD micro-loops, when needed;
- Failure-to-Smaller-Task Protocol;
- Evidence Ledger handoff;
- Metrics to record.

If the required context limits or scope boundary are missing, create them before execution begins.

## Use when

Use this skill when:

- `question-requirements` has identified the real goal.
- `delete-scope` has defined the MVP nucleus and scope boundary.
- `semantic-architecture` has defined module boundaries for larger tasks, if needed.
- The agent is ready to choose a bounded coding path.
- The final deliverable should be an Execution Brief.

Do not use this skill to redesign the product goal or expand the MVP.

---

## Core principle

> Choose the smallest stable path that can produce verified progress.

A good path is:

- small enough to execute safely
- stable enough to avoid avoidable failure
- easy to verify
- reversible where possible
- free of unnecessary scope
- clear enough to compile into a brief

---

## Path filters

Use the reuse ladder, then these four filters before choosing an implementation path.

### 0. Reuse before creation

For every capability in a candidate path, record the first rung that holds:

```text
need -> existing code -> standard library -> native platform
-> installed dependency -> one line -> minimum new implementation
```

Reject a path that adds a dependency, wrapper, helper, module, or configuration layer while an earlier rung works. Earlier does not mean shorter at the expense of security, data integrity, accessibility, rollback, or verifiability.

### 1. Small-batch quick response

Do not bet on a large batch before feedback exists.

For ZeroToHero, this means:

- Start with the smallest verifiable slice.
- Prefer one behavior, one module boundary, or one bug reproduction at a time.
- Expand only after evidence exists.
- Do not implement the full future workflow in the first pass.

Ask:

```text
What is the smallest slice that can produce useful feedback?
What is the smallest change that can prove the path works?
What can be postponed until after this slice passes?
```

### 2. Agile working increment

Prefer a working increment over a comprehensive plan.

For ZeroToHero, this means:

- The selected path should produce something observable.
- Progress should be measured by working behavior or verified artifact, not explanation length.
- The path should allow early feedback.

Ask:

```text
What is the first working increment?
Can it be reviewed or tested independently?
What evidence will show that this increment is real?
```

### 3. Lean waste removal

Remove work that does not contribute to the selected verification target.

Waste includes:

- premature abstractions
- broad refactors
- speculative adapters
- unnecessary documentation changes
- extra tests not tied to the current risk
- reading files outside the context budget
- supporting future modes before the MVP needs them

Ask:

```text
Which steps do not create verified learning?
Which files or modules can be avoided?
Which abstractions are premature?
What can be deleted from this route?
```

### 4. Minimal just-in-case buffer

Use a small safety buffer, not a second hidden project.

Valid buffers:

- rollback plan
- stop condition
- fallback check
- manual verification note
- small compatibility guard

Invalid buffers:

- building an unused plugin system
- implementing a backup architecture
- adding future provider support
- creating a runtime because it might be needed later

Ask:

```text
What is the minimum safety buffer needed for this task?
What would be excessive just-in-case scope?
How can we make this reversible without overbuilding?
```

---

## Procedure

### 1. Read upstream reports

Use the latest available outputs from:

- Question Requirements Report
- Delete Scope Report
- Semantic Architecture Report, if the task is multi-module
- Shorten Iteration Report, if TDD micro-loops were already produced

If the MVP nucleus is missing, stop and ask to run `delete-scope` first.

### 2. Define candidate paths

Generate 2-4 candidate paths.

Each path should have:

- scope
- modules/files likely involved
- expected evidence
- risk
- reversibility
- waste risk
- context cost
- reuse rung and any justified new entity

Do not generate paths that violate explicit non-goals.

### 3. Evaluate candidate paths

Compare paths using:

- batch size
- stability
- verification clarity
- waste removed
- reversibility
- coupling risk
- context cost

Prefer paths that are smaller, more reversible, and easier to verify.

### 4. Select exactly one path

Choose one selected path.

If no path is safe, return `Decision: ask_user` or recommend `shorten-iteration`.

### 5. Define the small-batch slice

State the first slice to build.

It should include:

- one primary behavior or artifact
- files/modules likely involved
- what is explicitly excluded
- how feedback will be collected

### 6. Define verification strategy

Choose one:

- None
- Smoke
- Unit
- Integration
- E2E
- TDD required
- Manual review with evidence

Use TDD when the task involves:

- bug fixes
- core logic
- public APIs
- security-sensitive behavior
- data migration or validation

Do not force TDD for:

- documentation
- copy changes
- tiny config edits
- exploratory spikes
- simple UI text changes

### 7. Define context budget

Set explicit limits:

- max files to read
- max files to touch
- files to read first
- files to avoid
- forbidden context
- max notes or summary size

### 8. Define refactor boundary

Use:

- `none`: no refactor allowed
- `local`: only inside touched module
- `supporting`: allowed only to make the selected path testable
- `defer`: refactor should become a separate task

### 9. Decide whether `shorten-iteration` is needed

Use `shorten-iteration` if:

- the selected path includes more than one behavior
- the path touches multiple risk areas
- TDD is required and there are multiple cases
- the task has already failed once
- the path is still too large for one safe pass

If `shorten-iteration` is needed, ask for TDD micro-loops before producing the final compiled brief.

### 10. Compile the Execution Brief

Create one short final brief that integrates:

- real goal from `question-requirements`
- MVP scope from `delete-scope`
- module boundaries from `semantic-architecture`
- selected route from `optimize-path`
- TDD micro-loops from `shorten-iteration`, if used
- evidence requirements and stop condition

The final brief must be executable by an agent without rereading all previous reports.

---

## Output contract

Return two sections.

First, the path reasoning:

```md
# Optimize Path Report

## Input
- Real goal:
- MVP nucleus:
- Scope boundary:
- Semantic architecture used: yes / no
- Shorten iteration used: yes / no

## Candidate Paths

### Path A
- Summary:
- Scope:
- Modules/files likely involved:
- Verification:
- Risk:
- Reversibility:
- Waste risk:
- Context cost:

### Path B
- Summary:
- Scope:
- Modules/files likely involved:
- Verification:
- Risk:
- Reversibility:
- Waste risk:
- Context cost:

## Path Evaluation

| Path | Batch size | Stability | Verification clarity | Waste removed | Reversibility | Coupling risk | Context cost | Decision |
|---|---|---|---|---|---|---|---|---|
| A | small/medium/large | low/medium/high | low/medium/high | low/medium/high | low/medium/high | low/medium/high | low/medium/high | keep/reject |
| B | small/medium/large | low/medium/high | low/medium/high | low/medium/high | low/medium/high | low/medium/high | low/medium/high | keep/reject |

## Selected Path

## Reuse Decisions

## Small-Batch Slice

## Working Increment

## Lean Waste Removed

## Minimal Safety Buffer

## Verification Strategy

## Refactor Boundary
none / local / supporting / defer

## Decision
continue | reduce_scope | ask_user | stop
```

Second, the compiled Execution Brief:

```md
# Compiled Execution Brief

## Task

## Real Goal

## MVP Scope

## Must Not Do

## Reuse Decisions

## Module Boundaries

## Files To Read

## Files To Touch

## Files To Avoid

## Context Budget
- Max files to read:
- Max files to touch:
- Max notes:

## Selected Path

## TDD Micro-Loops

## Checks

## Evidence Required

## Max Scope

## Stop Condition

## Handoff
Execute this brief. After execution, produce an Evidence Ledger.
```

Also include a machine-readable JSON block when useful.

---

## Rules

- Do not write code.
- Do not expand the MVP.
- Do not choose a path that lacks verification.
- Do not choose the fastest path if it is not reversible or testable.
- Do not add just-in-case systems. Add only minimal safety buffers.
- Stop at the first safe reuse-ladder rung that satisfies the acceptance evidence.
- Prefer small-batch, working, low-waste increments.
- The final Execution Brief must be short enough to execute without reloading the full reasoning chain.
- If the path is still too large, send it to `shorten-iteration` before final compilation.
- After execution, use `evidence-ledger`, then `adaptive-improvement` only if evidence shows a reusable pattern.
