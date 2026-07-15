# Schema Memory Card

Status: candidate only — not promoted. The single password-reset task is insufficient for active schema memory.

## Schema Name

Validation Logic Bug Fix

## Trigger

Use when a bug involves validation, state transition, auth, billing, permissions, or token behavior.

## Problem Pattern

The agent is tempted to patch symptoms or inspect broad provider internals before reproducing the failing behavior.

## Common Failure Modes

- Patches behavior without a failing test.
- Reads unrelated provider or integration files.
- Touches too many files.
- Fixes the current symptom but skips regression coverage.
- Claims completion without showing focused verification.

## Recommended Execution Pattern

1. Reproduce the bug with one failing test or focused check.
2. Touch the smallest validation module.
3. Run the focused test.
4. Record verified and unverified claims.
5. Defer endpoint/UI/integration work unless it is part of the MVP nucleus.

## Context Budget Pattern

- Max files to read: 4
- Max files to touch: 2
- Avoid provider internals unless the failing check points there.

## TDD / Verification Pattern

- RED: failing behavior check.
- GREEN: smallest code change.
- REFACTOR: only if the test stays green and the refactor is inside the touched module.
- EVIDENCE: focused test output and file list.

## Files Or Modules Usually Involved

- validation module
- model or token store
- focused test file

## Files Or Modules Usually Avoided

- unrelated provider internals
- UI work
- email templates
- billing or analytics code

## Evidence Required

- Failing check before fix.
- Passing check after fix.
- No unrelated file changes.

## Stop Conditions

- Stop if the fix requires rewriting provider internals.
- Stop if the failing behavior cannot be reproduced.
- Stop if more than two production modules must be changed.

## Promotion History

- Proposed from one password-reset token validation run.
- Promotion blocked pending distinct tasks/sessions, leave-one-out, negative controls, invariants, shadow, approval, and rollback evidence.

## Last Updated Because

One run suggested this bounded candidate; no cross-task generalization claim has been made.
