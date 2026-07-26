# Context Budget Contract

This is a hard execution boundary for one task.

The user should not have to fill this out manually. FP estimates the budget from task type, risk, and scope.

## Task

## Budget Type

```text
estimated
```

## Confidence

```text
low | medium | high
```

## Scope Boundary

## Context Limits
- Max files to read:
- Max files to touch:
- Max skill tokens:
- Max execution notes:

## Required Context
- Required files:
- Required semantic / schema nodes:
- Required prior reports:

## Forbidden Context
- Forbidden files / directories:
- Forbidden modules:
- Forbidden assumptions:
- Forbidden future work:

## Modification Limits
- Files allowed to touch:
- Files explicitly forbidden to touch:
- Max scope:

## Budget Assumptions
- Assumption:
- Assumption:
- Assumption:

## Verification Boundary
- Required checks:
- Evidence required:

## Violation Handling
If the agent needs to exceed this contract:

1. Stop.
2. State which limit would be exceeded.
3. Explain why the current contract is insufficient.
4. Ask for a smaller follow-up task or a revised contract.

## Default estimation guide

| Task type | Read | Touch | Skill tokens | Confidence |
|---|---:|---:|---:|---|
| Tiny docs/config edit | 2 | 1 | 500 | high |
| Focused bug fix | 4 | 2 | 900 | medium |
| Small MVP feature | 6 | 3 | 1200 | medium |
| Multi-module / architecture task | 8 | 4 | 1500 | low |
