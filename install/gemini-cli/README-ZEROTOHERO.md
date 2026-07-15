# ZeroToHero for Gemini CLI

Install:

```bash
unzip zerotohero-gemini-cli-v{version}.zip
gemini extensions install ./zerotohero
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
