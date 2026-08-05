# 阶段状态交接模板

> 跨会话唯一有效交接快照。每完成一个大阶段都重写本文件，删除过时、重复或已被新证据替代的内容。
> 最终完成标准只以 `目标.md` 为准。

## 当前快照

- 日期：`YYYY-MM-DD`。
- 当前阶段：`S<N>-<stage-name>`。
- 结论：`<PASS / IN_PROGRESS / BLOCKED>`。
- 路线简述：<一句话描述当前技术路线>。

## 已验证证据

### <类别 1>

- 事实：<具体可复现的证据>
- 哈希/路径：<如有产物，标注路径和 SHA-256>

### <类别 2>

- ...

## 产物清单

- `<path>` — SHA-256 `xxxx`
- 完整清单：`<path>/SHA256SUMS`（`N` 项，fresh verify PASS）

## 回滚点

- 上一个稳定版本：`<path>` — SHA-256 `xxxx`
- 恢复命令：`<exact command>`

## 当前阻塞项

| 阻塞项 | 分类 | 说明 |
|---|---|---|
| `<item>` | `FIRMWARE_BLOCKED` / `WAITING_HARDWARE` / `USER_ACTION_REQUIRED` / `HOST_DRIVER_BLOCKED` | <原因> |

分类说明：
- `FIRMWARE_BLOCKED` — 硬件/固件限制，软件无法解决
- `WAITING_HARDWARE` — 外设未到位
- `USER_ACTION_REQUIRED` — 需人工操作（如通话测试）
- `HOST_DRIVER_BLOCKED` — PC 端依赖缺失

## 唯一下一步

<一句话，可执行。下一个会话读到这里就能直接开始。>
