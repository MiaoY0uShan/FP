<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — Finish with Proof" width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>4 条规则。开发纪律。让你的 agent 用证据收尾，而不是凭感觉。</strong></p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/stargazers"><img src="https://img.shields.io/github/stars/MiaoY0uShan/FP?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml"><img src="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/MiaoY0uShan/FP/releases"><img src="https://img.shields.io/github/v/release/MiaoY0uShan/FP" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/releases/latest"><strong>下载</strong></a> ·
  <a href="#四条规则">4 条规则</a> ·
  <a href="INSTALL.md">安装</a> ·
  <a href="README.md">English</a> ·
  <a href="benchmarks/results/ARTICLE.md">基准测试</a>
</p>

---

每个编码 agent 都能写代码。几乎没有一个能证明代码可用。

FP 是一套可移植的协议，让任何编码 agent 用证据收尾——不是凭感觉。它适用于 Claude Code、Codex、Gemini CLI、Cursor、Windsurf、Copilot 等十余种工具。不需要框架，不需要 SDK，只需要一个文件。

---

## 四条规则

**1. 锁定目标。** 你说的目标就是验收线。agent 优化路径，绝不改目标。走不通？它会汇报试过什么、还有什么选择——绝不偷偷换一个更容易的。

**2. 诊断先于修补。** 先证据，先根因。不猜。

**3. 验证先于声称完成。** 跑测试，看到通过。"实现了" ≠ "完成了"。

**4. 简洁且可执行。** 第一行 = 结果。最后一行 = 下一步。中间没有废话。

> 就这四条。其余所有东西按需加载——只在任务需要时才出现。

---

## 没有 FP 的时候

```
你：修一下那个间歇性失败的认证测试。
Agent：我加了个超时，看起来修好了。
你：……CI 又挂了。
```

## 有 FP 的时候

```
你：修一下那个间歇性失败的认证测试。
Agent：根因：token 刷新和会话检查之间有竞态。
       修复：刷新前加锁。
       证据：50/50 次全部通过。原始症状 + 回归 + 负控制已验证。
       完成。
```

---

## 数字说话

我们不只是做了这个协议，我们测量了它。**4,100+ 次真实 LLM API 调用**，跨 6 个 prompt 变体、13 个评估维度、63 道盲评场景、3 种测试方法——单轮盲评、多模型交叉验证、以及带真实工具调用的多轮 E2E。

### 盲评 — 63 场景，双评审

> 每版本 252 个观测值。两个独立评审（GPT-5.6-Sol + DeepSeek-v4-Pro）。评审一致性：|Δ| = 0.56，Pearson r = 0.71。

| 排名 | 版本 | 加权分 | Blockers | vs 基线 |
|------|------|--------|----------|---------|
| 🥇 | **v-final (FP)** | **4.12** | **0** | +0.03 |
| 🥈 | v0 (无 FP) | 4.09 | 2 | 基线 |

FP 最突出的优势：**路由精度 +0.60**（超过裸基线）。agent 为不同任务选择恰当力度的响应——不过度仪式化，也不缺乏验证。

### 拯救我们的发现

我们测试了 6 个变体。两个教训改变了一切：

**Prompt 干扰是真实的。** 向已平衡的 85 行 prompt 添加指令会*降低*性能。我们证明了两次——编程纪律段落（+4 行）和测试优先句子（+1 行）都让路由分回退 0.23–0.30 分。85 行就是天花板。新能力只能住在按需模块里。

**模拟会骗人。** 我们的模拟预测 "v7 Adaptive-Plus" 得 4.73 分。真实盲评结果：它是最差的。模拟把每条指令当独立线性贡献，真实模型不是这样工作的。

### 多轮 E2E — 真实工具调用

| 指标 | 旧版 (162 行) | FP (85 行) | 变化 |
|------|---------------|------------|------|
| Token 消耗 | 19,620 | 10,665 | **−45%** |
| 工具调用 | 14 | 6 | **−57%** |
| 模板读取 | 9 (3 浪费) | 1 (0 浪费) | **−89%** |

带真实文件读写、测试执行、确定性验收谓词的行为级评测。agent 不只是"说"修了 bug——它真的修了，我们验证修复生效。

---

## 安装

```powershell
# Windows
.\INSTALL-FP.cmd -Verify

# macOS / Linux
sh ./INSTALL-FP.sh --verify
```

或者直接把 [`fp-copy-paste.md`](fp-copy-paste.md) 复制进你的 agent 系统 prompt。

就这样。FP 在工程任务中自动激活，闲聊时保持沉默。

[完整安装矩阵 →](INSTALL.md)

---

## 到处都能用

**Claude Code · Codex · Gemini CLI · Pi · GitHub Copilot · Cursor · Windsurf · Cline · Roo Code · OpenCode · Kiro · Aider**

一个文件。所有 agent。

安装了其他 skill 时，FP 把任务路由给最匹配的专家，同时让自己的验证门控对结果保持约束力。调度但不重复。

---

## 协议

| 路由 | 条件 | 行为 |
|------|------|------|
| **Small** | 一个文件，≤5 行，原因已知 | 简要说明 → 验证 → 完成 |
| **Medium** | 多文件或新增测试 | 执行说明 → 证据 → 完成 |
| **Vague** | 需求不明确，或用户说"问我问题" | fp cool → Medium |
| **Large** | 架构或迁移 | 拆解 → 按风险递减交付模块 |

Small 不是默认。多文件 = Medium 起步。

### 按需 Profiles

| 触发条件 | Profile |
|----------|---------|
| 重试 / 编码问题 | Provider 兼容性 |
| 多 agent / 并行写入 | 多 agent 协作 |
| 远程 / 有状态目标 | 线上系统操作 |
| 未知故障 | Debug 事件 |
| 跨会话任务 | 续接 |
| 委托子任务 | 委托执行 |
| 需求模糊 / 高风险 | 需求确认 |
| 代码库分析 | 代码库分析 (tree-sitter / 向量) |

Profiles **仅在触发时加载**。修一个简单 bug 不会加载任何额外文件。这是历代版本 token 浪费的第一大来源。

---

## 开发纪律

### 底层开发思维

坚决杜绝闭门造车、重复造轮子

1. 启动项目或制定较大方案前，优先去 GitHub（代码托管平台）查找同类项目、文档、实现思路和源码
2. 有成熟现成项目时，优先评估 license（许可证）、维护状态、安全风险和适配成本后复用
3. 简单 bug（问题）修复、明确小改动或离线任务可不强制调研
4. 多检索、多看、多拆解学习开源项目，可复用内容直接取用，有参考价值的方案借鉴参考
5. 多套开源方案交叉对比，取优势、剔除缺陷糟粕

### 模块边界

1. 所有编程任务开始前，先确认代码应该落在哪个module（模块）、component（组件）、service（服务）、hook（钩子）、script（脚本）或test（测试）文件中。
2. 已经明显偏大的文件，只允许做小范围bug（问题）修复、样式微调、接口适配和低风险补丁；新增复杂能力时优先拆分到职责清晰的新文件。
3. 不为了快速实现，把新功能、临时验证逻辑、假数据或一次性代码继续堆进大文件。
4. 如果需求会让现有大文件继续膨胀，Agent（代理程序）应自行按职责拆分到合适的module（模块）、component（组件）、service（服务）、hook（钩子）、script（脚本）或test（测试）文件中；除非拆分会改变产品行为、数据结构、兼容性或明显扩大需求范围，否则不需要询问用户。
5. 拆分是新功能开发前的设计动作，不是功能完成后的补救动作。

### 文档同步

1. 功能开发、业务逻辑、接口协议、数据结构、产品交互或模块职责发生变化时，必须同步检查相关 README、开发规范、接口文档和当前状态文档是否需要更新。
2. 文档同步属于开发收尾的一部分，不能只在用户提醒时才做；准备说明"完成"、运行 test 通过或 commit 前，都要检查文档是否过期。
3. 如果只是内部实现细节调整，且不影响使用方式、接口、数据、交互和模块边界，可以说明"无需更新文档"。
4. 如果发现旧文档会误导后续 Agent 或人工开发者，必须更新或归档，不能让过期文档继续留在默认阅读路径。
5. 文档更新要优先更新当前执行入口和模块 README；历史设计、历史计划类文档如已归档，只在需要保留背景时补充归档说明，不作为当前执行依据。
6. 更新当前执行文档时，优先把正文改成当前真实规则，不要用"修订说明""当前改为""之前如何"这类补丁式语气堆在顶部或正文里。
7. 只有归档文档、migration note、changelog 或用户明确要求保留历史脉络时，才记录历史修订说明；当前执行文档应保持像正式说明书，而不是更新日志。

### 临时残留代码清理

1. 功能开发完成、test（测试）通过、准备 commit（提交）前，必须自动检查本轮是否留下临时残留代码。
2. 明确属于临时验证的内容，Agent（代理程序）应自行清理，不需要用户判断。
3. 可直接清理的内容包括：debug print（调试打印）、临时 file（文件）、一次性 script（脚本）、临时 mock（模拟数据）、临时 API（接口）、写死假数据、临时开关、临时注释和没有正式引用的验证代码。
4. 不得清理正式业务代码、正式 regression test（回归测试）、正式 fixture（测试夹具）、正式 document（文档）、关键运行 log（日志）和为排查问题有意保留的诊断日志。
5. 拿不准的内容必须单独列出，说明文件位置、用途、风险和建议，由用户决定。
6. 如果用户要求 git commit（版本提交），先完成临时残留代码检查和必要清理，再运行 test（测试），最后 commit（提交）。
7. 如果用户要求开发下一个功能，但发现上一轮可能还有残留，先提醒用户是否清理上一轮残留，再进入新功能。

---

## FAQ

**每个任务都会变成仪式吗？** 不。Small 任务只需一句话的 brief——说明上下文，然后修复并验证。Profiles 按需加载。修个简单 bug 读零个 FP 模板。

**非推理模型？** 用 [`fp-minimal/`](fp-minimal/SKILL.md)——只有四条规则，没有路由。基准数据证明，在弱模型上它比完整协议更有效。

**为什么核心超过了 85 行？** v0.5.0 的 benchmark 证明 85 行对四条核心规则 + 路由是最优的。v0.5.2 将开发纪律（调研优先、模块边界、文档同步、临时代码清理）直接加入核心——这是用户驱动的决策，优先保证纪律始终生效，而非守住 benchmark 验证的行数上限。

**子 agent 能宣称完成吗？** 不能。父级负责集成并重跑关键检查。

---

## 开发

```bash
node --test test/*.test.js                           # 契约测试
node scripts/run-response-evals.mjs validate         # 评估验证
node benchmarks/real-eval-v2.mjs all                 # 完整盲评
node benchmarks/multi-turn-harness-v2.mjs            # 多轮 E2E
```

---

<p align="center"><strong>没有证据，就不算完成。</strong></p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">中文</a>
  <br>
  <a href="LICENSE">MIT License</a>
</p>
