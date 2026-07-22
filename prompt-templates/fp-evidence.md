---
description: "Generate an FP Evidence Ledger for the current task — files, commands, claims, and verdict"
argument-hint: "[task id]"
---
Generate an FP Evidence Ledger for ${@:-the current task}.

## Task
- Task ID:
- Task:
- Route: small | medium | large | debug | incident
- Result: pass | fail | incomplete

## Files
- Read:
- Touched:
- Avoided:

## Commands Run
| ID | Command | Exit Code | Result | Evidence |
|---|---|---|---|---|
| ... | ... | ... | pass/fail | ... |

## Verified Claims
| ID | Claim | Evidence Ref |
|---|---|---|
| ... | ... | ... |

## Unverified / Remaining Risk
- ...

## Decision
- complete | split into smaller task | blocked by <reason>
