# DeepSeek + FP：国产推理模型的编码能力如何再提升 6%？

> 基于 1,416 次真实 API 调用的盲评基准测试，揭示结构化的执行协议如何让 DeepSeek 编码 agent 从"能用"到"可靠"。

---

## TL;DR

- DeepSeek-v4-Pro 在盲评中，使用 **FP v-final（77 行）** 得分 **3.14**，比 baseline（无协议）的 2.97 高出 **6%**
- 更有趣的是：FP 的极简版（v-minimal，仅 3 条规则）在 DeepSeek 上得分仅 2.46，产生 **7 个 blockers**——"少即是多"在 DeepSeek 上不成立
- DeepSeek 推理模型**更需要结构化路由**来发挥推理能力，而非越简单越好

---

## 问题：为什么 DeepSeek Agent 表现不稳定？

如果你用 DeepSeek 做编码 agent，你可能遇到过这些情况：

- 修一个简单 bug，agent 改了 5 个文件、加了 2 个抽象层
- 问一个模糊的需求，agent 直接开工，做出来的东西不是你想要的
- Agent 说"完成了"，但没有任何测试通过、没有任何证据

这些不是 DeepSeek 模型的问题——是**缺少执行协议**的问题。

推理模型（GPT-5.6、DeepSeek-v4-Pro、Claude Opus）有强大的推理能力，但如果没有明确的路由和验证规则，它们会：
1. **过度工程化**：简单任务做复杂方案
2. **过早行动**：没搞清楚需求就开始写代码
3. **没有验证**："实现了"就当"完成了"

---

## 解决方案：FP（Finish with Proof）

FP 是一套**可移植的执行协议**，专为编码 agent 设计：

- **77 行**核心规则
- **3 条铁律**：诊断先于修补、验证先于声称完成、简洁可执行
- **4 级路由**：Small / Medium / Vague / Large
- **7 个按需 profiles**：线上系统、多 agent、provider 兼容等

### FP 如何工作

```
用户："修那个间歇性失败的认证测试"

没有 FP：
  加大超时 → 跑一次 → "看起来修好了"
  
有 FP：
  复现问题 → 找到第一个偏离点 → 精准修复 → 
  重跑(原始症状 + 回归 + 负控制) → 带证据的裁决
```

---

## 基准测试数据

我们在 **3 个模型 × 8 个特质 × 3 种测试方法**上进行盲评：

### 跨模型盲评

| 模型 | 🥇 冠军 | 得分 | 🥈 亚军 | 得分 |
|------|---------|------|------|------|
| gpt-5.3-codex-spark (非推理) | v-minimal (3条规则) | 3.08 | v0 | 3.01 |
| gpt-5.6-sol (推理) | **v-final (77行)** | **3.57** | v0 | 3.49 |
| deepseek-v4-pro (推理) | **v-final (77行)** | **3.14** | v0 | 2.97 |

**关键发现：**

1. **DeepSeek 更需要结构**：v-minimal（仅 3 条规则）在 DeepSeek 上得分仅 2.46，产生 7 个严重问题——没有路由和 profiles 的反而是灾难
2. **v-final 在所有推理模型上都是冠军**：77 行恰好是甜点
3. **牺牲安全换速度永远最差**：v2 Concise-Max 在所有模型上表现最差

### E2E 多轮测试（真实工具调用）

| 指标 | 旧版 (162行) | 新版 (77行) | 改善 |
|------|-------------|------------|------|
| Token 消耗 | 19,620 | 10,665 | **-45%** |
| 工具调用 | 14 | 6 | **-57%** |
| 模板读取 | 9 (3浪费) | 1 (0浪费) | **-89%** |

---

## 为什么 DeepSeek 用户应该用 FP？

### 1. DeepSeek 的推理能力需要方向

推理模型擅长深度思考，但如果没有路由，它们会在不该思考的地方深度思考。FP 的 Small 路由让简单修改保持简单（3-5 行 Tiny Brief），Medium 路由让复杂任务有结构。

### 2. 按需 profiles 节省 token

DeepSeek API 按 token 计费。FP 的 7 个 profiles **只在条件触发时加载**——修个 typo 零 profile 读取。旧版 agent 浪费 45% token 读 FP 自己的模板，新版只读 1 个文件。

### 3. 验证门控解决 DeepSeek 的"过度自信"

DeepSeek 推理模型有时会"说服自己"问题已解决。FP 的规则 2（验证先于声称完成）要求可观测的证据——测试结果、日志输出、负控制——不只是推理链。

---

## 5 分钟快速开始

### Pi 中安装

```bash
# 一键安装为 pi skill
git clone https://github.com/MiaoY0uShan/FP.git
cp -r FP/fp ~/.pi/agent/skills/fp
```

### 任意 agent 安装

```bash
# 下载 universal 包
# https://github.com/MiaoY0uShan/FP/releases/latest
# 解压并运行安装器
./INSTALL-FP.sh --verify
```

### 手动激活

```
FP: 修复登录超时的 bug
$fp 诊断这个内存泄漏
```

---

## 结论

| 场景 | 推荐 |
|------|------|
| DeepSeek + 编码任务 | FP v-final（77 行完整协议） |
| 弱模型 / token 极度紧张 | FP v-minimal（仅 3 条规则） |
| 多 agent 协作 | FP + multi-agent profile |
| 生产环境操作 | FP + live-system profile |

**DeepSeek 推理模型 + FP 结构化路由 = 更可靠的编码 agent。**

基准数据没有说谎：v-final 在 DeepSeek 上是冠军，v-minimal 是灾难。给你的 DeepSeek agent 装上 FP，让你的 token 花在解决问题上，而不是花在猜该做什么上。

---

*FP 项目地址：[github.com/MiaoY0uShan/FP](https://github.com/MiaoY0uShan/FP)*  
*完整基准方法：[benchmarks/results/ARTICLE.md](https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md)*  
*安装指南：[INSTALL.md](https://github.com/MiaoY0uShan/FP/blob/main/INSTALL.md)*

---

**标签：** `#DeepSeek` `#AI编程` `#Agent工程` `#FP` `#PromptEngineering` `#编码Agent`
