# FP Benchmark 实验完整报告

> 从"Baseline 赢了"到"少即是多"再到"按需加载"——1,416 次 LLM API 调用的完整闭环。

---

## 实验轨迹

```
阶段 1: 模拟 11 个版本 → 预测 v7 自适应平衡胜出
阶段 2: 单轮盲评 (gpt-5.3) → v-minimal (3条规则) 赢了。模拟错了。
阶段 3: 双模型对比 → 非推理模型要简单指令，推理模型要结构化知识
阶段 4: 加入 DeepSeek v4 Pro → v-final (77行) 在两个推理模型上都是冠军
阶段 5: E2E 多轮工具测试 → 新 SKILL.md 按需加载 profiles，45% token 节省
阶段 6: 砍掉 28 个死模板 → 从 35→7，功能不受影响
```

## 最终排名 (3 模型 × 3 版本)

| | gpt-5.3-codex-spark | gpt-5.6-sol | deepseek-v4-pro |
|---|---|---|---|
| 🥇 | v-minimal **3.08** | v-final **3.57** | v-final **3.14** |
| 🥈 | v0 3.01 | v0 3.49 | v0 2.97 |
| 🥉 | v2 2.64 | v-minimal 3.35 | v-minimal **2.46** |
| v-final vs v0 | — | +0.08 | **+0.17** |
| v-minimal vs v0 | +0.07 | -0.14 | **-0.51** (7 blockers) |

## E2E 多轮工具测试

| 指标 | Old (162行) | New (77行) | 改善 |
|------|------------|-----------|------|
| Token 消耗 | 19,620 | 10,665 | **-45%** |
| 工具调用 | 14 | 6 | -57% |
| FP 模板读取 | 9 (3个浪费) | 1 (0个浪费) | -89% |
| Profile 精准度 | 乱加载 | 按需触发 | ✅ |

## 核心发现

1. **"少即是多"只在弱模型上成立。** gpt-5.3-codex-spark 上 v-minimal (3条规则) 最好。但 DeepSeek v4 Pro 上 v-minimal 是灾难 (2.46, 7 blockers)。

2. **推理模型需要结构化知识。** gpt-5.6-sol 和 deepseek-v4-pro 上 v-final (77行, 含路由+按需profiles) 都是冠军。

3. **按需 profiles 有效。** 超时场景正确触发 live-system，简单 bug 场景零模板读取。

4. **砍掉 80% 的模板不影响功能。** 35→7 个模板，agent 不再浪费 token 读死代码。

5. **模拟不可替代真实评估。** 模拟预测 v7 赢 (4.73)，真实评估显示完全不同的排名。

## 最终版 FP Skill 设计

- **核心**: 77 行, 3 条规则 + 轻量路由 + 按需 profiles
- **Profiles**: 7 个, 仅在触发条件匹配时加载
- **Templates**: 从 35 砍到 7 个
- **Minimal**: fp-minimal/SKILL.md, 非推理模型用
- **模型自适应**: 推理模型用完整版, 弱模型降级到 minimal

## 数据

- 1,416 次 LLM API 调用
- 3 个模型 (gpt-5.3-codex-spark, gpt-5.6-sol, deepseek-v4-pro)
- 8 个特质基准, 24 个场景
- 3 种测试方法 (模拟、单轮盲评、多轮工具)
- 代码: `benchmarks/`
