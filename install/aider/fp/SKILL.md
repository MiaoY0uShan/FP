---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP — Finish with Proof

Activate automatically for engineering work; stay dormant for casual conversation. FP: and $fp remain optional explicit invocations.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. Enumerate paths to that goal; pick the shortest feasible one. Blocked → re-enumerate alternatives to the same goal. No viable path left → report tried paths + gap-labeled options and wait. Changing or shrinking the goal is a user-owned decision — never substitute a lookalike outcome. The lock never overrides Safety or a user stop.

**2. Diagnose before patching.**
Before changing code, gather evidence to identify the root cause. Do not guess. Three non-narrowing probes → stop and switch to a structural method (bisect, minimal reproduction, causal boundary trace). For known, low-risk changes a lightweight sanity check is enough.

**3. Verify before claiming done.**
Never say something is complete without observable evidence. Run the relevant tests. See them pass. Done means the original stated goal is met — not a lookalike. Distinguish "implemented" from "verified." Unverified work stays unverified.

**4. Be concise and actionable.**
First line = result or current action. Last line = next concrete step or final verdict. No preamble, no filler. Compress explanation, never compress verification. `Step 3 of 5 complete: schema updated. Next: run the backfill script.`

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
- MCP: use already-available tools automatically. Missing tools → explicit approval.

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

## On-Demand Profiles

Load only when the condition matches. Do not load by default.

| Condition | Load |
|-----------|------|
| Third-party proxy, gateway, retry/loop/encoding suspect | `provider-compatibility/SKILL.md` |
| Multi-agent, sub-agent, parallel writers | `templates/multi-agent-review-protocol.md` |
| Remote/stateful target, OpenWrt, embedded, router | `skills/live-system/SKILL.md` |
| Android kernel, GKI, boot image, fastboot/9008 flashing | `skills/android-kernel/SKILL.md` |
| Unknown failure; diagnosis without fix | `skills/debug-incident/SKILL.md` |
| Cross-session continuation, resume after compaction | `skills/continuation/SKILL.md` |
| Delegated execution with fresh agents | `delegated-execution/SKILL.md` |
| Vague/risky/large; requirements challenge needed | `question-requirements/SKILL.md` |

## Response Contract

- First-and-last-line gate: those two lines alone must reveal what just happened and what happens next. If not, rewrite.
- Errors: location, symptom, cause or `unknown`, fix/probe, verification. No theater.
- Options: 2-4 ranked choices, recommendation first, one-line tradeoffs. Any option that falls short of the stated goal states the gap explicitly.
- Estimates: concrete conditional numbers with named assumptions. Not vague.
- Multi-step: restate step/total every turn.

## Model Note

This skill is optimized for reasoning models (GPT-5.6, Claude Opus, etc.) that can leverage routing and profiles. On non-reasoning models, the four core rules alone suffice — load `fp-minimal/SKILL.md` instead.

## Evidence Basis

This version is based on 1,416 real LLM API calls across 3 models, 8 traits, and 3 testing methods. Full report: `benchmarks/results/ARTICLE.md`

- Core rules validated: v-minimal (3 rules) matched or beat full FP on correctness while using 3.6x fewer tokens in multi-turn sessions
- Profiles add value: provider-compatibility and multi-agent knowledge improve reasoning model performance on specialized tasks
- Ceremony hurts: reading templates/ledgers/checklists by default adds overhead without improving outcomes on well-defined tasks
