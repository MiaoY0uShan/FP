# Optimize Path Report

## Input
- Real goal: Allow users to reset passwords safely without refactoring auth provider internals.
- MVP nucleus: Reset token validation and consumed-token prevention.
- Scope boundary: Do not touch OAuth, billing, or auth provider internals.
- Semantic architecture used: yes
- Shorten iteration used: yes

## Candidate Paths

### Path A
- Summary: Implement reset token validation first.
- Scope: token expiry and consumed-token behavior.
- Modules/files likely involved: reset-token module and focused reset tests.
- Verification: targeted unit tests.
- Risk: low.
- Reversibility: high.
- Waste risk: low.
- Context cost: low.

### Path B
- Summary: Build complete password reset flow with endpoint, email delivery, UI, and logging.
- Scope: full feature.
- Modules/files likely involved: auth, email, UI, logging.
- Verification: integration tests and manual test.
- Risk: high.
- Reversibility: medium.
- Waste risk: high.
- Context cost: high.

## Path Evaluation

| Path | Batch size | Stability | Verification clarity | Waste removed | Reversibility | Coupling risk | Context cost | Decision |
|---|---|---|---|---|---|---|---|---|
| A | small | high | high | high | high | low | low | keep |
| B | large | medium | medium | low | medium | high | high | reject |

## Selected Path

Path A: implement reset token validation first.

## Small-Batch Slice

Validate expired and consumed reset tokens without changing provider internals.

## Working Increment

Focused reset-token tests pass.

## Lean Waste Removed

- No UI.
- No email abstraction.
- No OAuth changes.
- No billing changes.
- No provider refactor.

## Minimal Safety Buffer

Stop if the implementation requires auth provider refactor.

## Verification Strategy

TDD required.

## Refactor Boundary

local

## Compiled Execution Brief

Use `fp/examples/password-reset.execution-brief.md` or `fp/examples/password-reset.compiled-execution-brief.json`.

## Decision

continue

## Backlinks (computed — do not author)

> community-9 | leaf | in_degree=0 out_degree=0 | rebuilt 2026-07-19

_No inbound references._
