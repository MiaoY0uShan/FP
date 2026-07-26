# FP Skill Benchmark Report

> Generated: 2026-07-26T02:03:32.196Z

## Final Rankings

| Rank | Version | Composite | Debug-First | Evidence | Route-Precision | Concis-Safety |
|------|---------|-----------|-------------|----------|-----------------|---------------|
| 1 | v6 Adaptive-Hybrid | 4.71 | 5.00 | 4.50 | 4.60 | 4.67 |
| 2 | v4 Balanced-Optimized | 4.62 | 4.93 | 4.23 | 4.62 | 4.63 |
| 3 | v1 Debug-Max | 4.39 | 5.00 | 4.42 | 4.29 | 3.56 |
| 4 | v3 Evidence-Max | 4.39 | 4.67 | 5.00 | 4.35 | 3.24 |
| 5 | v5 Route-Perfection | 4.20 | 4.61 | 4.22 | 4.47 | 3.26 |
| 6 | v0 Baseline | 4.09 | 4.33 | 3.73 | 4.21 | 4.02 |
| 7 | v2 Concise-Max | 3.36 | 2.93 | 2.48 | 3.92 | 4.39 |

## Winner: v6 Adaptive-Hybrid

**Philosophy:** Context-aware adaptation: applies high ceremony/debug/evidence only when risk is high or cause is unknown; reduces to lightweight mode for known Small changes. Key insight: the right level of each trait depends on the task context, not a fixed setting.

**Composite Score:** 4.71 / 5.00

### Delta Configuration

| Trait | Value | Visualization |
|-------|-------|---------------|
| debug_first_strength | 0.90 | ██████████████████ |
| evidence_burden | 0.75 | ███████████████ |
| route_strictness | 0.85 | █████████████████ |
| concision_pressure | 0.80 | ████████████████ |
| autonomy_level | 0.80 | ████████████████ |
| safety_paranoia | 0.85 | █████████████████ |
| ceremony_level | 0.40 | ████████ |

## Loser: v2 Concise-Max

**Philosophy:** Maximizes conciseness and action velocity. Reduces ceremony, shortens explanations, and prioritizes speed. Risk: may skip verification steps or under-diagnose before patching.
**Composite Score:** 3.36 / 5.00

### Why It Failed

- **debug-first-discipline**: 2.07 points behind winner
  - df-02-timeout-no-retry: under-diagnosis on high-risk task (0.15 penalty)
  - df-02-timeout-no-retry: under-evidence on high-risk task (0.38 penalty)
- **evidence-led-verification**: 2.02 points behind winner
  - ev-03-evidence-invalidation: under-diagnosis on high-risk task (0.15 penalty)
  - ev-03-evidence-invalidation: under-evidence on high-risk task (0.38 penalty)
- **route-classification-precision**: 0.68 points behind winner

## Key Insights

1. **No single-trait maximization wins.** Maximizing any one trait (debug, evidence, conciseness, route precision) creates blind spots that hurt composite performance.
2. **Context-appropriate tuning beats uniform settings.** The winner tunes each trait to its optimal operating point rather than applying the same level everywhere.
3. **Safety and evidence are non-negotiable.** Versions that sacrificed safety or evidence for speed/conciseness scored poorly on high-risk scenarios.
4. **Ceremony must be proportional to risk.** Too much ceremony on simple tasks hurts; too little on complex tasks is dangerous.
5. **The optimal strategy is adaptive, not absolute.**