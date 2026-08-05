# ChatGPT + Codex 推荐路线

## 一、ChatGPT（Custom GPT + App）

### 1. 发布 Custom GPT（立即可做）

**路径**：ChatGPT → 创建 GPT → 粘贴 `chatgpt-gpt/fp-gpt-config.md` 的内容

**配置要点**：
- 名称：`FP Coding Engineer — Finish with Proof`
- 勾选 Code Interpreter（不需要 Web Browsing 和 DALL·E）
- 可见性设为 **Public**，提交 GPT Store
- 分类选 "Programming" / "Developer Tools"

**GPT Store 链接格式**：`https://chatgpt.com/g/g-<gpt-id>`

**预期效果**：
- 用户在 GPT Store 搜索 "coding" "engineer" "debug" "agent" 时可能发现
- 在社交媒体分享 GPT 链接引流
- 写一篇 "我做了个 FP GPT" 的文章发到掘金/知乎

### 2. 申请 OpenAI Cookbook 收录

**路径**：[OpenAI Cookbook](https://cookbook.openai.com/) 提 PR

**内容方向**：Agent Engineering Best Practices — How FP protocol reduces token waste and improves correctness

**需要的文件**：
- `cookbook/examples/fp-agent-protocol.ipynb` — Jupyter notebook 展示 FP 协议
- 展示 before/after 对比的实际案例

### 3. ChatGPT App Platform（未来）

当 OpenAI 开放 App Directory 提交时，FP 可以做成：
- 交互式 Task Router App（用户输入任务 → FP 路由分析 → 输出执行计划）
- 用 Apps SDK 做可视化路由界面

---

## 二、Codex CLI（OpenAI）

### 1. 社区列表收录

| 列表 | 链接 | 状态 |
|------|------|------|
| awesome-llm-skills | https://github.com/liyin2015/awesome-llm-skills | 提 PR |
| AI-Agents-public | https://github.com/vasilyu1983/AI-Agents-public | 提 PR（64 skills 仓库） |
| agents marketplace | https://model-context-protocol.com/clients/agents | 提交（155 skills） |

### 2. FP Skill 安装包

FP 已有 Codex 安装包（`install/codex/`），结构：

```
your-project/.agents/skills/fp/
├── SKILL.md          # 核心路由协议
└── references/       # 按需 profiles
```

Codex 用户安装：

```bash
cp -r FP/install/codex/.agents your-project/
# 或者全局安装
cp -r FP/install/codex/.agents/skills/fp ~/.agents/skills/fp
```

### 3. Codex Discord 社区

在 OpenAI Codex Discord / Forum 发布：
- 介绍 FP 是什么
- 基准数据（GPT-5.6 得分 3.57 冠军）
- 安装方法
- Before/After 对比案例

---

## 三、发布顺序建议

| 优先级 | 动作 | 平台 | 难度 |
|--------|------|------|------|
| **P0** | 发布 npm pi-package | npm | ✅ 已完成 |
| **P0** | pi-skills PR | GitHub | ✅ 已完成 |
| **P0** | 发布 ChatGPT Custom GPT | ChatGPT GPT Store | 📋 需手动复制配置 |
| **P1** | awesome-llm-skills PR | GitHub | 📋 提 PR |
| **P1** | AI-Agents-public PR | GitHub | 📋 提 PR |
| **P1** | 知乎/掘金 DeepSeek 文章 | 中文社区 | ✅ 文章完成 |
| **P2** | Pi Discord 发布 | Discord | ✅ 草稿完成 |
| **P2** | Codex Discord 发布 | Discord | 📋 类似 pi-discord-post |
| **P2** | OpenAI Cookbook PR | GitHub | 📋 需写 notebook |
| **P3** | ChatGPT App Platform | OpenAI | 🔮 等平台开放 |

---

## 四、一句话定位（所有平台统一使用）

> **FP — Finish with Proof.** 让编码 agent 用证据收尾，而不是凭感觉宣布完成。
> 85 行。4 条规则。按需 profiles。1,416 次 API 调用验证。

## 五、每个平台的差异化卖点

| 平台 | 卖点 |
|------|------|
| Pi | Token -45%，工具调用 -57%，模板读取 -89% |
| DeepSeek | v-final 冠军（3.14 vs 2.97），v-minimal 灾难（7 blockers） |
| ChatGPT | 让 ChatGPT 写出"可验证的代码"的协议 |
| Codex | 路由 + 复用阶梯 + 多 agent 安全协作 |
