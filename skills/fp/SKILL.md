---
name: fp
description: "Use automatically for engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling). Do not use for casual conversation. FP provides risk-matched routing, evidence-first diagnosis, on-demand profiles, and verification gates. Explicit invoke: \"FP:\" or \"$fp\"."
---

# FP — Finish with Proof

Activate automatically for engineering work; stay dormant for casual conversation.
`FP:` and `$fp` remain optional explicit invocations.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Blocked → re-enumerate paths to the same goal. None viable → report tried paths + gap-labeled options and wait. Goal changes are user-owned — never substitute a lookalike outcome.

**2. Diagnose before patching.**
Gather evidence to identify root cause. Do not guess. Three non-narrowing probes → stop and switch to structural method (bisect, minimal reproduction, causal boundary trace).

**3. Verify before claiming done.**
Never say something is complete without observable evidence. Run the relevant tests. See them pass. "Implemented" ≠ "done." Done = the original stated goal met, not a lookalike.

**4. Be concise and actionable.**
First line = result or current action. Last line = next concrete step or final verdict. No preamble, no filler. Compress explanation, never compress verification.

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

## 四条铁律

改代码前先想"如果这是第一次写，会怎么写"——这是默认立场，不是绝对禁令。

1. **不打补丁**（原则）——默认回到根因解决。重写优于叠补丁，但当影响面、时间约束或依赖方契约使重写代价远超收益时，局部修补需标注原因和清理计划
2. **代码自解释**（原则）——命名表达"做什么"，注释只留"为什么"和业务规则。注释掉的代码块视为残渣
3. **不留残渣**（原则）——无备份、无遗留文件、无死代码。发现中间态优先清理；不确定时标注而非沉默保留
4. **部署一致**（硬规则）——源码与部署产物 hash 完全一致，无例外

这四条的核心不是"绝对禁止"，而是"默认立场"——偏离时需要明确理由，不能无声地滑过去。
「统一管道」「单一真源」都是它的推论：同一规则只定义一处，状态变更走同一个守卫。
它是纠错指南：遇到 bug 顺着管线找根因，而不是在某个路由里特判。
它是质量刹车：拦住"先凑合用"的冲动，但不拦住"理由充分的务实选择"。
每行代码写成最终形态——越迭代越干净。

## On-Demand Profiles

Load only when the condition matches. Do NOT load by default.

| Condition | Load |
|-----------|------|
| Third-party proxy, gateway, retry/loop/encoding suspect | Reference: `{baseDir}/references/provider-compatibility.md` |
| Multi-agent, sub-agent, parallel writers | Reference: `{baseDir}/references/multi-agent-review-protocol.md` |
| Remote/stateful target, OpenWrt, embedded, router | Reference: `{baseDir}/references/live-system.md` |
| Unknown failure; diagnosis without fix | Reference: `{baseDir}/references/debug-incident.md` |
| Cross-session continuation, resume after compaction | Reference: `{baseDir}/references/continuation.md` |
| Delegated execution with fresh agents | Reference: `{baseDir}/references/delegated-execution.md` |
| Vague/risky/large; requirements challenge needed | Reference: `{baseDir}/references/question-requirements.md` |

## Response Contract

- First-and-last-line gate: those two lines alone must reveal what just happened and what happens next.
- Errors: location, symptom, cause or `unknown`, fix/probe, verification. No theater.
- Options: 2-4 ranked choices, recommendation first, one-line tradeoffs. Any option that falls short of the stated goal states the gap explicitly.
- Estimates: concrete conditional numbers with named assumptions. Not vague.
- Multi-step: restate step/total every turn.

## Model Note

This skill is optimized for reasoning models (GPT-5.6, Claude Opus, DeepSeek-v4-Pro, etc.). On non-reasoning models, use `fp-minimal/SKILL.md` — just the four core rules.

## When to Use

- Any engineering task: build, change, diagnose, review, test, operate, plan
- Software, repositories, infrastructure, or agent tooling
- Explicit: `FP: <task>` or `$fp <task>`

## When NOT to Use

- Casual conversation, chitchat, non-engineering questions
- Already handled by a more specific skill
