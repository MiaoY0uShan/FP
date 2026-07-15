# Shorten Iteration Report

## Original Task

Fix password reset bug.

## Selected Path From Optimize Path

Add a focused failing test for expired reset tokens, then make the smallest validation change that passes it.

## Why It Needs Shorter Iterations

The selected path is small, but it still benefits from TDD micro-loops because reset validation can include multiple behaviors: expired token, valid token, and already-used token.

## Iteration Budget
- Max loops: 3
- Max files per loop: 2
- Max files touched overall: 3
- Stop if: auth provider internals or mail adapter integration become necessary.

## TDD Micro-Loops

### Loop 1: reject expired reset token
- Goal: Expired reset tokens are rejected.
- RED: Add a failing test for an expired token.
- GREEN: Make the smallest validation change that rejects expired tokens.
- Refactor boundary: local
- Files to read:
  - `src/auth/reset-token.*`
  - `tests/auth/test_reset_token.*`
- Files to touch:
  - `src/auth/reset-token.*`
  - `tests/auth/test_reset_token.*`
- Checks:
  - targeted reset-token test
- Evidence required:
  - failing test before fix
  - passing test after fix
- Stop condition: stop if the validator requires auth provider refactor.

### Loop 2: keep valid token behavior passing
- Goal: Valid, unexpired reset tokens still pass validation.
- RED: Add or confirm a test for a valid token.
- GREEN: Adjust only if the expiry fix broke valid token handling.
- Refactor boundary: local
- Files to read:
  - `src/auth/reset-token.*`
  - `tests/auth/test_reset_token.*`
- Files to touch:
  - `tests/auth/test_reset_token.*`
  - `src/auth/reset-token.*` only if required
- Checks:
  - targeted reset-token test
- Evidence required:
  - valid token test passes
- Stop condition: stop if this requires endpoint or mail behavior.

### Loop 3: defer already-used token behavior
- Goal: Decide whether already-used token validation belongs in this MVP.
- RED: none yet.
- GREEN: do not implement unless it is already part of the current bug.
- Refactor boundary: defer
- Files to read:
  - existing reset-token tests only if present
- Files to touch:
  - none by default
- Checks:
  - none by default
- Evidence required:
  - note whether this behavior is in or out of scope
- Stop condition: defer if it expands beyond expiry validation.

## Loop Order Rationale

Loop 1 addresses the reported bug. Loop 2 prevents regression. Loop 3 prevents scope creep by explicitly deferring adjacent behavior unless evidence shows it is part of the same bug.

## Integration Point

After Loop 1 and Loop 2 pass, update the Evidence Ledger. Do not integrate endpoint or UI work in this task.

## Failure Split Rule

If Loop 1 fails because token construction is hard to isolate, split into:

1. create a test helper for reset tokens
2. reproduce expired token behavior
3. patch validation after reproduction is stable

## Evidence Ledger Handoff

Copy these into the Evidence Ledger:

- files touched
- targeted test command and result
- verified claims
- deferred behavior
- remaining risks

## Recommended Next Step

Execute Loop 1, then record evidence before continuing.
