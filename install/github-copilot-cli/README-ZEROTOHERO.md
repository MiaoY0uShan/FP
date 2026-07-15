# ZeroToHero for GitHub Copilot CLI

Install:

```bash
unzip zerotohero-github-copilot-cli-v{version}.zip -d your-project/
```

Restart your agent. The persistent `.github/instructions/zerotohero.instructions.md` entry activates project guidance; the custom agent remains available for explicit selection.

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
