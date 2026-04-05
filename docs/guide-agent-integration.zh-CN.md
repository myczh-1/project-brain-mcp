# Agent 集成指南

## 概述

Project Brain 通过文件协议集成：Agent 直接读写 `.project-brain/`，将其作为持久化记录系统。

本指南定义了无需 MCP endpoint/HTTP 服务配置时，如何保持 Agent 行为一致。

## 集成契约

对于非琐碎工作，Agent 应遵循：

1. 实施前读取当前上下文。
2. 为有意义任务创建或更新 change 记录。
3. 执行过程中记录关键决策、笔记与进展。
4. 任务完成时执行反思并完成闭环。

## 推荐系统提示词片段

```text
将 `.project-brain/` 作为持久项目记忆的权威记录系统。

在实质性实现前，读取 `project-spec.json` 与当前 `changes/*.json`。
对有意义实现，创建或更新 change 记录。
执行过程中，将决策写入 `decisions.ndjson`，将笔记写入 `notes.ndjson`，将进展写入 `progress.ndjson`。
在结束实质性工作前，更新 change 状态并落地稳定结论。

当 `.project-brain/` 存在时，不要把聊天历史当作真相来源。
```

## 最小记录集合

- **项目真相**：`.project-brain/project-spec.json`
- **任务记录**：`.project-brain/changes/*.json`
- **决策**：`.project-brain/decisions.ndjson`
- **笔记**：`.project-brain/notes.ndjson`
- **进展**：`.project-brain/progress.ndjson`
- **里程碑**：`.project-brain/milestones.json`

## Lightweight 工作流循环

1. **读取**
   - `project-spec.json`
   - 当前活跃 change 文件
2. **计划 + 执行**
   - 随工作推进更新 change 的范围/状态字段
3. **记录**
   - 追加 decision/progress/note 条目
4. **完成**
   - 标记 done/dropped，并写入后续方向

## 护栏原则

- 稳定架构事实放在 `project-spec.json`。
- 进行中不确定项放在 `changes` 与 `notes`。
- 避免静默重写：优先带理由的追加/更新。
- 记录保持简洁、可机器解析。

## Service/HTTP/UI 历史集成说明

旧版 MCP endpoint 与 HTTP 服务集成内容已归档至：
- [docs/future/service-http-ui-archive.zh-CN.md](./future/service-http-ui-archive.zh-CN.md)
