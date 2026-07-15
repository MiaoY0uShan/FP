# Compiled Execution Brief

## Task

Add password reset flow.

## Real Goal

Allow users to reset passwords safely without refactoring auth provider internals.

## MVP Scope

Reset token generation, expiry validation, and consumed-token prevention only.

## Must Not Do

- Do not rewrite the auth provider.
- Do not touch OAuth login.
- Do not build admin password reset.
- Do not add a full email delivery abstraction.

## Module Boundaries

| Module | Responsibility | Must Not Own |
|---|---|---|
| reset-token | Generate, validate, expire, and consume reset tokens | OAuth provider behavior |
| password-reset-endpoint | Expose the minimum API surface for reset requests | Email provider orchestration |

## Files To Read

- src/auth/reset.ts
- src/auth/token.ts
- tests/auth/test_reset.py

## Files To Touch

- src/auth/reset.ts
- tests/auth/test_reset.py

## Files To Avoid

- src/oauth/**
- src/billing/**
- src/auth/provider/**

## Context Budget

- Max files to read: 4
- Max files to touch: 2
- Max notes: 500 words
- Forbidden context: OAuth login internals, billing flows, admin reset workflows

## Selected Path

1. Write a focused failing test for expired reset tokens.
2. Implement minimal expiry validation in the reset-token path.
3. Add a focused regression test for consumed tokens.
4. Run targeted reset-token tests.
5. Record evidence before claiming completion.

## TDD Micro-Loops

### Loop 1
- RED: Expired reset token is rejected.
- GREEN: Implement minimal expiry validation.
- REFACTOR boundary: local only inside reset-token module.
- EVIDENCE: focused expiry test passes.

### Loop 2
- RED: Used reset token cannot be reused.
- GREEN: Mark token as consumed after successful reset.
- REFACTOR boundary: local only inside reset-token module.
- EVIDENCE: reuse regression test passes.

## Checks

- pytest tests/auth/test_reset.py

## Evidence Required

- Failing test before fix
- Passing test after fix
- No unrelated files touched

## Max Scope

One validation module and one focused test file.

## Stop Condition

Stop if implementation requires auth provider refactor.

## Handoff

Execute only this brief. After execution, produce an Evidence Ledger.
