<p align="center">
  <img src="docs/assets/fp-banner.svg" alt="FP 将模糊任务、并行 agent 和有限示例转化为可验证的进展" width="100%">
</p>

<p align="center"><sub>
  <a href="README.md">English</a> ·
  <b>中文</b> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a>
</sub></p>

# FP

**补丁不是终点。证据才是。**

[![Validate](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg)](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/MiaoY0uShan/FP)](https://github.com/MiaoY0uShan/FP/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)

大多数编程 agent 从提示直接冲向补丁。FP 让你的 agent 先找到真正的任务、界定每一次委托的范围，并在完成时提供父 agent 可以独立验证的证据。

它也可以从先前的运行中学习——但不是通过把一次幸运的偶然当作永久规则。

FP 从目标中推断激活：它会在工程工作时自动加载，在闲聊或其他非工程目标时保持休眠。`FP:` 和 `$fp` 仍然作为可选的手动调用。

无守护进程。无数据库。无必需的 MCP 服务器。安装它，重载你的 agent，然后正常工作。

---

## 你一定见过这种情况

四个 agent 同时碰了同一批文件。一个重启了服务。另一个报告构建成功。没有人重新测试那台仍然连不上的手机。

FP 给工作划定边界、分配所有者、并设立可观测的终点线。

```text
没有 FP 的情况

编辑配置 -> 重启服务 -> 状态灯绿 -> "完成"

有 FP 的情况

复现真实客户端
-> 对比期望 / 生成 / 实际生效的状态
-> 找到第一个出错的边界
-> 做出最小授权的变更
-> 重新运行真实客户端 + 负向验证 + 生命周期检查
-> 记录证据
```

第二条路径在前五分钟比猜测要慢。但在接下来两天里比调试那个猜测要快得多。

## 工作原理

```text
请求
-> 衡量实际风险进行路由
-> 冻结范围、权限和验收条件
-> 执行或委托有边界的工作
-> 运行可观测的检查
-> 验证证据账本
-> 可选：评估一个可复用的学习候选
```

小任务保持轻量。线上事件优先恢复服务再优化。未知原因触发诊断后再打补丁。多设备巡检先收集基线再变更。当前外部事实带有版本、来源和时效依据。

加入代码之前，FP 还会走一条简短的复用阶梯：

```text
1. 这个需要存在吗？         不需要 -> 跳过（YAGNI）
2. 代码库里已经有了？       有 -> 复用
3. 标准库能做？            能 -> 使用
4. 平台原生功能？           能 -> 使用
5. 已安装的依赖？           能 -> 使用
6. 一行代码够吗？           够 -> 写一行
7. 以上都不行                再加入最少的新代码
```

安全、回滚、可访问性、数据完整性和必需证据不是需要删除的"复杂度"。

## 分布式而非混乱

```text
父 agent / 集成者
|-- 有边界的调查 A           只读
|-- 有边界的调查 B           只读
|-- 候选学习者               只读，仅提案
|-- 盲评者                   隐藏验证集 + 神谕
|-- 规格审查员               独立任务 + 独立会话
+-- 集成审查员               独立任务 + 独立会话
             -> 边界的证据 + 裁决

一个写入者 -> 父 agent 重跑关键检查 -> 权威账本
```

每个逻辑子任务都收到任务包：task/session/parent ID、目标、上下文引用、角色、工具、权限上限、依赖、文件/资源、迭代/尝试/时间/深度限制、幂等键、输出预算、父级独占产物路径、停止条件。

机器合约推导而非信任——对依赖 DAG 有效性、输入顺序结果、并发数、幂等重试、写者租约、独立审查证据和父级集成做全面验证。

叶子 agent 不能委托、使用凭证、部署、对外消息、提升记忆、或变更在线状态。一句"租约已释放"不等于租约已释放的证据。

并行是为独立工作准备的。两个 agent 同时编辑同一棵共享文件树，不是分布式系统——是带有乐观主义的合并冲突。

## 学习但不记死

FP 进化外部策略：技能、模式、检查清单、和有限自动化。它不声称训练模型权重或保证统计泛化。

```text
一个有证据的运行
-> 观察

一个严重案例
-> 最多只能产生一个有限的、带过期时间的影子检查清单

2-4 个独立正例
-> 留一法 -> 盲评 -> 轮转每个案例

所有折、对照、不变量 + 未来影子观察 + 回滚检验全部通过
-> 父批准的 active 候选
```

释义、噪声变体和一次会话中的五个子 agent 是有用的鲁棒性检查，但仍然只算作一次独立经验。

一个 active 候选需要可重算的源账本快照哈希、盲评证据、同单位度量、近邻负向案例、零容忍不变量的安全门、复杂度预算、未来影子观察和测试过的回滚。

训练失败暴露欠拟合；验证集回归暴露过拟合；负向案例失败暴露触发过宽。这些都不能被平均掉。

见[泛化门](fp/generalization-gate/SKILL.md)和其[机器合约](fp/contracts/evidence-ledger.v1.schema.json)。

## 能够说"不"的证据

`fp/contracts/evidence-ledger.v1.schema.json` 加上零依赖语义验证器构成了事实来源。它们将声明绑定到可观测命令、实施独立的仓库/网络/写入范围、对比最终运行与其简报、验证在线系统和外部上下文证据，并对无关检查、伪造指标、未来日期学习和过期连续状态关闭。

```text
范围 -> 验收行 -> 有边界执行 -> 可观测检查 -> 已验证声明
```

一个绿色的进程、服务重启、子 agent 摘要或实现 diff 本身不等于完成证据。一旦声明的证据通过，FP 发送一个裁决并停止，不在不变状态上添加决策中性的额外验证。

## 安装

一个归档。一个安装器。一次只读验证。

1. 从 [Releases](https://github.com/MiaoY0uShan/FP/releases) 下载最新的 `fp-universal-v{version}.zip`。
2. 解压到项目根目录。
3. Windows 上运行 `INSTALL-FP.cmd`。macOS/Linux 上运行 `sh ./INSTALL-FP.sh`。
4. 用 `INSTALL-FP.cmd -Verify`（Windows）或 `sh ./INSTALL-FP.sh --verify`（macOS/Linux）验证，然后重载 AI 工具并正常工作。

安装器在写入前检查所有权、冲突、符号链接/重解析点、托管块和备份。验证的卸载只移除安装器拥有的内容。

[详细命令和兼容层级](INSTALL.md) | [从 ZeroToHero 或 Xskill 迁移](MIGRATION.md) | [复制粘贴备选方案](fp-copy-paste.md)

Claude Code 包包含 `.claude/skills/fp/` 用于技能发现和 `.claude/CLAUDE.md` 用于系统级自动注入——与 Superpowers 相同的机制。其他主机通过通用安装器获得工具特定的入口点。

工程目标会自动激活 FP，无需关键字。以下显式形式仍然可选：

```text
FP: 诊断并修复密码重置回归问题。
$fp 审查此仓库的发布工作流，不要编辑。
```

## 数字——当它们是真实的时候

**没有基线意味着没有改进声明。**

FP 可以从有证据的运行中计算验证率、范围蔓延、返工、上下文负载代理和"每验证进展的 Tokens"。缺失的值保持 `unknown`。公平比较需要固定任务、模型、仓库修订、权限和验收检查。

这里没有装饰性的"提升 42%"图表。验证器会问基线在哪里。

[Metrics 合约](docs/metrics.md) | [案例研究](docs/case-studies.md) | [前向测试记录](docs/forward-tests-2026-07-14.md)

## 路由

FP 使用压缩的 4 路由模型：

| 路由 | 何时 | 发生什么 |
| --- | --- | --- |
| **紧急/高风险** | 线上事件、追问质询、协议变更 | 确认意图 → 在权限内行动。线上事件先恢复后修复。 |
| **只读诊断** | 未知故障或主动巡检 | 调试优先：假设 → 探测 → 授权修复。巡检：每目标基线 → P0/P1/P2 报告。 |
| **构建** | 清晰或模糊的实现 | 小 → 极简简报。中 → 执行简报 + 账本。模糊 → 想法卡片。大 → 最小模块 → 最终简报。 |
| **关闭** | 每个任务 | 证据匹配则通过 → 一个裁决 → 停止。额外诊断必须改变一个决策或填充一个验收行；变更状态仍触发必需的回归和负向控制。 |

微小的清晰编辑 → 五行简报和一个相关检查。活跃的线上故障 → `观察 → 控制 → 恢复 → 修复 → 学习`。多设备巡检 → 只读的每目标证据、跨目标比较，然后每目标授权修复。

实时系统、外部上下文、provider 兼容性/费用控制、多 agent 和委托执行、续接、自迭代和后台学习作为 profile 层叠在这些路由之上。

委托执行现在是显式的：每个工作项都有一个全新的实现者、全新的任务审查员、条件性的全新修复者和全新复审者，然后全新的最终集成审查员，再由父 agent 重跑集成检查。独立问题域只有在共享状态、文件、生成输出和依赖被证明不交叉后才能扇出。FP 选择已安装主机的实际原生运行时——如 Codex `spawn_agent`、Claude Code `Agent`、Kimi Code `Agent`/`AgentSwarm`、或 Qwen Code `agent`——而不是根据模型名称猜测。

对于第三方 provider 和本地网关，provider 兼容性 profile 解析有效链、检查代理健康、乘以嵌套重试上限、冻结请求/token/subagent 预算、停止重复语义动作，并核账 provider 原生用量。

当某个已安装的 MCP 是一条验收行的真正需要时，FP 在任务已有权限内自动使用它。如果缺失，FP 首先展示精确来源、版本、安装范围、权限/数据暴露、验证和回滚方案。

## 开发

权威源位于 `fp/`。生成的适配包位于 `install/`，覆盖 18 个 agent（Claude Code、Codex、Gemini CLI、Cursor、Windsurf、Cline、Roo Code、OpenCode、Kiro、Qoder、Aider、GitHub Copilot CLI、GitHub Copilot Editor 等）。所有生成的副本由脚本刷新，绝不手动编辑。

```text
node scripts/lint-fp.js
node scripts/lint-release.js
node scripts/lint-contracts.js --ledger fp/examples/password-reset.evidence-ledger.json --brief fp/examples/password-reset.compiled-execution-brief.json
node --test
powershell -NoProfile -File scripts/sync-install-packs.ps1 -Check
```

发布工作流同时验证 Windows PowerShell 生命周期、POSIX 安装/验证/卸载、包校验和、归档入口点以及干净的生成包 diff。

## FAQ

### 每个任务都会变成繁文缛节吗？

不会。一行修复不需要一部宪法。

### 子 agent 可以声明整个任务完成吗？

它可以返回证据和裁决。父 agent 仍然重跑关键检查并拥有最终声明。

### 为什么有些工具显示外文的人类 agent 名字？

那是主机 UI 的标签，不是 FP 的要求。FP 记录语义 ID 如 `T03-implementer` 和 `T03-reviewer`——运行时可以渲染任何昵称而不改变身份、所有权、新鲜度或证据。

### DeepSeek、Kimi 或 Qwen API 本身提供子 agent 吗？

不。那些是模型 provider。Kimi Code 和 Qwen Code 是拥有自己子 agent 工具的 agent 主机；在 Claude Code 背后使用的模型 API 仍然使用 Claude Code 的运行时。官方源注册表区分主机和仅模型 API，并在已安装能力缺失时 fail closed。

### 它能从一次成功运行中学习吗？

它记录一次观察。一次偶然不是一条模式。

### 这是自主自我修改的 AI 吗？

不是。后台 agent 可以提出冻结候选。独立评估者测试它们。提升需要声明的权限、机器证据、未来影子观察窗口和回滚。

### 它需要 Hermes、Context7 或其他服务在运行吗？

不需要。它们的有用协议思想被改编进了便携的本地合约。它们的守护进程、数据库、MCP 服务、私有后端和爬虫不是依赖。

### FP 会自动安装缺失的 MCP 吗？

仅经过明确批准。FP 会自动调用已经可用的任务所需 MCP，但缺失的 MCP 先得到一个有边界的获取方案。安装批准不等同于静默授权登录、机密、配置修改、重启、驻留服务或更广泛的任务操作。

### 它是否承诺更少的 tokens 或更快的交付？

只有在经过受控的重复比较证明后。

## 影响

FP 是一个原创实现。其设计受到 [Superpowers](https://github.com/obra/superpowers)、[Hermes Agent](https://github.com/NousResearch/hermes-agent)、[Ponytail](https://github.com/DietrichGebert/ponytail)、[Context7](https://github.com/upstash/context7)、[Grill Me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) 和 [code-review-graph](https://github.com/tirth8205/code-review-graph) 的启发和磨砺。

确切的修订版本、采纳的行为、排除项和推理边界见 [docs/upstream-influences.md](docs/upstream-influences.md)。许可来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

前身为 Xskill。见 [MIGRATION.md](MIGRATION.md)。

---

**语言版本：** [English](README.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md)

## 许可

MIT。使用它、检查它、改进它，并保留声明。
