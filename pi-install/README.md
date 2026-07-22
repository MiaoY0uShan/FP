# Pi Install

FP optimized for [pi](https://github.com/earendil-works/pi-coding-agent) coding agent.

## Quick Install

```bash
# Clone and install
git clone https://github.com/MiaoY0uShan/FP.git
cd FP

# Link FP skill into pi's skill directory
cp -r fp/SKILL.md ~/.pi/agent/skills/fp/SKILL.md
cp -r fp/adaptive-improvement ~/.pi/agent/skills/fp/adaptive-improvement
cp -r fp/delegated-execution ~/.pi/agent/skills/fp/delegated-execution
cp -r fp/delete-scope ~/.pi/agent/skills/fp/delete-scope
cp -r fp/dispatch-parallel-domains ~/.pi/agent/skills/fp/dispatch-parallel-domains
cp -r fp/evidence-ledger ~/.pi/agent/skills/fp/evidence-ledger
cp -r fp/generalization-gate ~/.pi/agent/skills/fp/generalization-gate
cp -r fp/metrics ~/.pi/agent/skills/fp/metrics
cp -r fp/optimize-path ~/.pi/agent/skills/fp/optimize-path
cp -r fp/provider-compatibility ~/.pi/agent/skills/fp/provider-compatibility
cp -r fp/question-requirements ~/.pi/agent/skills/fp/question-requirements
cp -r fp/schema-memory ~/.pi/agent/skills/fp/schema-memory
cp -r fp/semantic-architecture ~/.pi/agent/skills/fp/semantic-architecture
cp -r fp/shorten-iteration ~/.pi/agent/skills/fp/shorten-iteration
cp -r fp/skills/* ~/.pi/agent/skills/fp/skills/
cp -r fp/templates ~/.pi/agent/skills/fp/templates
cp -r fp/contracts ~/.pi/agent/skills/fp/contracts
cp -r fp/lessons-learned ~/.pi/agent/skills/fp/lessons-learned
cp fp/AGENTS.md ~/.pi/agent/skills/fp/AGENTS.md
cp fp/VERSION ~/.pi/agent/skills/fp/VERSION

# Install prompt templates
cp prompt-templates/*.md ~/.pi/agent/prompts/

# Add AGENTS.md reference to your project or global config
echo 'See ~/.pi/agent/skills/fp/AGENTS.md for the full contract.' >> ~/AGENTS.md
```

## What You Get

### Auto-Loaded Skills
| Skill | Triggers When |
|-------|--------------|
| `fp` (core) | Any engineering task |
| `fp-debug` | Unknown failure, diagnosis needed |
| `fp-live-system` | Remote/embedded/OpenWrt targets |
| `fp-continue` | Resuming after session break |
| `fp-codebase` | Multi-file codebase analysis |
| `fp-provider-compatibility` | Third-party proxy/gateway issues |
| `fp-question-requirements` | Vague/risky/large requirements |

### Prompt Templates
In pi's editor, type `/` then:

| Command | Purpose |
|---------|---------|
| `/fp-cards` | Generate Idea Cards for vague tasks |
| `/fp-brief` | Generate Execution Brief |
| `/fp-evidence` | Generate Evidence Ledger |
| `/fp-small` | Execute a Small route |

### Templates (On-Demand)
The full template library (execution brief, evidence ledger, debug checklist, etc.) is in `~/.pi/agent/skills/fp/templates/`. The agent loads these when the skill's routing table says to.

## Context Efficiency

FP for pi uses ~100 lines of core context (routing + mandates). All profiles and templates load only when their trigger condition matches, saving ~75% context vs the full FP suite.
