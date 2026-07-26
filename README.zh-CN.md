<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — 用证据完成。按风险路由，给工作设边界，用验证收尾。" width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>让编码 agent 用证据收尾，而不是凭感觉宣布完成。</strong></p>

<p align="center">
  一套可移植的执行协议。77 行。3 条核心规则。按需加载 profiles。
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/stargazers"><img src="https://img.shields.io/github/stars/MiaoY0uShan/FP?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml"><img src="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/MiaoY0uShan/FP/releases"><img src="https://img.shields.io/github/v/release/MiaoY0uShan/FP" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/releases/latest"><strong>下载</strong></a> ·
  <a href="#三条规则">3 条规则</a> ·
  <a href="INSTALL.md">安装</a> ·
  <a href="README.md">English</a> ·
  <a href="benchmarks/results/ARTICLE.md">基准测试</a>
</p>

---

**没有证据，就不算完成。** FP 在工程任务中自动激活，在闲聊时保持休眠。三条规则，按需 profiles，零仪式冗余。

---

## 三条规则

**1. 诊断先于修补。** 收集证据，找到根因。不要猜。

**2. 验证先于声称完成。** 跑测试，看到通过。"实现了"不等于"完成了"。

**3. 简洁且可执行。** 第一行 = 结果。最后一行 = 下一步或最终裁决。没有废话。

复杂场景提供按需 profiles：线上系统、多 agent 协作、provider 兼容性、委托执行、跨会话续接等。只在触发条件匹配时加载——不是默认加载。

> **非推理模型？** 用 [`fp-minimal/`](fp-minimal/SKILL.md)——只有三条规则，没有路由，没有 profiles。

---

## 基于证据的设计 (v0.5.0)

此版本通过 **1,416 次真实 LLM API 调用**优化，跨 3 个模型、8 个特质、3 种测试方法。每个设计决策都有基准数据支撑。

### 跨模型盲评

| 模型 | 🥇 冠军 | 分数 | 🥈 | 分数 | 关键洞察 |
|------|---------|------|------|------|----------|
| gpt-5.3-codex-spark (非推理) | v-minimal | **3.08** | v0 | 3.01 | 弱模型需要简单指令 |
| gpt-5.6-sol (推理) | v-final | **3.57** | v0 | 3.49 | 推理模型能利用结构化知识 |
| deepseek-v4-pro (推理) | v-final | **3.14** | v0 | 2.97 | DeepSeek 更需要结构 (v-minimal: 2.46, 7 blockers) |

**v-final (77 行) 在两个推理模型上都是冠军。v-minimal (3 条规则) 在非推理模型上胜出。v2 Concise-Max (牺牲安全换速度) 永远最差。**

### E2E 多轮测试（真实工具调用）

| 指标 | 旧版 (162 行) | 新版 (77 行) | 改善 |
|------|-------------|------------|------|
| Token 消耗 | 19,620 | 10,665 | **-45%** |
| 工具调用 | 14 | 6 | -57% |
| FP 模板读取 | 9 (3 个浪费) | 1 (0 个浪费) | **-89%** |
| Profile 加载 | 乱加载 | 按需触发 ✅ | — |

### 模板：35 → 7

28 个模板从未被任何 on-demand profile 引用。它们是死代码——归档，不删除。多轮测试证明旧版 agent 默认读取这些模板纯属浪费 token。

### 模拟 vs 现实

我们的模拟预测 v7 Adaptive-Plus 以 4.73 胜出。真实盲评显示相反——所有"优化"版本由于 **prompt 干扰效应**表现比 baseline 更差：向已平衡的系统提示添加指令会降低性能。模拟无法建模这一点，因为它把每条指令当作独立的线性贡献。

完整方法论：[`benchmarks/results/ARTICLE.md`](benchmarks/results/ARTICLE.md)

---

## 快速开始

```text
修复那个间歇性失败的身份验证测试。
```

没有 FP：加个超时 → 跑一次 → "看起来修好了"。

有 FP：复现 → 找到第一个偏离点 → 精准修复 → 重跑原症状 + 回归 + 负控制 → 带证据的裁决。

### 安装

1. 下载 [`fp-universal-v0.5.0.zip`](https://github.com/MiaoY0uShan/FP/releases/tag/v0.5.0)
2. 解压并运行安装器
3. 重载 agent——FP 自动激活

```powershell
.\INSTALL-FP.cmd -Verify   # Windows
sh ./INSTALL-FP.sh --verify  # macOS / Linux
```

显式调用：`FP: 修这个 bug` 或 `$fp 诊断这个失败`

[完整安装矩阵](INSTALL.md) · [复制粘贴兜底](fp-copy-paste.md)

---

## 协议

| 路由 | 触发条件 | 行为 |
|------|----------|------|
| **Small** | 一个文件，≤5 行，原因已知，无新接口 | Tiny Brief + 验证 |
| **Medium** | 多文件，>5 行，或新增测试 | Execution Brief + 证据 |
| **Vague** | 需求不明确 | Idea Cards → 用户选择 → Medium |
| **Large** | 架构级、多模块、迁移 | 拆解为降低风险的模块 |

Small 不是默认。多文件 = Medium 起。

### 按需 Profiles

| 条件 | Profile |
|------|---------|
| 重试/循环/编码可疑 | `provider-compatibility/SKILL.md` |
| 多 agent、并行写 | `templates/multi-agent-review-protocol.md` |
| 远程/有状态目标 | `skills/live-system/SKILL.md` |
| 未知故障，仅诊断 | `skills/debug-incident/SKILL.md` |
| 跨会话续接 | `skills/continuation/SKILL.md` |
| 委托执行 | `delegated-execution/SKILL.md` |
| 需求模糊/高风险 | `question-requirements/SKILL.md` |

Profiles **仅在条件匹配时加载**——从不默认加载。这是旧版 token 浪费的第一大来源。

---

## 复用阶梯

创建任何东西之前：需要存在吗？→ 代码库已有？→ 标准库？→ 平台原生？→ 已安装依赖？→ 一行代码？→ 以上都不行，才加最少新代码。

---

## FAQ

**每个任务都会变成仪式吗？** 不会。Small 任务只需 Tiny Brief。Profiles 按需加载——改个密码的简单 bug 零 FP 模板读取。

**非推理模型？** 用 `fp-minimal/SKILL.md`。三条规则。基准数据证明在弱模型上这比完整协议更有效。

**为什么是 77 行？** 因为 162 行导致 agent 浪费 45% 的 token 读 FP 自己的模板。基准数据精确显示了哪些部分有价值，哪些没有。

---

## 运行基准测试

```bash
# 完整盲评 (需要 API key 环境变量)
node benchmarks/real-eval-v2.mjs all --versions v0,v-final,v-minimal --trials 2 --model gpt-5.6-sol

# 仅模拟 (无 API 调用)
node benchmarks/score-final.mjs

# 多轮真实工具测试
node benchmarks/multi-turn-harness-v2.mjs --versions v0,v-final

# E2E 对比
node benchmarks/e2e-test.mjs
```

运行真实评估前设置 `FP_API_KEY` 和 `DEEPSEEK_API_KEY` 环境变量。

---

**语言：** [English](README.md) · [中文](README.zh-CN.md)

**许可证：** MIT
