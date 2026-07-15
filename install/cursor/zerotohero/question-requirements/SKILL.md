---
name: zerotohero-question-requirements
description: "Use only when routed by ZeroToHero for vague, risky, large, product-facing, or assumption-heavy work; separates facts, decisions, failure paths, success criteria, and non-goals."
---

# ZeroToHero: Question Requirements

Question requirements before execution.

This skill stops the agent from confidently building the wrong thing.

It combines:

- requirement challenge
- Toyota-style Five Whys
- inversion thinking
- evidence-first decision making
- an optional fact/decision challenge loop

Do not write code while using this skill.

## Use when

Use this skill when:

- The request is vague or broad.
- The user proposes a new feature, project, refactor, workflow, or automation.
- The task may affect product behavior, data, security, APIs, billing, auth, user experience, or architecture.
- Success criteria are missing.
- The agent is tempted to start coding immediately.
- The proposed solution may not be the real problem.

Do not use the full process for tiny edits such as typo fixes, formatting, or obvious one-line changes.

Use the interactive challenge loop only when the user explicitly asks to be grilled/challenged, a blocking product decision remains, a hard-to-reverse high-risk choice is unresolved, or repository facts contradict the proposed behavior. Do not start a long interview during incident restoration.

## Goal

Produce a concise requirement challenge that:

1. identifies the real objective,
2. separates facts from assumptions,
3. exposes likely failure paths,
4. defines observable success criteria,
5. defines explicit non-goals,
6. decides whether to continue, reduce scope, ask the user, or stop.

## Core principle

Do not optimize the first version of the request.

First question it.

A user request is often a surface expression of a deeper goal. Find the deeper goal before planning implementation.

## Procedure

### 1. Restate the request

Briefly restate what the user appears to want.

Keep it short.

```text
The user appears to want:
...
```

### 2. Separate the stated goal from the likely real goal

The stated goal is what the user literally asked for.

The likely real goal is the outcome the user probably wants.

```text
Stated goal:
...

Likely real goal:
...
```

If the real goal is uncertain, label it as an assumption.

### 3. Run Five Whys

Ask "why" up to five times.

Do not ask the user five questions by default. First answer using available context. Ask the user only if a blocking unknown remains.

Use this format:

```text
Why 1:
Question:
Answer:

Why 2:
Question:
Answer:

Why 3:
Question:
Answer:

Why 4:
Question:
Answer:

Why 5:
Question:
Answer:
```

Stop early if the root objective becomes clear.

The Five Whys should uncover one or more of these:

- the real user outcome
- the root problem
- the hidden constraint
- the unnecessary solution assumption
- the smallest useful version
- the real risk

If an answer is speculative, mark it as:

```text
Assumption:
```

If a missing fact blocks progress, mark it as:

```text
Blocking unknown:
```

### 4. Run inversion

Ask how the task could fail before deciding how to do it.

Use these questions:

```text
If this task failed, why would it fail?
If the agent made the result worse, what would it do?
If this became too expensive, where would the cost come from?
If the scope exploded, what would cause it?
If the user was disappointed, what expectation was missed?
```

Output:

```text
Failure paths:
- ...

Ways the agent could make this worse:
- ...

Scope creep risks:
- ...

Things to avoid:
- ...
```

This section should produce boundaries for later skills:

- `files_to_avoid`
- `scope_boundary`
- `stop_condition`
- `non_goals`
- `evidence_required`

### 5. Extract assumptions

List assumptions that must be true for the task to make sense.

Mark each assumption as:

```text
safe | risky | blocking
```

Example:

```text
- The user wants a portable skill bundle, not a CLI. [safe]
- The target agent can read SKILL.md files. [risky]
- Automatic execution is required now. [blocking if true]
```

For each risky or blocking assumption, select one destructive counterexample that could change the route: invalid input, retry/concurrency, timeout/partial failure, permission or hostile input, state loss/restart, rollback failure, or a scale boundary. Record `verified | rejected | user_decision | unresolved`.

### 5a. Optional challenge loop

Separate unknowns before asking anything:

```text
Fact:
- discover from code, config, logs, authoritative docs, or a probe
- investigate it; do not ask the user to guess

Decision:
- product semantics, preference, risk acceptance, or business boundary
- ask the user one decision at a time and wait
```

Ask upstream decisions before dependent details. Default to at most three blocking questions. Each question includes:

```text
Decision ID:
Question:
Why it blocks now:
Verified facts:
Recommendation and confidence:
Main alternative:
Cost if wrong:
Dependent decisions:
```

Use this state chain in order; do not collapse the wait states:

```text
investigate facts
-> order decisions by dependency
-> ask the first unresolved upstream decision
-> wait for and record the user's answer
-> ask the next dependent decision
-> wait for and record the user's next answer
-> confirm shared understanding
-> only then hand off for an authorized edit
```

If two decisions depend on one another, the first turn asks only the upstream decision. The downstream question is not asked, defaulted, or implemented until the upstream answer has been recorded.

Never answer a user-owned decision on the user's behalf. Do not edit until blocking decisions are resolved and shared understanding is confirmed. If the user says to stop asking and continue, record accepted defaults and unresolved risk; stop only when no safe default exists.

### 6. Define success criteria

Define what must be true for the task to count as complete.

Success criteria must be observable.

Bad:

```text
Make it better.
```

Good:

```text
The skill outputs a requirement challenge with Five Whys, inversion, assumptions, success criteria, non-goals, and a decision.
No CLI, npm, npx, or pip is required.
The README explains when to use the skill.
```

### 7. Define non-goals

List what should not be done now.

Include:

- unnecessary features
- premature automation
- files or systems that should not be touched
- assumptions that should not be built into the solution
- implementation details that belong in a later skill

### 8. Make a decision

Choose one:

```text
continue
reduce_scope
ask_user
stop
```

Use:

- `continue` if the goal is clear and bounded
- `reduce_scope` if the goal is valid but too broad
- `ask_user` if a blocking unknown remains
- `stop` if the request is unnecessary, unsafe, incoherent, or not worth doing

Output:

```text
Decision:
continue | reduce_scope | ask_user | stop

Reason:
...
```

### 9. Recommend the next skill

Usually recommend one of:

- `semantic-architecture` for project, system, feature, refactor, workflow, or multi-module tasks
- `delete-scope`
- `optimize-path`
- `shorten-iteration`
- `schema-memory`

Do not recommend implementation until the decision is `continue` or `reduce_scope`.

## Output contract

Return this structure:

```md
# Question Requirements Report

## Request Restatement

## Stated Goal

## Likely Real Goal

## Five Whys

## Inversion

## Assumptions

## Challenge Summary (only when triggered)
- Verified facts:
- Resolved decisions:
- Rejected assumptions:
- Accepted counterexamples:
- Unresolved risks:
- User confirmation:

## Success Criteria

## Non-goals

## Decision

## Recommended Next Skill
```

## Rules

- Do not write code.
- Do not propose an implementation yet.
- Do not expand the task.
- Do not ask the user five questions unless necessary.
- Investigate facts; ask users only for decisions they own.
- In a challenge loop, ask one question per turn and wait for the answer.
- Do not implement before the challenge confirmation gate passes.
- Do not treat the first proposed solution as mandatory.
- Prefer fewer, sharper requirements.
- If success cannot be verified, stop or ask for a measurable criterion.

## Failure mode

If the task cannot be clarified from available context, output:

```md
# Blocked

Decision: ask_user

Blocking unknown:
...

Smallest useful question:
...
```

Ask only the smallest question needed to continue.
