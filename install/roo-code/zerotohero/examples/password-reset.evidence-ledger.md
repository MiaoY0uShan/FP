# Evidence Ledger

This is a human view of `password-reset.evidence-ledger.json`. The JSON v1 file is the machine source of truth.

## Task

Add password reset flow.

## Result

Pass

## Files Read

- src/auth/reset.ts
- src/auth/token.ts
- tests/auth/test_reset.py

## Files Touched

- src/auth/reset.ts
- tests/auth/test_reset.py

## Commands Run

| Command | Result | Evidence |
|---|---|---|
| pytest tests/auth/test_reset.py | pass | Focused reset-token test suite passed |

## Verified Claims

| Claim | Evidence |
|---|---|
| Expired reset tokens are rejected | Focused test passed |
| Used reset tokens cannot be reused | Regression case passed |

## Unverified Claims

- Full email delivery was not verified.

## Scope Violations

- None.

## Context Budget Violations

- None.

## Remaining Risk

Mail-adapter integration remains outside this task.

## Decision

complete

## Next Action

Track email delivery as a separate integration task.
