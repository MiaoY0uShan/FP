# Failure-to-Smaller-Task Protocol

## Failed Task
Add password reset flow.

## Failure Type
- [x] coupling discovered
- [x] context budget exceeded

## Root Cause
The email adapter is not mockable, so adding the endpoint and email delivery in the same task would require changing provider internals.

## Evidence
- Focused token validation tests pass.
- Endpoint test cannot isolate mail delivery.
- Proposed change would touch `src/email/provider/**`, which is outside the contract.

## Smaller Verified Tasks
1. Extract a minimal mail sender seam.
2. Add unit test for reset token generation without email delivery.
3. Add endpoint after the mail seam exists.

## New Context Budget
- Max files to read: 3
- Max files to touch: 2
- Files to avoid: `src/oauth/**`, `src/billing/**`, `src/email/provider/**`

## New Verification
- First check to run: focused unit test for reset token generation
- Evidence required: failing test before seam, passing test after seam

## Stop Condition
Stop if the seam requires provider migration or changes more than two files.
