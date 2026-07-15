# Context Diet Map

## Task
Add password reset flow.

## Relevant Context
- `src/auth/reset.ts`
- `src/auth/token.ts`
- `tests/auth/test_reset.ts`
- schema card: `validation-bug`

## Irrelevant Context
- OAuth provider internals
- billing flows
- admin reset flows
- full email delivery abstraction

## Files To Read
- `src/auth/reset.ts`
- `src/auth/token.ts`
- `tests/auth/test_reset.ts`

## Files To Avoid
- `src/oauth/**`
- `src/billing/**`
- `src/auth/provider/**`

## Required Schema Cards
- `validation-bug`

## Forbidden Context
- Future admin reset flows
- OAuth login behavior
- Email provider migration

## Reason
The MVP is reset-token validation. OAuth, billing, and email infrastructure are outside the current scope and would increase context load without improving the first verified slice.

## JSON form

```json
{
  "task": "Add password reset flow",
  "relevant_nodes": ["auth.reset-token", "tests.auth.reset"],
  "irrelevant_nodes": ["oauth.provider", "billing", "admin.reset", "email.infrastructure"],
  "files_to_read": ["src/auth/reset.ts", "src/auth/token.ts", "tests/auth/test_reset.ts"],
  "files_to_avoid": ["src/oauth/**", "src/billing/**", "src/auth/provider/**"],
  "required_schema_cards": ["validation-bug"],
  "forbidden_context": ["OAuth login behavior", "billing flows", "admin reset flows"],
  "reason": "Task only touches reset-token validation, not OAuth provider internals."
}
```
