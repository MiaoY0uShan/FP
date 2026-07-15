# FP for Claude Code

Install:

```bash
unzip fp-claude-code-v{version}.zip -d your-project/
```

Restart your agent.

Use your agent normally:

```text
Fix the password reset bug.
```

Expected:

- small change -> FP activates automatically and produces a 3-5 line brief plus validation result
- medium task -> FP produces a compact Execution Brief and Evidence Ledger
- large, vague, architectural, or risky task -> FP uses the full chain

Manual override:

```text
FP: Fix the password reset bug.
```
