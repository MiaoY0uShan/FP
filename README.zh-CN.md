<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — Finish with Proof" width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>一个文件。你的编码 agent 不再猜测，开始证明。</strong></p>

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

你的编码 agent 说"完成了"。你信了。CI 挂了。你去查，发现 agent 在猜。它从没跑测试。它从没查根因。它只是……宣布了胜利。

FP 让这件事变得不可能。把一个文件放进任何编码 agent。四条规则。agent 证明它的工作——否则它没资格说"完成"。

---

## FP 到底解决了什么

我们在 **63 个真实场景**中对 FP 做了盲测，双独立评审（GPT-5.6-Sol + DeepSeek-v4-Pro）。数据如下：

**零严重故障。** FP 的 blocker 数为 0。同一个 agent 不用 FP 有 3 个 blocker。这就是正常上线和半夜被叫醒的区别。

**agent 选对了方法。** 路由精度——判断什么时候该快速修、什么时候该写完整方案——提升了 **+11%**（3.32 vs 2.99）。这是 FP 最大的贡献：agent 不再对小任务过度工程化，也不再对复杂任务敷衍了事。

**目标忠实度：最优。** 4.61 / 5。当 agent 碰壁时，它汇报试过什么、还剩什么。它绝不悄悄换一个更容易的目标然后说完成了。

<details>
<summary><strong>完整排名 — 8 个版本，每版 378 个观测值，双评审</strong></summary>

> 评审一致性：|Δ| = 0.56，Pearson r = 0.71

| 排名 | 版本 | 加权分 | Blockers | vs 基线 |
|------|------|--------|----------|---------|
| 🥇 | **v-final (FP)** | **4.12** | **0** | +0.03 |
| 🥇 | v-coding | 4.12 | 1 | -0.01 |
| 🥉 | v0 (无 FP) | 4.10 | 3 | 基线 |
| 4 | v-pre053 | 4.08 | 2 | -0.03 |
| 5 | v-tf2 | 4.07 | 0 | -0.01 |
| 6 | v-core | 4.05 | 2 | -0.04 |
| 7 | v-host2 | 3.93 | 0 | -0.13 |
| 8 | v-host | 3.57 | 0 | -0.49 |

各维度对比：

| 维度 | FP | 无 FP | 差值 |
|------|-----|-------|------|
| 路由精度 | 3.32 | 2.99 | **+0.33** |
| 目标忠实度 | 4.61 | 4.58 | +0.03 |
| 诊断优先 | 4.37 | 4.42 | -0.05 |
| 证据 | 4.36 | 4.39 | -0.03 |
| 简洁性 | 4.16 | 4.26 | -0.10 |
| 多 agent 协作 | 3.71 | 3.52 | **+0.19** |
| 安全性 | 4.89 | 4.83 | +0.06 |

4,100+ 次真实 LLM API 调用。13 个评估维度。3 种测试方法。完整方法论：[`benchmarks/results/ARTICLE.md`](benchmarks/results/ARTICLE.md)。可复现：[`benchmarks/README.md`](benchmarks/README.md)。

</details>

---

## 没有 FP vs. 有 FP

```
你：修一下那个间歇性失败的认证测试。
Agent：我加了个超时，看起来修好了。
你：……CI 又挂了。
```

```
你：修一下那个间歇性失败的认证测试。
Agent：根因：token 刷新和会话检查之间有竞态。
       修复：刷新前加锁。
       证据：50/50 次全部通过。原始症状 + 回归 + 负控制已验证。
       完成。
```

---

## 四条规则

这就是整个产品。其余所有东西按需加载。

**1. 锁定目标。** 你说的目标就是验收线。agent 优化路径，绝不改目标。走不通？它汇报试过什么、还有什么选择——绝不偷偷换一个更容易的。

**2. 诊断先于修补。** 先证据，先根因。不猜。

**3. 验证先于声称完成。** 跑测试，看到通过。"实现了" ≠ "完成了"。

**4. 简洁且可执行。** 第一行 = 结果。最后一行 = 下一步。中间没有废话。

---

## 安装

```powershell
# Windows
.\INSTALL-FP.cmd -Verify

# macOS / Linux
sh ./INSTALL-FP.sh --verify
```

或者直接把 [`fp-copy-paste.md`](fp-copy-paste.md) 复制进你的 agent 系统 prompt。就这样。

FP 在工程任务中自动激活，闲聊时保持沉默。

[完整安装矩阵 →](INSTALL.md)

---

## 到处都能用

**Claude Code · Codex · Gemini CLI · Pi · GitHub Copilot · Cursor · Windsurf · Cline · Roo Code · OpenCode · Kiro · Aider**

一个文件。所有 agent。安装了其他 skill 时，FP 把任务路由给最匹配的专家，同时让自己的验证门控对结果保持约束力。

---

## 你得到什么

### 路由

agent 先分类任务，再碰代码。这是 FP 价值最高的维度（比基线高 +11%）。

| 路由 | 条件 | 行为 |
|------|------|------|
| **Small** | 一个文件，≤5 行，原因已知 | 简要说明 → 验证 → 完成 |
| **Medium** | 多文件或新增测试 | 执行方案 → 证据 → 完成 |
| **Vague** | 需求不明确，或用户说"问我问题" | fp cool → Medium |
| **Large** | 架构或迁移 | 拆解 → 按风险递减交付模块 |

Small 不是默认。多文件 = Medium 起步。

### 按需 Profiles

默认零开销。只在触发时加载。

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

### 开发纪律

FP 附带五个纪律模块——默认全部启用。每个独立。不适合的直接删。

**调研优先（底层开发思维）** — 写代码前先搜 GitHub。复用 > 参考 > 从头造。多套开源方案交叉对比。

**模块边界（模块边界）** — 写代码前确认目标文件。别把新功能继续堆进大文件。拆分是开发前的设计动作，不是开发后的补救。

**文档同步（文档同步）** — 文档同步是开发收尾的一部分，不是事后想起来才做的。说"完成"之前检查文档。把当前文档改成当前规则——别堆修订说明。

**提交前清理（临时残留代码清理）** — 提交前自动检查临时代码。debug print、临时文件、一次性脚本 → 清掉。正式业务代码、回归测试 → 绝不碰。

**四条铁律（四条铁律）** — "如果是第一次写，会怎么写"是默认立场，不是绝对禁令。根因优先（原则）。代码自解释（原则）。不留残渣（原则）。部署一致（硬规则——无例外）。偏离需要明确理由，不能无声滑过。

> **想要更轻量？** 非推理模型用 [`fp-minimal/`](fp-minimal/SKILL.md)——只有四条规则，没有路由。或者用 [`fp/presets/core.md`](fp/presets/core.md) 只要路由不要纪律。默认安装给你一切；不需要的删掉就行。

---

## 改变我们方法的发现

我们测试了 8 个变体。两个发现塑造了产品：

**原则胜过命令。** 第一版用的是绝对语气——"绝不打补丁""敢于重写"。我们测量了。温和版本（"默认走根因，偏离时说明理由"）得 **4.12 分，0 个 blocker**。绝对版本得 **4.08 分，2 个 blocker**。模型执行原则比执行命令更有判断力。

**Prompt 干扰是真实的。** 向已平衡的 prompt 添加指令会*降低*性能。我们证明了两次——编程纪律段落（+4 行）和测试优先句子（+1 行）都让路由分回退 0.23–0.30 分。这就是为什么 FP 按需加载 profile，而不是把所有东西塞进一个文件。

---

## FAQ

**FP 会增加仪式感吗？** 不。修一个简单 bug 不加载任何 FP 模板。Small 任务只需一句话的 brief，然后修复并验证。Profiles 按需加载——历代版本 token 浪费的第一大来源就是加载任务不需要的东西。FP 解决了这个问题。

**我的模型不是 GPT-5.6。** 非推理模型用 [`fp-minimal/`](fp-minimal/SKILL.md)。基准数据证明它在弱模型上优于完整协议。

**子 agent 能宣称完成吗？** 不能。父级负责集成并重跑关键检查。

**如何复现基准测试？** 设置 `FP_API_KEY`，运行 `node benchmarks/real-eval-v2.mjs all`。固定参数、双评审盲评、确定性场景。完整文档：[`benchmarks/README.md`](benchmarks/README.md)。

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
