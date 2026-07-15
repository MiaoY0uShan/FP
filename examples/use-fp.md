# Use FP

Use FP with any coding agent that can read Markdown files, skills, extensions, or custom agent profiles.

## Prompt

```text
Use FP to choose the lightest evidence-backed path before editing code:
<task>
```

## Expected result

For a small clear change, the agent should produce:

- 3-5 line brief
- validation result

For a medium task, the agent should produce:

- Execution Brief
- Evidence Ledger

For a large, vague, architectural, or risky task, the agent should produce:

- Idea Cards or requirements clarification
- delete-scope / architecture / optimize-path only as needed
- compact Execution Brief
- Evidence Ledger

## Install packs

Use one of:

```text
install/codex/
install/claude-code/
install/gemini-cli/
install/github-copilot-cli/
```
