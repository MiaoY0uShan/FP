# FP for Codex

Install from this repository:

```text
Copy install/codex/.agents into your target project root.
```

The target project should then contain:

```text
your-project/.agents/skills/fp/
```

Install from a release zip:

```bash
unzip fp-codex-v{version}.zip -d your-project/
```

`install/codex/.agents/` is a tracked FP install template. A copied `your-project/.agents/skills/` directory is local agent configuration unless that project explicitly commits agent config.

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
