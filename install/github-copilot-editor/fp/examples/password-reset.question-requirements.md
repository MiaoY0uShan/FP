# Question Requirements Report

## Request Restatement

The user appears to want the password reset bug fixed without changing unrelated authentication behavior.

## Stated Goal

Fix password reset bug.

## Likely Real Goal

Expired or invalid reset tokens should be rejected reliably, without refactoring the auth provider or touching OAuth login.

## Five Whys

### Why 1
Question: Why fix the password reset bug?
Answer: Users may be able to reset passwords incorrectly or fail to reset them when they should.

### Why 2
Question: Why is this harmful?
Answer: Password reset touches account access and security-sensitive behavior.

### Why 3
Question: Why not rewrite the full auth flow?
Answer: The likely bug is narrower than the full auth system, and broad refactors increase risk.

### Why 4
Question: Why must the task stay narrow?
Answer: Auth changes can easily affect OAuth, sessions, billing access, or login behavior.

### Why 5
Question: What is the real objective?
Answer: Verify and fix reset token validation with the smallest safe change.

Root objective:
Fix reset token validation with evidence, while avoiding unrelated auth changes.

## Inversion

### Failure paths
- The agent rewrites auth provider internals instead of fixing token validation.
- The agent changes OAuth login while chasing password reset behavior.
- The agent claims success without a failing test and passing test.
- The agent reads unrelated billing or session code and expands scope.

### Ways the agent could make this worse
- Touch too many auth files.
- Replace existing token behavior without understanding compatibility.
- Skip tests because the change looks small.

### Scope creep risks
- OAuth login cleanup.
- Session refactor.
- Email delivery redesign.
- Billing account access changes.

### Things to avoid
- `src/oauth/**`
- `src/billing/**`
- Auth provider refactor
- Session model changes

## Assumptions

- Password reset uses a token validation path that can be tested directly. [risky]
- The target bug can be reproduced with a unit test. [risky]
- OAuth login does not need to change. [safe]

## Success Criteria

- There is a failing test that reproduces the reset-token bug.
- The implementation makes that test pass.
- No OAuth, billing, or session refactor is introduced.
- The evidence ledger records files touched and checks run.

## Non-goals

- Do not rewrite the auth provider.
- Do not redesign email delivery.
- Do not change OAuth login.
- Do not add a new CLI or runtime.

## Decision

reduce_scope

Reason:
The task is valid but should be reduced to reset-token validation only.

## Recommended Next Skill

- `delete-scope`
