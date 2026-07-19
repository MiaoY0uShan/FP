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
- Navigation style: zettelkasten | exhaustive | targeted
- Graph tool used: code-review-graph MCP | memory-graph.js | grep-fallback
- Local graph depth: 1 | 2 | 3
- Navigation protocols applied: (from `repository-zettelkasten-navigation.md`)

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

## Codebase Analysis Contract

- MCP available: yes | no
- Primary analysis tool: code-review-graph MCP | grep fallback
- MCP tools used: (list of tool names called)
- Impact map: (path to `codebase-impact-map.md` output, or "none")
- Minimal read set from blast-radius:
- Test gaps identified:
- Risk scoring applied: yes | no
- Token savings estimate: (from MCP `context_savings`, or "unknown")
- Fallback reason: (only when MCP unavailable)

## MCP Capability Contract

- Acceptance row requiring the MCP:
- Available/configured MCP discovery:
- First safe reuse rung and why native/local alternatives are insufficient:
- Automatic call scope under existing authority:
- If missing: exact source, pinned version/reference, install scope/commands, permissions/data, credentials/auth, processes/restarts, verification, rollback/uninstall:
- Explicit acquisition approval evidence:
- Fallback or dependent row left `unverified`:

## Provider Compatibility And Spend Contract

- Effective host/version -> settings/env -> proxy/gateway/version/health -> protocol -> requested/effective wire model -> provider:
- Ignored, remapped, partial, and unsupported protocol fields:
- Retry owners and product of every `(max_retries + 1)`:
- Maximum logical requests / physical attempts / input tokens / output tokens / turns / time:
- Maximum active and cumulative subagents:
- Same-semantic-action and non-narrowing loop ceilings:
- Canonical-body/stable-prefix hash and provider-native cache fields:
- Strict UTF-8 stream/non-stream probe and negative control:
- Host/proxy/provider billing reconciliation:
- Paid-probe authority and stop condition:

## Multi-Agent Ownership

- Parent/integrator and mutation lease:
- Read-only reviewers:
- Disjoint writer scopes, if any:
- Durable progress ledger:
- Re-review gate:

## Delegated Execution Plan

- Observed host runtime and spawn/join/status/cancel primitives:
- Frozen work items and independent domain IDs:
- Fresh implementer -> task reviewer -> conditional fixer/re-review chain:
- Maximum active concurrency, cumulative threads, and fix cycles:
- Serial writer lease handoff:
- Fresh final integration review and parent rerun:

## Max Scope And Stop Condition

- Max scope:
- Stop when:

## Handoff

Execute only this brief. Produce a canonical Evidence Ledger v1 after execution. The parent reruns critical checks before completion.
