# FP Benchmark Suite

Reproducible blind evaluation for FP protocol variants.

## Quick Start

```bash
# Set your API key (OpenAI-compatible gateway)
export FP_API_KEY="your-key"

# Optional: dedicated DeepSeek key (falls back to FP_API_KEY gateway)
export DEEPSEEK_API_KEY="your-key"

# Run full blind eval (run → blind → eval → score)
node benchmarks/real-eval-v2.mjs all

# Run multi-turn E2E with real tool calls
node benchmarks/multi-turn-harness-v2.mjs
```

Or use the one-click scripts:

```bash
# Linux/macOS
sh benchmarks/run-eval.sh

# Windows
benchmarks\run-eval.cmd
```

## Fixed Parameters

| Parameter | Value | Override |
|-----------|-------|---------|
| Subject model | `gpt-5.6-sol` | `--model <id>` |
| Judge models | `gpt-5.6-sol`, `deepseek-v4-pro` | `FP_JUDGES=model1,model2` |
| Trials per scenario | 3 | `--trials N` |
| Temperature | 0.2 + 0.15×(trial−1) | Hardcoded (diversity) |
| Judge max tokens | 4096 | Hardcoded |
| API gateway | `https://ai.akile.ai/v1` | Hardcoded |

## Scenario Bank

63 scenarios across 13 evaluation dimensions:

| Trait | Scenarios | Weight |
|-------|-----------|--------|
| debug-first | 5 | 0.20 |
| evidence-verification | 5 | 0.15 |
| route-precision | 5 | 0.15 |
| concision-safety | 5 | 0.15 |
| multi-agent | 7 | 0.12 |
| live-system | 7 | 0.10 |
| provider-compat | 7 | 0.07 |
| continuation | 5 | 0.06 |
| goal-fidelity | 6 | — |
| coding-discipline | 5 | — |
| autonomy | 2 | — |
| ceremony-restraint | 2 | — |
| safety-secrets | 2 | — |

Scenarios live in `benchmarks/traits/*.json`. Each has a prompt, risk level, and per-dimension rubric with 1/3/5 scoring anchors.

## Blinding Protocol

1. **Run phase** generates raw responses per (version, scenario, trial)
2. **Blind phase** groups by (scenario, trial), assigns hashed anonymous labels (A/B/C...), strips version identity
3. **Eval phase** sends blinded responses to each judge — judges see only the anonymous label, never the version
4. **Score phase** reattaches versions via a separate key file, computes statistics

The blind ID is `sha256(seed + group + version + contentHash)` — deterministic but unlinkable without the key.

## Output Files

All outputs go to `benchmarks/real-eval-results/`:

| File | Content |
|------|---------|
| `responses.jsonl` | Raw model responses (resumable, per-model keyed) |
| `blinded.jsonl` | Anonymized responses for judges |
| `blind-key.jsonl` | Version ↔ blind-label mapping (held separate) |
| `scores.jsonl` | Per-judge per-dimension scores |
| `stats-report.json` | Final statistics: mean/std/min/max/blockers, per-trait breakdown, Cohen's d, inter-judge agreement |

## Versions Under Test

| ID | Description | Source |
|----|-------------|--------|
| `v0` | Baseline (no FP) | Synthetic modifiers |
| `v-final` | Living mainline | `fp/SKILL.md` (live) |
| `v-minimal` | 3-rule minimal | Inline |
| `v-host2` | Host-native experiment | `fp-host/SKILL.md` (live) |
| `v-coding` | +CodingDiscipline (frozen) | `version-snapshots/v-coding-89line.md` |
| `v-tf2` | +TestFirst (frozen) | `version-snapshots/v-testfirst-rule2.md` |

Default run: `--versions v0,v2,v6,v7,v8`. Add `v-final,v-minimal,v-host2` for full comparison.

## Multi-Turn E2E

5 behavioral scenarios with real function-calling:

| Scenario | Tests |
|----------|-------|
| `bugfix-test-first` | Writes test before fix, test passes |
| `blocked-path-no-substitute` | Does NOT substitute CSV when PDF engine fails |
| `smallest-diff-feature` | Minimal diff for a feature add |
| `auth-fix` | Authentication bug fix with verification |
| `refactor-extract` | Extract module refactor |

Each scenario runs in a sandboxed directory with `read_file`, `write_file`, `run_command`, `list_files`, and `task_complete` tools. Acceptance predicates verify behavioral correctness.

## Adding Scenarios

1. Create a JSON file in `benchmarks/traits/` following the existing schema
2. Each scenario needs: `id`, `prompt`, `risk`, and `rubric` with dimension-keyed scoring anchors
3. Run `node benchmarks/real-eval-v2.mjs list` to verify your scenarios load
4. Run with `--versions v0,v-final` to benchmark against baseline

## Reproducing Published Results

The results in the README were generated with:
```bash
FP_API_KEY=<key> node benchmarks/real-eval-v2.mjs all --versions v0,v-final --trials 3
```

To get identical statistics, use the same model IDs and judge pair. Temperature varies by trial (0.2, 0.35, 0.5) for genuine diversity — this is intentional, not noise.
