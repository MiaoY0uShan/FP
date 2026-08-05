---
name: fp-host
description: "Host-native FP variant for agent CLIs with built-in planning, subagents, progress UI, and session resume (Claude Code, Codex CLI, and similar). Keeps the four core rules, routing judgment, and domain profiles; delegates orchestration machinery to the host. Experimental: not yet blind-eval validated — use fp/SKILL.md as the default router."
---

# FP Host-Native (experimental)

> The "host does the machinery" variant. Judgment and domain knowledge stay; orchestration, progress bookkeeping, and session-resume machinery delegate to the host. Candidate for the next blind-eval round against v-final — not yet validated.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Enumerate paths to that goal; pick the shortest feasible one. Blocked → re-enumerate alternatives to the same goal. No viable path left → report tried paths + gap-labeled options and wait. Changing or shrinking the goal is a user-owned decision — never substitute a lookalike outcome. The lock never overrides Safety or a user stop.

**2. Diagnose before patching.**
Before changing code, gather evidence to identify the root cause. Do not guess. Three non-narrowing probes → stop and switch to a structural method (bisect, minimal reproduction, causal boundary trace). For known, low-risk changes a lightweight sanity check is enough.

**3. Verify before claiming done.**
Never say something is complete without observable evidence. Run the relevant tests. See them pass. Done means the original stated goal is met — not a lookalike. Distinguish "implemented" from "verified." Unverified work stays unverified.

**4. Be concise and actionable.**
First line = result or current action. Last line = next concrete step or final verdict. No preamble, no filler. Compress explanation, never compress verification.

## Host-Native Ladder

Before following any FP procedure: host built-in → host configuration (hooks, settings) → only then an FP rule. Never re-implement what the host already provides.

- **Planning & decomposition:** use the host's plan mode and task list. FP adds the routing judgment below, nothing else.
- **Subagents:** use the host's native agent tools for spawn, join, status, and cancel. FP invariants still bind: one writer per shared file set; the parent reruns critical checks instead of trusting summaries; children get bounded envelopes (goal, scope, forbidden actions); leaves never receive credentials, deployment, memory promotion, or live mutation.
- **Progress:** the host's task/progress UI replaces per-turn step/total restatement. The first-and-last-line gate still applies to final answers.
- **Cross-session:** rely on host resume and compaction. For multi-session projects keep one always-rewritten stage snapshot — verified facts only, rollback point, classified blockers, exactly one next step. Never reconstruct state from chat history or git log. Never auto-replay writes on resume; a corrupt or stale handoff fails closed for mutation.

## Skill Interop

FP coordinates; it never duplicates a specialist. Route matching work to the most specific skill and keep FP's gates binding on its output — goal lock, verify before done, Safety. Overlapping candidates → most specific wins; a genuine tie is a user decision. A specialist's "done" still verifies against the user's stated goal.

## Routing (Light)

Classify the whole task before decomposing. Route order is not a fallback.

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | ALL of: one file, ≤5 lines, cause known, no new interface/dependency/schema | Tiny Brief + verify |
| **Medium** | Multi-file, >5 lines, or added tests; no unresolved product decision | Execution Brief + evidence |
| **Vague** | Requirements underspecified, or user says "问我问题" | fp cool → then Medium |
| **Large** | Architectural, multi-module, breaking, migration-heavy | Decompose into risk-reducing modules |

Small is NOT the default. If ANY Small predicate is false → route up. Multi-file = Medium minimum.

## Safety

- Redact all secrets (tokens, keys, passwords) from every output. Use `<REDACTED>`.
- Destructive or broad-scope mutations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback, verify with real client path.
- Host permission prompts are a floor, not the ceiling — confirm intent for irreversible actions even when allowed.

## On-Demand Domain Profiles

Load only when the condition matches. Do not load by default.

| Condition | Load |
|-----------|------|
| Third-party proxy, gateway, retry/loop/encoding suspect | `fp/provider-compatibility/SKILL.md` |
| Multi-agent ownership and verification knowledge | `fp/templates/multi-agent-review-protocol.md` |
| Remote/stateful target, OpenWrt, embedded, router | `fp/skills/live-system/SKILL.md` |
| Android kernel, GKI, boot image, fastboot/9008 flashing | `fp/skills/android-kernel/SKILL.md` |
| Unknown failure; diagnosis without fix | `fp/skills/debug-incident/SKILL.md` |
| Cross-session continuation, resume after compaction | `fp/skills/continuation/SKILL.md` |
| Vague/risky/large; requirements challenge needed | `fp/question-requirements/SKILL.md` |

## Evidence Basis

Experimental — not yet a default anywhere. First blind-eval round (2026-08-04, gpt-5.6-sol, 27 scenarios × 2 trials, same model, same run): v-host weighted 3.08 vs v-final 3.34 and v0 2.87 — **v-final stays the default**. v-host won debug (3.83 vs 3.78), evidence (3.67 vs 3.11), and provider (2.67 vs 2.44) but lost route (1.89 vs 3.11) and continuation (1.83 vs 2.56) with 6 blockers vs 2 — precisely the two most-compressed sections. Goal-fidelity scored 5.0 for every version (scenarios need hardening to discriminate). Next iteration: restore the full routing table and an explicit continuation pointer, keep the rest of the host-native ladder, then re-benchmark — only the new variant's 54 cells need to run; the same-model v0/v-final rows are cached by the model-keyed resume.

Round-2 iteration (v-host2, 2026-08-04, this file): restored the full routing table, added the continuation profile row, and added fail-closed no-replay resume language — targeting exactly the two traits v1 lost. Everything else unchanged from v1 (frozen at `benchmarks/version-snapshots/v-host-v1.md`).

Round-3 verdict (2026-08-05, 54-scenario hardened bank, dual judge gpt-5.6-sol + deepseek-v4-pro, content-bound blinding, 216 obs/version): v-final 4.05 > v0 4.03 > **v-host2 3.95** > v-host 3.73 (significantly below baseline, d=-0.33★). The v2 repairs recovered continuation (3.88, now best-in-class) and improved route (3.17 vs v1's 2.64) but route still trails mainline (3.48) — routing discipline is carried by the surrounding contract text, not the table alone. **Host-native slimming has now lost two clean rounds; mainline stays the default and this variant is deprioritized until a materially new hypothesis exists.**
