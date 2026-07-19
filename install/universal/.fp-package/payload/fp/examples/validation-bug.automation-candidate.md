# Automation Candidate

## Repeated Manual Step

Creating a focused validation bug fix checklist after multiple validation-related tasks.

## Evidence Of Repetition

- Password reset token expiry validation required the same pattern: reproduce, minimal fix, focused test, evidence ledger.
- Similar patterns should be observed in at least one more validation bug before automation.

## Stability Level

low

## Risk If Automated Too Early

The automation could assume all validation bugs use the same file layout or test command.

## Guardrails Required

- Must preserve context budget.
- Must ask for a failing check if none exists.
- Must not generate broad provider rewrites.

## Rollback Plan

Keep the checklist as a schema memory card instead of generating code or scripts.

## Decision

observe_more

## Backlinks (computed — do not author)

> community-12 | leaf | in_degree=0 out_degree=0 | rebuilt 2026-07-19

_No inbound references._
