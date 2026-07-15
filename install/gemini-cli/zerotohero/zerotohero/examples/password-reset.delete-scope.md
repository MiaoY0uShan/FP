# Delete Scope Report

## Input From Question Requirements

Real goal:
Fix reset token expiry validation without refactoring the auth provider.

Success criteria:
- Expired reset tokens are rejected.
- Valid reset tokens still work.
- Existing OAuth login behavior is unchanged.

Failure paths:
- The agent rewrites auth provider internals.
- The agent touches OAuth or billing code.
- The agent claims completion without a failing test and passing test.

Non-goals:
- Do not redesign authentication.
- Do not add a new mail delivery system.
- Do not create a new token storage abstraction.

Decision from question-requirements:
reduce_scope

---

## First-Principles Core

Required user outcome:
Users cannot use expired password reset tokens.

Irreducible capability:
The reset-token validation path must compare token expiry against the current time and reject expired tokens.

Required evidence:
A failing test shows expired tokens were previously accepted or mishandled; a passing test shows expired tokens are now rejected.

Hard constraints:
- Keep auth provider internals unchanged.
- Do not change OAuth login.
- Keep the fix within reset-token validation if possible.

---

## Entity Inventory

| Entity | Type | Needed for MVP? | Reason |
|---|---|---:|---|
| Reset token expiry check | logic | yes | Directly satisfies the real goal. |
| Unit test for expired token | test | yes | Provides minimum evidence. |
| OAuth provider refactor | module/refactor | no | Not required for reset-token validation. |
| Mail delivery mock rewrite | abstraction | no | Not required to verify token expiry. |
| New token storage interface | abstraction | no | Future-proofing; MVP can use existing path. |
| End-to-end browser test | test | unclear | Useful later, not required for minimal proof. |

---

## Occam Filter

### Keep

- Reset token expiry validation.
- One focused unit test for expired reset tokens.
- One regression check that valid tokens still work if cheap.

### Delete Now

- OAuth provider refactor.
- Mail delivery rewrite.
- New token storage abstraction.

### Defer

- End-to-end browser test.
- Broader auth cleanup.
- Reset email UX improvements.

---

## MVP Nucleus

One user outcome:
Expired password reset tokens are rejected.

One primary workflow:
Run the reset-token validation path with an expired token and verify rejection.

Minimum artifacts:
- One test covering expired reset token behavior.
- One minimal implementation change in reset-token validation.

Minimum verification:
- Failing test before fix.
- Passing test after fix.

Explicit non-goals:
- No auth provider rewrite.
- No OAuth changes.
- No mailer redesign.
- No new token abstraction.

---

## Scope Boundary

In scope:
- Reset token validation behavior.
- Focused tests for expired and optionally valid tokens.

Out of scope:
- OAuth login.
- Billing.
- Mail delivery infrastructure.
- Auth provider internals.

Files or modules likely to touch:
- reset-token validation module.
- password reset tests.

Files or modules to avoid:
- `src/oauth/**`
- `src/billing/**`
- auth provider core internals unless the test proves it is unavoidable.

Stop condition:
Stop if the fix requires redesigning the auth provider or changing OAuth behavior.

---

## Minimum Evidence

- Test fails before implementation.
- Test passes after implementation.
- No unrelated auth tests regress if available.

---

## MVP Module Candidates

| Module | Responsibility | Should not own | Depends on | Should stay independent from |
|---|---|---|---|---|
| reset-token-validation | Decide whether a reset token is valid or expired. | OAuth login, mail delivery, user billing. | Existing token data. | OAuth provider, billing, mailer internals. |
| reset-token-tests | Prove expired tokens are rejected. | Full auth system redesign. | Test fixtures. | E2E browser flow. |

---

## Decoupling Notes

- Keep reset-token validation independent from OAuth login.
- Do not introduce a new token abstraction unless existing code makes the MVP impossible.
- Treat mail delivery as outside the validation boundary.

---

## Decision

continue

Reason:
The MVP is now a small, verifiable reset-token validation fix.

---

## Recommended Next Skill

optimize-path
