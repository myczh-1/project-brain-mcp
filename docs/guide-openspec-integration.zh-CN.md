# 在 OpenSpec 中使用 Project Brain

## 概述

OpenSpec 管理结构化的从提议到实现的工作流（propose → design → spec → tasks）。Project Brain 管理持久的项目记忆（决策、进展、笔记、里程碑、项目规范）。两者结合形成了一个完整的 AI 辅助开发工作流：OpenSpec 提供路线图，而 Project Brain 捕获执行轨迹。

## 它们如何相辅相成

- **OpenSpec**：负责“构建什么”的生命周期。它创建更改提议、设计文档、详细规范和可执行的任务分解。
- **Project Brain**：负责“发生了什么”的记忆。它记录编码过程中的决策、进度更新、原始笔记和项目级规则。
- **集成点**：
  - OpenSpec 的更改可以同步到 Project Brain 的更改记录（change records）中，以维护统一的历史记录。
  - Project Brain 的持久上下文（例如架构规则、之前的决策）可以丰富 OpenSpec 的提议和设计阶段。

## 两种集成方式

### 服务模式 (Service Mode)
在运行 OpenSpec 技能的同时运行 `npx @myczh/project-brain`。AI 助手通过其 Model Context Protocol (MCP) 服务器连接到 Project Brain，同时使用基于文件的技能进行 OpenSpec 操作。此可选运行时模式提供便利能力，例如自动 git 活动分析和仪表盘可视化。

### 轻量模式 (Lightweight Mode，无需服务器)
AI 助手遵循协议直接读取和写入 `.project-brain/` 目录，同时使用 OpenSpec 技能。无需 HTTP 服务器或后台进程。这种方法非常适合单开发人员工作流以及运行本地服务器不方便的环境。

## 轻量模式设置

在轻量模式下，除了确保 AI 助手理解 Project Brain 协议外，不需要进行任何安装。

### 目录结构
两个系统共存于仓库根目录：
```text
.project-brain/      <-- Project Brain (持久记忆)
openspec/            <-- OpenSpec (活动更改)
  changes/
    feature-x/
      proposal.md
      design.md
      tasks.md
```

### 协议访问
AI 助手需要访问 `protocol/` 文档（特别是 `files.md`、`semantics.md` 和 schema 模式），以确保生成有效的记录。

### .project-brain/ 布局
```text
.project-brain/
  manifest.json      <-- 项目身份
  project-spec.json  <-- 稳定的项目真相与规则
  changes/           <-- 结构化更改记录
    <id>.json
  decisions.ndjson   <-- 只增的决策日志
  notes.ndjson       <-- 只增的观察日志
  progress.ndjson    <-- 只增的执行更新
  milestones.json    <-- 阶段追踪快照
```

## 工作流示例（轻量模式）

1. **构思**：用户向 AI 描述一个新功能想法。
2. **OpenSpec Propose**：AI 使用 `openspec-propose` 技能在 `openspec/` 目录中创建 `proposal.md`、`design.md` 和 `tasks.md`。
3. **上下文注入**：在开始实现之前，AI 读取 `.project-brain/project-spec.json` 和近期的 `decisions.ndjson` 以与项目规则保持一致。
4. **执行记录**：在实现过程中，AI 将新决策追加到 `decisions.ndjson`，并将进度更新实时追加到 `progress.ndjson`。
5. **更改关闭**：当功能完成时，AI 将对应的 `.project-brain/changes/<id>.json` 状态更新为 `done`。
6. **OpenSpec Archive**：AI 使用 `openspec-archive-change` 技能将完成的 OpenSpec 产物移动到归档中。

## 协议参考（简速版）

### 文件行为
- **只增 (NDJSON)**：`decisions.ndjson`、`notes.ndjson`、`progress.ndjson`。每行一个 JSON 对象。切勿修改现有行。
- **快照 (JSON)**：`manifest.json`、`project-spec.json`、`changes/<id>.json`、`milestones.json`。更新时替换整个文件。**写入前务必读取当前文件**，以避免覆盖并发更改。

### 核心语义
- **时间戳**：使用 ISO 8601 UTC 格式（例如 `2026-04-02T10:00:00.000Z`）。
- **更改状态**：`proposed`、`active`、`done`、`dropped`。
- **软引用**：使用 ID 链接记录（例如，进度条目引用更改 ID）。

## 最佳实践

- **先读后写**：在执行写入之前，务必刷新您对 `.project-brain/` 状态的视图，尤其是在暂停后恢复工作时。
- **即时记录**：在决策和进展发生时立即捕获它们。不要等到会话结束。
- **关注点分离**：使用 OpenSpec 进行规划和结构化拆解；使用 Project Brain 捕获开发实况和长期记忆。
- **避免重复**：避免将 OpenSpec 设计文档的全部内容镜像到 Project Brain 中。使用 Project Brain 记录设计被采纳的 *事实*，以及随后产生的任何 *偏差* 或 *实现时的决策*。

## 推荐的 AI 技能配置

要有效使用这两个系统，请为您的 AI 编码助手同时配置 OpenSpec 技能和 Project Brain 协议上下文。如果使用基于工具的助手，请确保其对 `openspec/` 和 `.project-brain/` 目录均拥有 `Read` 和 `Write` 权限。

在轻量模式下工作时，请加入系统提示词指令：
“你是一个轻量级的 Project Brain 生产者。在更新 `.project-brain/` 时遵循 `/protocol` 中的协议。使用 OpenSpec 技能进行更改生命周期管理。”
