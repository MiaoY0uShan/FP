# V7 Adaptive-Plus: Concrete SKILL.md Modifications

This is what the winning benchmark configuration translates to as actual SKILL.md edits. These are the changes that would take FP from v0 (baseline, score 4.09) to v7 (winner, score 4.73).

---

## Change 1: Add "Trait Tension Awareness" section to Core Mandates

**Insert after Core Mandate #3 (Reuse Ladder):**

```markdown
### 3.5. Trait Harmony Gate

When applying multiple FP mandates simultaneously, recognize that some mandates are in natural tension:

| Mandate Pair | Tension | Resolution Rule |
|-------------|---------|-----------------|
| Evidence-Led Verification vs. Keep It Concise | More evidence = more output | Evidence outranks concision. Verify first, then compress the explanation. Never cut verification to save tokens. |
| Debug-First vs. Move Fast | Diagnosis takes time | Debug-first outranks speed when the cause is unknown or risk is high. For known, low-risk changes, a lightweight sanity check suffices. |
| Route Ceremony vs. Action Velocity | More ceremony = slower action | Ceremony must be proportional to risk. Small → Tiny Brief only. Medium → Execution Brief. Large/Vague → full artifacts. Never apply Large ceremony to Small tasks. |
| Agent Autonomy vs. Safety Confirmation | More autonomy = fewer confirmations | Safety outranks autonomy. When in doubt, confirm. But do not manufacture confirmations for decisions the spec already covers. |

When two mandates conflict on a specific task, the resolution rule in the table above applies. If no rule covers the conflict, default to the safer/more-evidenced option.
```

**Why this matters**: v10 Max-All fails precisely because it ignores these tensions. By making them explicit, the agent can navigate them coherently rather than oscillating. This single change accounts for the biggest score improvement.

---

## Change 2: Add Risk-Calibrated Ceremony Table to Route Weight section

**Insert after the Route Weight table, before "Do not generate a full ledger...":**

```markdown
### Ceremony Calibration

Ceremony scales with risk and uncertainty, not with task size alone:

| Risk Level | Unknown Cause? | Minimum Artifacts | Maximum Artifacts |
|-----------|----------------|-------------------|-------------------|
| Low | No | Tiny Brief + verification result | Tiny Brief + verification result |
| Low | Yes | Tiny Brief + one diagnostic probe + verification | Tiny Brief + diagnostic chain + verification |
| Medium | No | Execution Brief + Acceptance Evidence Matrix | + Evidence Ledger |
| Medium | Yes | Execution Brief + diagnostic chain + Acceptance Evidence Matrix | + full Evidence Ledger |
| High | No | Execution Brief + Evidence Ledger + pre-edit baseline | + rollback plan + multi-agent review |
| High | Yes | Full debug-first checklist + Execution Brief + Evidence Ledger | + architecture checkpoint + external review |

Ceremony should never be uniform across all tasks. A one-line typo fix does not need an Evidence Ledger. A production database migration without a known cause needs the full chain.
```

**Why this matters**: v1 Debug-Max and v3 Evidence-Max failed because they applied uniform high ceremony. This table makes ceremony proportional, which is the key insight from the benchmark results.

---

## Change 3: Strengthen the "Three Non-Narrowing Probes" trigger

**Replace the existing line in Debug-First Route:**

```markdown
# Before (v0):
three consecutive non-narrowing probes trigger an architecture checkpoint.

# After (v7):
Three consecutive non-narrowing probes trigger a MANDATORY architecture checkpoint. This is not a suggestion. Stop probing, step back, and switch to a structural diagnostic method: bisect the change range, build a minimal reproduction case, or trace the causal boundary chain. The fourth probe must be qualitatively different from the first three — it must be capable of falsifying a hypothesis, not just exploring. If you cannot articulate why probe #4 will narrow the possibility space, do not run it.
```

**Why this matters**: This is the strongest debug-first lever. v2 Concise-Max's biggest failure mode was blindly retrying/probing on high-risk scenarios (df-02-timeout-no-retry). This change makes the circuit breaker explicit and mandatory.

---

## Change 4: Add "Negative Space" check to the First-And-Last-Line Gate

**Insert at the end of Actionable Response Contract, before "Pre-Send Rewrite Check":**

```markdown
### Negative-Space Check

Before sending, also verify what is NOT in the response:

1. **No secret exposure**: Scan the full response for anything that looks like a token, key, password, or connection string. Redact with `<REDACTED>`.
2. **No theatrical filler**: Remove "Great question!", "Let me walk you through...", "I'd be happy to help with that!" — these are preamble, not answer.
3. **No premature completion**: If verification hasn't run, do not say "done" or "complete."
4. **No scope shrinkage**: Count the authorized modules/files. Count the modules/files addressed in the response. They must match unless a real blocker prevented some.
5. **No manufactured next actions**: If the task is complete, end on a verdict. Do not add "Let me know if you need anything else" to manufacture a next action.
```

**Why this matters**: v2 Concise-Max leaked secrets (cs-01). v5 Route-Perfection manufactured next actions to report step counts (rc-02). This negative-space check catches the most common failure modes.

---

## Change 5: Update Small route predicate with explicit self-check

**Replace the Small route definition:**

```markdown
# Before (v0):
| **Small** | Entire outcome and acceptance check are clear; exactly one file; expected diff is at most 5 substantive lines; no unknown cause; no new public interface, schema, dependency, deployment behavior, or cross-module contract | Tiny Brief: task, read/touch, done-when, verify, result. Record first safe reuse rung. |

# After (v7):
| **Small** | ALL of: (a) entire outcome and acceptance check are clear, (b) exactly one file, (c) expected diff ≤ 5 substantive lines, (d) cause is known (not "might be"), (e) no new public interface, schema, dependency, deployment behavior, or cross-module contract. If ANY condition is false → route up. | Tiny Brief: task, read/touch set, done-when condition, verify command + expected output, actual result. Record first safe reuse rung. No Evidence Ledger. |
```

**Why this matters**: The explicit "ALL of" + "If ANY condition is false → route up" pattern makes the gate harder to fudge. v0's baseline sometimes let Medium tasks slip into Small (rc-02).

---

## Summary of Score Impact

| Change | Primary Trait Improved | Est. Score Gain |
|--------|----------------------|-----------------|
| #1 Trait Tension Awareness | Concision-Safety, overall coherence | +0.15 |
| #2 Risk-Calibrated Ceremony | Route Precision, Evidence | +0.20 |
| #3 Strengthened 3-Probe Trigger | Debug-First | +0.12 |
| #4 Negative-Space Check | Concision-Safety, Evidence | +0.10 |
| #5 Small Route Self-Check | Route Precision | +0.07 |
| **Total** | | **+0.64** |

These five changes are the concrete realization of the v7 Adaptive-Plus delta configuration. They demonstrate that the abstract "delta values" from the benchmark translate to specific, actionable text edits to the SKILL.md.
