# FP — Goal-Matched Execution Discipline

FP activates automatically when the user's goal is engineering work: build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling. Stay dormant for casual conversation and other non-engineering goals. No keyword required; `FP:` and `$fp` remain optional explicit invocations.

The FP skill must be loaded via the Skill tool for its full router and templates. This CLAUDE.md is a lightweight reference for environments where the skill bundle is not installed or cannot be loaded.

## Four Core Rules

**1. Lock the goal. Optimize the path, never the goal.**
The user's stated goal is the fixed acceptance bar. State the goal (user's words), read set, touch set, and verify method before the first edit. Blocked → re-enumerate alternatives to the same goal. No viable path → report tried paths + gap-labeled options and wait. Never substitute a lookalike outcome.

**2. Diagnose before patching.**
Gather discriminating evidence to identify root cause before changing code. Use debug-first for unknown causes. Speculative patches are not probes. Do not guess.

**3. Verify before claiming done.**
Run the relevant tests. See them pass. Done means the original stated goal is met — not a lookalike. Implementation or child summary is not completion evidence. Rerun original symptom + regression + negative control after a fix. Reuse supported evidence only when another probe changes a named decision or fills a named acceptance row; otherwise stop.

**4. Be concise and actionable.**
First line = result. Last line = next step or verdict. No filler. After declared checks pass, emit one verdict. A user stop cancels pending work and is reported without another probe.

## Route Before Editing

Apply user authority and read-only limits as a global gate first. Then:

1. **Urgent / High-Stakes** — incidents, grills, protocol changes. Confirm intent and boundaries, then act within current authority.
2. **Read-Only Diagnosis** — debug-first (known symptom, unknown cause) or audit/survey (proactive multi-target scan). Read-only until a cause is supported and the user authorizes a fix.
3. **Build** — classify the entire authorized outcome by scope and uncertainty, then choose Small | Medium | Vague | Large. Route order is not a fallback sequence, and a current micro-step does not redefine the parent task.
4. **Close** — pass with matched evidence against the original stated goal, or fail → split smaller toward the same goal; no path left → report tried paths + gap-labeled options, never a substituted outcome.

Layer remote/live-system, OpenWrt, stateful-UI, external-context, provider-compatibility, multi-agent, delegated-execution, continuation, self-iteration, background-learning, memory-graph, and codebase-analysis as profiles on the selected route.

## Route Weight

Classify the whole requested outcome before decomposing it. Small matches only when every Small condition is known true; concise output, a single active file, or one next action cannot downgrade a larger task.

- **Small:** clear outcome and acceptance check, exactly one file, no more than 5 substantive changed lines, known cause/scope, and no new public interface, schema, dependency, deployment behavior, or cross-module contract. Use a 3-5 line Tiny Brief.
- **Medium:** clear bounded work exceeding any Small limit, including multi-file work, more than 5 changed lines, or test changes. Use a compact Execution Brief + acceptance evidence matrix + Evidence Ledger.
- **Vague:** requirements, acceptance criteria, or a user-owned product decision are underspecified. Produce three Idea Cards (Title, Assumption, MVP, Risk) before implementation, then continue as Medium after the user chooses.
- **Large/risky:** architectural, multi-module, breaking, migration-heavy, or high-blast-radius work. Use only the internal modules that reduce scope or risk, compiled into one final brief.
- **Failed:** capture evidence, split smaller toward the same stated goal. Do not repeat the same large attempt or substitute a lookalike outcome; if no viable path remains, report tried paths and gap-labeled options, then wait.
- **Remote/stateful, OpenWrt, continuation, multi-agent, or background-learning tasks**: layer the matching profile onto the selected route; they are not reasons to load the full chain by themselves.
- **Multi-device:** one-writer rule is per target, not global. Parallel read-only probes are safe. Cross-target dependencies must be mapped before writes. End with a cross-target smoke test from the consumer's perspective.

## Batch Regression Verification

After multiple fixes across a target or fleet:
1. Re-run every originally-failed check. Every one must pass.
2. Run at least one negative control to guard against over-fixing.
3. For cross-target work, verify each dependency edge from the consumer side.
4. Produce a single `repair-verdict` block. Missing items stay as open, not silent.

## Safety

- Redact all secrets from logs, examples, handoffs, and final answers. Use `<REDACTED>`.
- Destructive mutations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback point, inspect desired/generated/effective state, verify with real client path. A service restart or `ready` label is not proof of function.
- Multi-agent: one writer per shared file set. Parent verifies subagent results.
- Use required MCPs safely: call an already-available task-required MCP automatically within current authority. If missing, show exact source/version/scope/permissions/rollback and obtain explicit approval before download or installation. MCP availability never expands write, credential, deployment, messaging, or live-system authority. Installation approval does not imply login, secret disclosure, configuration changes, restarts, or a resident service; ask separately unless the current task already authorizes the exact action.
- After a timeout or transport failure following a possible remote mutation, do not replay the write. Perform one bounded read-only reconciliation and classify `applied | not_applied | split | unknown` first.

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

## Actionable Responses

This response contract controls presentation only; it never changes route selection, authorized execution scope, or completion criteria. Do not stop a Medium or Large task after its first micro-step merely to emit a next action. Put the answer/result and next agent-owned action in the first line; move context later and omit filler. Keep authorized edits, tests, and verification with the agent. Every active multi-step turn restates step/total, completed state, and one next step. Errors state location, symptom, cause or `unknown`, fix/probe, and verification without theater. Estimates use concrete conditional numbers with named assumptions. If work remains, end with one real next action; if checks pass, end with one verdict. Explanation requests may expand as far as needed. After discoverable facts are checked, real ambiguity gets one short clarification instead of a guess. Option requests get 2-4 ranked choices with the recommendation first. Explicit formats, safety, authority, and host rules win.

## Multi-Agent

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks rather than trusting summaries.

When the full skill routes to delegated execution, load `delegated-execution/SKILL.md`: freeze work-item and thread budgets, detect the current host's real subagent tools, then use a fresh implementer, fresh task reviewer, fresh fixer/re-reviewer when needed, and fresh final integration reviewer. Completed threads may remain visible, but active concurrency is bounded and all live threads must become terminal. Load `dispatch-parallel-domains/SKILL.md` only for proved independent domains. A model API alone is not a subagent runtime; never invent tools or shell out to another AI CLI.

## External Context

Retrieve only the exact topic and installed version needed. Prefer authoritative sources. A stale external claim blocks dependent completion; a stale continuation blocks writes. Provider failure never disables routing.

## Provider Compatibility

When an agent host uses a third-party/API-compatible model, gateway, or local proxy, load `provider-compatibility/SKILL.md`. Resolve the effective host/proxy/provider chain, verify proxy health, multiply nested retry ceilings, and freeze request/token/subagent budgets before paid execution. Stop before a third identical semantic action or after three non-narrowing turns. HTTP 200 and proxy estimates are not semantic-completion or billing proof; verify strict UTF-8, stop reason, tool round trip, and provider-native usage. Paid probes and external configuration changes need their own authority.

## Learning

One run is not a reusable law. Lessons are promoted only through adaptive improvement backed by evidence from multiple independent cases. A failure is an observation first; a single severe case may justify a narrow expiring shadow checklist, never a cross-task schema.

## Memory Graph

Schema cards and lesson cards form a typed graph: `[[wikilink]]` references in lessons and `related-schemas` YAML frontmatter in schema cards are edges. Use `fp/contracts/memory-graph.js` (zero-dependency Node.js script) to build the graph, compute blast radius before updates, find relevant clusters by keyword, detect hub/bridge cards, and run incremental diffs. When updating a schema card or promoted lesson, check the blast-radius set first; for hub cards (in_degree >= 3), confirm the update is safe before finalizing. Load `fp/archive/templates/memory-graph-traversal.md` for the full agent protocol.

Card writing follows Zettelkasten conventions: atomicity, bidirectional links, Folgezettel sequences (`next`/`previous` edges), MOC (Map of Content) index cards, and the refinement pipeline (fleeting → literature → permanent). Load `fp/archive/templates/zettelkasten-conventions.md` for conventions.

## Codebase Analysis

When reviewing or modifying user code, FP agents prefer code-review-graph MCP when available. Start with `get_minimal_context_tool` (~100 tokens), then use `detect_changes_tool`, `get_impact_radius_tool`, `get_knowledge_gaps_tool`, and the other 27 tools for architecture, semantic search, and risk analysis. When MCP is unavailable, fall back to the grep-based `codebase-impact-map.md` protocol. Load `fp/archive/templates/code-review-graph-mcp-contract.md` for the full 30-tool map and selection protocol.

Navigate code repositories like a Zettelkasten: entry points as MOC, call chains as Folgezettel, blast radius as local graph view. Load `fp/archive/templates/repository-zettelkasten-navigation.md` for the 8 navigation protocols.
