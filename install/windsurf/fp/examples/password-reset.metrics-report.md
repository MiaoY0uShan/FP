# FP Metrics Report

## Task

Add password reset flow.

## Run Type
- [x] With FP
- [ ] Without FP baseline

## Verified Progress
- Verified tasks completed: 1
- Evidence source: `password-reset.evidence-ledger.md`

## Context Load
- Exact total context tokens, if available: unknown
- Skills loaded: 5
  - question-requirements
  - delete-scope
  - semantic-architecture
  - optimize-path
  - shorten-iteration
- Reports generated or used: 4
  - question requirements report
  - delete scope report
  - semantic architecture report
  - compiled execution brief
- Files read: 3
- Context Load Size: 3 files per verified task
- Context Load Proxy: 12

```text
Context Load Proxy = files_read + skills_loaded + reports_generated
Context Load Proxy = 3 + 5 + 4 = 12
```

## Scope Control
- Files planned to touch:
  - `src/auth/reset.ts`
  - `tests/auth/test_reset.py`
- Files actually touched:
  - `src/auth/reset.ts`
  - `tests/auth/test_reset.py`
- Unplanned files touched: 0
- Scope Creep Rate: 0 / 2 = 0

## Verification
- Checks required:
  - `pytest tests/auth/test_reset.py`
- Checks run:
  - `pytest tests/auth/test_reset.py`
- Checks passed:
  - `pytest tests/auth/test_reset.py`
- Tasks with checks: 1
- Completed tasks: 1
- Verification Rate: 1 / 1 = 1.0

## Rework
- Failed attempts: 0
- Reopened tasks: 0
- Rework Rate: 0 / 1 = 0

## Iteration
- Time to first verified slice: unknown
- TDD micro-loops to first verified slice: 1
- Iteration Half-life: 1 micro-loop proxy

## TVP
- Exact TVP: unknown because exact token count was unavailable
- Proxy TVP: 12 / 1 = 12

## Interpretation

The run stayed inside the context budget, touched only planned files, ran the required focused check, and produced verified progress.

This example cannot prove token reduction without a non-FP baseline or exact token logs. It can only show proxy context load, scope control, and verification quality.

## Decision

metrics_complete

## Recommended Next Skill

adaptive-improvement
