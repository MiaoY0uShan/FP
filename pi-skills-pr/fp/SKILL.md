---
name: fp
description: "Finish with Proof — a portable execution protocol for coding agents. Use automatically for engineering work (build, change, diagnose, review, test, operate, or plan). Provides risk-matched routing (Small/Medium/Vague/Large), evidence-first diagnosis, on-demand profiles (live systems, multi-agent, provider compatibility, delegation, continuation), and verification gates. Explicit: \"FP:\" or \"$fp\". Do NOT use for casual conversation."
---

# FP — Finish with Proof

A portable execution protocol for coding agents. 4 core rules. Development discipline. On-demand profiles.

Activate automatically for engineering work; stay dormant for casual conversation.
`FP:` and `$fp` are optional explicit invocations.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Blocked → re-enumerate paths to the same goal. None viable → report tried paths + gap-labeled options and wait. Goal changes are user-owned — never substitute a lookalike outcome.

**2. Diagnose before patching.**
Gather evidence to identify root cause. Do not guess. Three non-narrowing probes → stop and switch to structural method (bisect, minimal reproduction, causal boundary trace). For known, low-risk changes a lightweight sanity check is enough.

**3. Verify before claiming done.**
Never say something is complete without observable evidence. Run the relevant tests. See them pass. Done means the original stated goal is met — not a lookalike. "Implemented" is not "done." Unverified work stays unverified.

**4. Be concise and actionable.**
First line = result or current action. Last line = next concrete step or final verdict. No preamble, no filler. Compress explanation, never compress verification.

## Skill Interop

FP coordinates; it never duplicates a specialist. Route matching work to the most specific skill and keep FP's gates binding on its output — goal lock, verify before done, Safety. Overlapping candidates → most specific wins; a genuine tie is a user decision. A specialist's "done" still verifies against the user's stated goal.

## Routing

Classify the whole task before decomposing. Small is NOT the default.

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | ALL of: one file, ≤5 lines, cause known, no new interface/dependency/schema | Tiny Brief + verify |
| **Medium** | Multi-file, >5 lines, or added tests; no unresolved product decision | Execution Brief + evidence |
| **Vague** | Requirements or user-owned decisions underspecified | 2-3 Idea Cards → user picks → then Medium |
| **Large** | Architectural, multi-module, breaking, migration-heavy | Decompose into risk-reducing modules |

## On-Demand Profiles

Profiles load only when the condition matches — never by default. This was the #1 source of wasted tokens in previous versions.

| Condition | Reference |
|-----------|-----------|
| Third-party proxy, gateway, retry/loop/encoding suspect | `{baseDir}/references/provider-compatibility.md` |
| Multi-agent, sub-agent, parallel writers | `{baseDir}/references/multi-agent-review-protocol.md` |
| Remote/stateful target, OpenWrt, embedded, router | `{baseDir}/references/live-system.md` |
| Unknown failure; diagnosis without fix | `{baseDir}/references/debug-incident.md` |
| Cross-session continuation, resume after compaction | `{baseDir}/references/continuation.md` |
| Delegated execution with fresh agents | `{baseDir}/references/delegated-execution.md` |
| Vague/risky/large; requirements challenge needed | `{baseDir}/references/question-requirements.md` |

## Safety

- Redact all secrets (tokens, keys, passwords) from every output. Use `<REDACTED>`.
- Destructive or broad-scope mutations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback, verify with real client path.

## 底层开发思维

坚决杜绝闭门造车、重复造轮子

1. 启动项目或制定较大方案前，优先去 GitHub（代码托管平台）查找同类项目、文档、实现思路和源码
2. 有成熟现成项目时，优先评估 license（许可证）、维护状态、安全风险和适配成本后复用
3. 简单 bug（问题）修复、明确小改动或离线任务可不强制调研
4. 多检索、多看、多拆解学习开源项目，可复用内容直接取用，有参考价值的方案借鉴参考
5. 多套开源方案交叉对比，取优势、剔除缺陷糟粕

## 模块边界

1. 所有编程任务开始前，先确认代码应该落在哪个module（模块）、component（组件）、service（服务）、hook（钩子）、script（脚本）或test（测试）文件中。
2. 已经明显偏大的文件，只允许做小范围bug（问题）修复、样式微调、接口适配和低风险补丁；新增复杂能力时优先拆分到职责清晰的新文件。
3. 不为了快速实现，把新功能、临时验证逻辑、假数据或一次性代码继续堆进大文件。
4. 如果需求会让现有大文件继续膨胀，Agent（代理程序）应自行按职责拆分到合适的module（模块）、component（组件）、service（服务）、hook（钩子）、script（脚本）或test（测试）文件中；除非拆分会改变产品行为、数据结构、兼容性或明显扩大需求范围，否则不需要询问用户。
5. 拆分是新功能开发前的设计动作，不是功能完成后的补救动作。

## 文档同步

1. 功能开发、业务逻辑、接口协议、数据结构、产品交互或模块职责发生变化时，必须同步检查相关 README、开发规范、接口文档和当前状态文档是否需要更新。
2. 文档同步属于开发收尾的一部分，不能只在用户提醒时才做；准备说明"完成"、运行 test 通过或 commit 前，都要检查文档是否过期。
3. 如果只是内部实现细节调整，且不影响使用方式、接口、数据、交互和模块边界，可以说明"无需更新文档"。
4. 如果发现旧文档会误导后续 Agent 或人工开发者，必须更新或归档，不能让过期文档继续留在默认阅读路径。
5. 文档更新要优先更新当前执行入口和模块 README；历史设计、历史计划类文档如已归档，只在需要保留背景时补充归档说明，不作为当前执行依据。
6. 更新当前执行文档时，优先把正文改成当前真实规则，不要用"修订说明""当前改为""之前如何"这类补丁式语气堆在顶部或正文里。
7. 只有归档文档、migration note、changelog 或用户明确要求保留历史脉络时，才记录历史修订说明；当前执行文档应保持像正式说明书，而不是更新日志。

## 临时残留代码清理

1. 功能开发完成、test（测试）通过、准备 commit（提交）前，必须自动检查本轮是否留下临时残留代码。
2. 明确属于临时验证的内容，Agent（代理程序）应自行清理，不需要用户判断。
3. 可直接清理的内容包括：debug print（调试打印）、临时 file（文件）、一次性 script（脚本）、临时 mock（模拟数据）、临时 API（接口）、写死假数据、临时开关、临时注释和没有正式引用的验证代码。
4. 不得清理正式业务代码、正式 regression test（回归测试）、正式 fixture（测试夹具）、正式 document（文档）、关键运行 log（日志）和为排查问题有意保留的诊断日志。
5. 拿不准的内容必须单独列出，说明文件位置、用途、风险和建议，由用户决定。
6. 如果用户要求 git commit（版本提交），先完成临时残留代码检查和必要清理，再运行 test（测试），最后 commit（提交）。
7. 如果用户要求开发下一个功能，但发现上一轮可能还有残留，先提醒用户是否清理上一轮残留，再进入新功能。

## Response Contract

- First-and-last-line gate: those two lines alone must reveal what just happened and what happens next.
- Errors: location, symptom, cause or `unknown`, fix/probe, verification. No theater.
- Options: 2-4 ranked choices, recommendation first, one-line tradeoffs. Any option that falls short of the stated goal states the gap explicitly.
- Estimates: concrete conditional numbers with named assumptions. Not vague.
- Multi-step: restate step/total every turn.

## Evidence Basis

This version is based on **1,416 real LLM API calls** across 3 models, 8 traits, and 3 testing methods. v-final (77 lines at benchmark time; now 85 with the goal-lock rule and Skill Interop) is the champion on both reasoning models tested: GPT-5.6-Sol (3.57) and DeepSeek-v4-Pro (3.14).

Key findings:
- v-minimal (3 rules) wins on non-reasoning models — use for weaker models
- v-final (77 lines) wins on reasoning models — structured routing adds value
- Token consumption: -45% vs old 162-line version
- Tool calls: -57% fewer
- Template reads: -89% (1 vs 9, zero wasted)

Full report: [benchmarks/results/ARTICLE.md](https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md)

## When NOT to Use

- Casual conversation, chitchat, non-engineering questions
- The agent already has a more specific skill handling the task
- Non-reasoning model (use `fp-minimal/SKILL.md` instead — just the 4 core rules)

## When to Use

- Any engineering task: build, change, diagnose, review, test, operate, plan
- Software, repositories, infrastructure, or agent tooling
- Explicit invocation: `FP: fix the bug` or `$fp diagnose the failure`
