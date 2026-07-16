# Execution Brief

Use this as the final writable contract. Delete optional profile sections that do not apply.

## Task And Real Goal

- Task:
- Real goal:

## MVP Scope

- In scope:
- Explicitly out of scope:
- Must not do:

## Workspace Baseline

- Repository root, branch, and revision:
- Pre-existing worktree status:
- Ownership of existing changes:
- Relevant baseline checks and pre-existing failures:
- Isolation decision and reason: current worktree | isolated worktree | not applicable
- Unrelated paths/results that must not be overwritten or attributed to this run:

## Acceptance Evidence Matrix

| Requirement | Observable | Check Or Probe | Pass Condition | Evidence Location |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Reuse Decisions

| Needed Capability | First Safe Rung | Existing Asset Or Choice | Why It Satisfies Acceptance |
|---|---|---|---|
| ... | need / codebase / stdlib / native / installed dependency / one line / minimum new code | ... | ... |

## Module Boundaries

| Module | Responsibility | Must Not Own |
|---|---|---|
| ... | ... | ... |

## File And Context Budget

- Files to read:
- Files to touch:
- Files to avoid:
- Max files to read:
- Max files to touch:
- Max notes:
- Forbidden context:

## Selected Path

1. ...

## TDD Micro-Loops

### Loop 1

- RED:
- GREEN:
- REFACTOR boundary:
- EVIDENCE:

## Checks

- ...

## Evidence Reuse And Closure

- Supported diagnostic evidence to reuse:
- Named decision or acceptance row any additional diagnostic probe could change:
- Events that invalidate existing evidence (mutation, rollback, ambiguous write, freshness change):
- Bounded read-only reconciliation after a possible remote mutation:
- User-stop action: cancel pending work and report verified/unverified state without another probe
- Terminal condition: all declared rows pass -> emit one verdict and stop

## Evidence Required

- ...

## Debug Profile

- Original symptom/reproduction:
- Read-only baseline:
- Supported cause:
- Original reproduction after fix:
- Regression:
- Negative control:

## Remote / Stateful Guardrails

- Management path to preserve:
- Desired/generated/effective state to capture:
- Backup or rollback before writes:
- Target capability probes:
- Restart order and lifecycle checks:
- External client path:
- Negative controls:
- Resource ownership/leak proof:
- Secret redaction:

## External Context Contract

- Why external context is needed:
- Exact source/library and version:
- One-topic query:
- Maximum calls/context:
- Forbidden data:
- Freshness evidence:
- Fallback if unavailable:

## MCP Capability Contract

- Acceptance row requiring the MCP:
- Available/configured MCP discovery:
- First safe reuse rung and why native/local alternatives are insufficient:
- Automatic call scope under existing authority:
- If missing: exact source, pinned version/reference, install scope/commands, permissions/data, credentials/auth, processes/restarts, verification, rollback/uninstall:
- Explicit acquisition approval evidence:
- Fallback or dependent row left `unverified`:

## Multi-Agent Ownership

- Parent/integrator and mutation lease:
- Read-only reviewers:
- Disjoint writer scopes, if any:
- Durable progress ledger:
- Re-review gate:

## Max Scope And Stop Condition

- Max scope:
- Stop when:

## Handoff

Execute only this brief. Produce a canonical Evidence Ledger v1 after execution. The parent reruns critical checks before completion.
