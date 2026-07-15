# ZeroToHero for Claude Code

Install:

```bash
unzip zerotohero-claude-code-v{version}.zip -d your-project/
```

Restart your agent.

Use your agent normally:

```text
Fix the password reset bug.
```

Expected:

- small change -> ZeroToHero activates automatically and produces a 3-5 line brief plus validation result
- medium task -> ZeroToHero produces a compact Execution Brief and Evidence Ledger
- large, vague, architectural, or risky task -> ZeroToHero uses the full chain

Manual override:

```text
ZeroToHero: Fix the password reset bug.
```
