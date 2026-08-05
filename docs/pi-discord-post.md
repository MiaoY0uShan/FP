# Pi Discord Post: FP — Finish with Proof

Post in `#pi-packages` channel.

---

**Title:** FP — Finish with Proof: 让你的 Pi agent 用证据收尾，而不是凭感觉

Hey all! 👋 我来分享一个 Pi 技能：**FP (Finish with Proof)** —— 一套为编码 agent 设计的可移植执行协议。

## 是什么？

85 行。4 条规则。按需 profiles。

- **规则 1**：锁定目标 — 优化路径，永不改目标；无路可走就报告差距，绝不偷换结果
- **规则 2**：诊断先于修补 — 找根因，不要猜
- **规则 3**：验证先于声称完成 — 跑测试，看到通过
- **规则 4**：简洁可执行 — 第一行 = 结果，最后一行 = 下一步

复杂场景有 7 个按需 profiles（线上系统、多 agent、provider 兼容等），只在触发时加载，不浪费 token。

## 为什么值得试试？

有数据支撑，不是玄学：

```
盲评结果（3 个模型，1,416 次 API 调用）：
- GPT-5.6-Sol:  v-final 得分 3.57 (冠军)
- DeepSeek-v4-Pro: v-final 得分 3.14 (冠军)  
- GPT-5.3-Spark: v-minimal 得分 3.08 (冠军)

Token 消耗: -45%
工具调用: -57%
模板读取: -89% (1 vs 9)
```

## 快速安装

```bash
git clone https://github.com/MiaoY0uShan/FP.git
cp -r FP/fp ~/.pi/agent/skills/fp
```

或者等 npm package 上线后：`pi install npm:@miaoy0ushan/fp`

## 效果对比

没有 FP：
> "修那个认证测试" → 加大超时 → 跑一次 → "看起来好了"

有 FP：
> 复现 → 找偏离点 → 精准修复 → 重跑（原症状 + 回归 + 负控制） → 带证据的裁决

## 链接

- GitHub: https://github.com/MiaoY0uShan/FP
- 基准数据: https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md
- Pi 安装说明: https://github.com/MiaoY0uShan/FP/blob/main/pi-install/README.md

欢迎反馈和 PR！🎉

---

**Notes for posting:**
- Best time: weekday mornings US Eastern / evenings Asia
- Attach the benchmark comparison table as a screenshot for visual impact
- Link to the `pi-install/README.md` for Pi-specific instructions
- Mention @badlogic if appropriate (don't spam)
