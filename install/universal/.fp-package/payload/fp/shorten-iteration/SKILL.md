---
name: fp-shorten-iteration
description: "Use only when routed by FP because work is too large, an attempt failed, or the selected path needs evidence-backed micro-loops."
---

# FP: Shorten Iteration

Split large or failed work into TDD micro-loops.

This skill prevents long, drifting agent runs by turning a selected path into small loops. Each loop should have one goal, one red check or verification point, one minimal green implementation, one refactor boundary, one evidence requirement, and one stop condition.

## Use when

- The selected path from `optimize-path` is too large for one safe run.
- A previous attempt failed.
- Verification failed.
- The agent touched too many files.
- The work crosses multiple modules.
- A bug needs to be reproduced before it can be fixed.
- The task would benefit from multiple TDD cycles.

Do not use this skill to expand the MVP or redesign the product goal.

---

## Core principle

> One loop. One behavior. One verification. One evidence record.

If a loop fails, split it again. Do not blindly retry the same loop.

---

## TDD micro-loop model

Use this pattern when the task involves code behavior, bug fixes, core logic, public APIs, data validation, or security-sensitive changes:

```text
RED
→ GREEN
→ REFACTOR
→ EVIDENCE
```

### RED

Create or identify the smallest failing check.

Examples:

- failing unit test
- reproduction script
- failing integration check
- typecheck error
- snapshot difference
- manual reproduction note

### GREEN

Make the smallest change that passes the check.

Rules:

- do not broaden the fix
- do not refactor unrelated code
- do not touch files outside the loop budget

### REFACTOR

Only refactor inside the declared boundary.

Use one of:

- `none`
- `local`
- `supporting`
- `defer`

### EVIDENCE

Record what proves the loop passed.

Examples:

- command output
- test name
- files touched
- before/after behavior
- remaining risk

---

## Procedure

### 1. Read the selected path

Use the latest Optimize Path Report.

If the selected path is missing, ask to run `optimize-path` first.

### 2. Identify why the path is too large or unsafe

Classify the reason:

- too many behaviors
- too many files
- unclear verification
- previous failure
- cross-module coupling
- missing reproduction
- hidden dependency
- context budget exceeded

### 3. Split into TDD micro-loops

Each micro-loop must have:

- goal
- red check
- green implementation boundary
- files to read
- files to touch
- refactor boundary
- evidence required
- stop condition

### 4. Order the loops

Order loops so earlier loops reduce uncertainty for later loops.

Prefer this order:

1. reproduce or pin down the behavior
2. fix the smallest core behavior
3. add integration or boundary behavior
4. add adjacent cases
5. refactor only after evidence exists

### 5. Define integration point

State when the loops should be combined or reviewed together.

### 6. Define failure split rule

For each loop, specify how to split it if it fails.

Example:

```text
If Loop 2 fails because the mail adapter is hard to mock, split into:
- extract mail sender seam
- test token generation without mail
- reconnect endpoint after seam exists
```

### 7. Define evidence ledger handoff

State what should be copied into the Evidence Ledger after each loop or after the set of loops.

---

## Output contract

Return this structure:

```md
# Shorten Iteration Report

## Original Task

## Selected Path From Optimize Path

## Why It Needs Shorter Iterations

## Iteration Budget
- Max loops:
- Max files per loop:
- Max files touched overall:
- Stop if:

## TDD Micro-Loops

### Loop 1: <name>
- Goal:
- RED:
- GREEN:
- Refactor boundary: none / local / supporting / defer
- Files to read:
- Files to touch:
- Checks:
- Evidence required:
- Stop condition:

### Loop 2: <name>
- Goal:
- RED:
- GREEN:
- Refactor boundary: none / local / supporting / defer
- Files to read:
- Files to touch:
- Checks:
- Evidence required:
- Stop condition:

## Loop Order Rationale

## Integration Point

## Failure Split Rule

## Evidence Ledger Handoff

## Recommended Next Step
```

---

## Rules

- Do not create loops without verification.
- Do not create loops that all touch the same broad file set.
- Do not call broad refactors a TDD loop.
- Do not hide failure behind a vague summary.
- If one loop is too large, split it again.
- Prefer fewer, clearer loops over many vague loops.
- For non-code work, replace RED/GREEN with before/after artifact checks and explicit review evidence.


## Failure-to-Smaller-Task Protocol

If a loop fails, blocks, exceeds the Context Budget Contract, or discovers unexpected coupling, do not retry the same loop blindly.

Return a smaller task set:

```json
{
  "failed_task": "",
  "failure_type": "",
  "root_cause": "",
  "evidence": [],
  "smaller_tasks": [],
  "new_context_budget": {
    "max_files_to_read": 0,
    "max_files_to_touch": 0,
    "files_to_avoid": []
  },
  "new_verification": [],
  "stop_condition": ""
}
```

The smaller task must have one behavior, one check, and one evidence record.
