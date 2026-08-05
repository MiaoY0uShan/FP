# Add FP — Finish with Proof execution protocol skill

## What is FP?

FP (Finish with Proof) is a **portable execution protocol for coding agents** — 85 lines, 4 core rules, 7 on-demand profiles. It activates automatically for engineering work and stays dormant for casual conversation.

## Why add to pi-skills?

- **Evidence-based design**: Optimized through **1,416 real LLM API calls** across 3 models, 8 traits, and 3 testing methods
- **Works on pi**: Already tested with pi coding agent (see `pi-install/` in FP repo)
- **DeepSeek champion**: v-final scored #1 on DeepSeek-v4-Pro (3.14 vs 2.97 baseline) in blind evaluation
- **Token efficient**: 77 lines vs old 162 — 45% fewer tokens consumed, 57% fewer tool calls
- **Zero dependencies**: Pure prompt-engineering skill — no scripts, no npm install, no API keys needed

## Skill Structure

```
fp/
├── SKILL.md              # Core protocol (85-line equivalent)
└── references/           # On-demand profiles (loaded only when triggered)
    ├── provider-compatibility.md
    ├── multi-agent-review-protocol.md
    ├── live-system.md
    ├── debug-incident.md
    ├── continuation.md
    ├── delegated-execution.md
    └── question-requirements.md
```

## Key Design

- **Progressive disclosure**: Only description is in system prompt; full skill loads on-demand
- **Risk-matched routing**: Small → Medium → Vague → Large, no ceremony for simple fixes
- **On-demand profiles**: 7 profiles load only when their trigger condition matches — not by default
- **Model-aware**: Optimized for reasoning models; `fp-minimal` alternative for non-reasoning models

## References

- Repo: https://github.com/MiaoY0uShan/FP
- Benchmarks: https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md
- Pi install guide: https://github.com/MiaoY0uShan/FP/blob/main/pi-install/README.md
