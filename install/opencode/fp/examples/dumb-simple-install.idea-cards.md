# Idea Cards Example

## User Input

```text
FP: I want this project to be easier for people to use.
```

## Why cards are needed

The request is real but broad. It could mean install friction, README clarity, first-run confidence, or unsupported-agent fallback.

## Card A — One zip per agent

### Interpretation
The user probably wants installation to feel simpler and more like a plugin.

### MVP
Provide dedicated release zips for Codex, Claude Code, Gemini CLI, and GitHub Copilot CLI.

### Best for
Reducing first-use friction.

### Tradeoff / Risk
More release assets to maintain.

### Estimated Context Budget Contract
```json
{
  "budget_type": "estimated",
  "confidence": "high",
  "max_files_to_read": 5,
  "max_files_to_touch": 4,
  "max_skill_tokens": 900,
  "max_execution_notes": 500,
  "required_context": ["README.md", "INSTALL.md", "install/README.md", "docs/release-checklist.md"],
  "forbidden_context": ["runtime code", "package manager setup"],
  "scope_boundary": "Only improve release/install packaging. Do not add CLI, npm, npx, or pip.",
  "budget_assumptions": ["The install packs already exist", "No new runtime is required"],
  "budget_violation_rule": "Stop before adding scripts or a package manager."
}
```

### Recommended Workflow
```text
question-requirements → delete-scope → optimize-path → compiled execution brief
```

---

## Card B — README first-screen simplification

### Interpretation
The user probably wants visitors to understand the project faster.

### MVP
Move complex protocol details lower and put one command-like sentence at the top.

### Best for
GitHub conversion and fast comprehension.

### Tradeoff / Risk
Does not directly change install files.

### Estimated Context Budget Contract
```json
{
  "budget_type": "estimated",
  "confidence": "high",
  "max_files_to_read": 3,
  "max_files_to_touch": 2,
  "max_skill_tokens": 700,
  "max_execution_notes": 400,
  "required_context": ["README.md", "START_HERE.md"],
  "forbidden_context": ["adapter internals", "case-study internals"],
  "scope_boundary": "Only simplify the first-use explanation.",
  "budget_assumptions": ["No install-pack structure changes are required"],
  "budget_violation_rule": "Stop before rewriting the whole README."
}
```

### Recommended Workflow
```text
optimize-path → compiled execution brief
```

---

## Card C — Copy-paste fallback

### Interpretation
The user probably wants unsupported agents to try FP without installing anything.

### MVP
Add a single copy-paste instruction file for any coding agent.

### Best for
Zero-install trial and unsupported tools.

### Tradeoff / Risk
Less automatic than native skill packs.

### Estimated Context Budget Contract
```json
{
  "budget_type": "estimated",
  "confidence": "medium",
  "max_files_to_read": 4,
  "max_files_to_touch": 3,
  "max_skill_tokens": 800,
  "max_execution_notes": 400,
  "required_context": ["fp-copy-paste.md", "dist/fp-copy-paste.md", "README.md"],
  "forbidden_context": ["agent-specific runtime behavior"],
  "scope_boundary": "Only improve copy-paste fallback. Do not add a universal installer.",
  "budget_assumptions": ["The fallback remains manual and portable"],
  "budget_violation_rule": "Stop before adding CLI or scripts."
}
```

### Recommended Workflow
```text
question-requirements → delete-scope → optimize-path → compiled execution brief
```

---

## Choose

Reply with:

```text
A
B
C
merge A+B
none, generate 3 new cards
```
