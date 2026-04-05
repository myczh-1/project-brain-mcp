# Project Brain
为 AI 辅助开发提供持久化项目记忆。

> 主线保证：Project Brain 当前仅保证 [`protocol/`](./protocol/README.md) 中定义的稳定协议契约。
> 服务模式、MCP 工具面与 Dashboard 视图都属于可选的运行时便利层。

## 功能介绍

- 为 AI 辅助开发循环提供持久化项目记忆机制。
- 在 `.project-brain/` 目录下存储项目上下文、变更（changes）、决策（decisions）和进度（progress）。
- 基于同一稳定协议支持两种使用模式：可选的服务模式（HTTP/MCP）与基于文件的轻量模式。

## 两种使用模式

### 服务模式 (HTTP + MCP)

运行 `npx @myczh/project-brain` 启动包含 HTTP API 和 MCP 端点的完整服务器。此模式适用于团队、CI/CD 流水线以及需要集中协调服务的自动化代理（multi-agent）场景。

### 轻量/技能模式 (基于文件)

在此模式下，无需启动服务器。AI 助手通过遵循既定协议直接读写 `.project-brain/` 目录。这通常与 OpenSpec 配合使用，适用于单人开发者 + AI 的工作流。

## 如何选择安装方式

- 已经在使用 OpenSpec：运行 `npx -y @myczh/project-brain setup`，选择“轻量模式”。当仓库中已存在 `openspec/` 时，这是推荐路径。
- 需要给 Cursor、Claude Desktop、OpenCode 或本地 Dashboard 提供可选 MCP/HTTP 运行时接入：运行 `npx -y @myczh/project-brain setup`，选择“服务模式”。
- 两者都需要：在 setup 中选择“两者都启用”。日常仍以轻量模式为主，HTTP 服务用于 MCP 客户端接入。

## 快速开始 (服务模式)

1. 启动服务：
   ```bash
   npx -y @myczh/project-brain
   ```
2. 验证服务是否运行：
   ```bash
   curl http://127.0.0.1:3210/health
   ```
3. 将您的 MCP 客户端连接到端点：
   ```text
   http://127.0.0.1:3210/mcp
   ```

## 快速开始 (轻量模式)

详细指南请参阅 [docs/guide-openspec-integration.zh-CN.md](./docs/guide-openspec-integration.zh-CN.md)。简而言之，AI 助手读取 `protocol/` 中的定义，并直接向 `.project-brain/` 写入结构化数据。

## CLI 命令

- `project-brain`：启动 HTTP/MCP 服务。
- `project-brain setup`：检测仓库上下文，推荐轻量模式或服务模式，并初始化 `.project-brain/`。
- `project-brain doctor`：检查当前仓库和本地服务是否已准备好。
- `project-brain init`：为当前仓库创建最小可用的 `.project-brain/` 初始化结构。

## 核心数据模型

Project Brain 在 `.project-brain/` 目录下管理结构化状态：

- `manifest.json`: 可选的项目标识（名称、简介、技术栈）。
- `project-spec.json`: 稳定的项目事实和架构规则。
- `changes/`: 包含单个变更结构化记录的目录。
- `decisions.ndjson`: 项目和实现决策的依据。
- `notes.ndjson`: 原始观察结果和未解决的代码片段。
- `progress.ndjson`: 执行更新、阻塞点和状态。
- `milestones.json`: 宏观阶段和里程碑跟踪。

```text
.project-brain/
  manifest.json
  project-spec.json
  changes/
    <change-id>.json
  decisions.ndjson
  notes.ndjson
  progress.ndjson
  milestones.json
```

## 可选 MCP 工具面（运行时便利层）

### 读取/检查 (Read/Inspect)
- `brain_dashboard`: 通过统一的看板视图检查当前项目记忆和状态。
- `brain_context`: 获取用于日常执行的轻量级项目上下文。
- `brain_change_context`: 在实施前获取特定变更的详细上下文。
- `brain_recent_activity`: 检查最近的仓库活动和热门路径。
- `brain_analyze`: 对记忆和活动进行更广泛的反思分析。
- `brain_suggest_actions`: 建议接下来的工程行动。

### 写入/记录 (Write/Record)
- `brain_create_change`: 为任务创建结构化的变更记录。
- `brain_start_work`: 创建或采纳一个变更，并可选择写入初始进度。
- `brain_checkpoint`: 记录开发中的检查点，包含进度和笔记。
- `brain_finish_work`: 将变更标记为完成（done）或放弃（dropped），并返回反思总结。
- `brain_update_change`: 更新现有的变更记录。
- `brain_log_decision`: 记录具体决策及其依据。
- `brain_record_progress`: 记录进度或里程碑更新。
- `brain_capture_note`: 捕获原始实现笔记或观察。
- `brain_ingest_memory`: 摄入已确认的结构化记忆记录。

### 初始化 (Initialize)
- `brain_init`: 初始化或更新项目标识锚点。

## HTTP API

- `GET /`: 服务索引。
- `GET /health`: 健康检查。
- `GET /api`: API 端点索引。
- `GET /ui`: 看板 UI 原型。
- `GET /api/dashboard`: 获取看板数据。
- `GET /api/context`: 获取项目上下文。
- `GET /api/changes/:changeId/context`: 获取特定变更的上下文。
- `POST /mcp`: MCP 可流式 HTTP 端点。
- `POST /api/init`: 初始化项目。
- `POST /api/memory/ingest`: 摄入记忆记录。
- `DELETE /mcp`: 关闭 MCP 会话。
- `PUT /api/project-spec`: 更新项目规范。

## 集成指南

- [入门指南](./docs/guide-getting-started.zh-CN.md)
- [Agent 集成](./docs/guide-agent-integration.zh-CN.md)
- [OpenSpec 集成](./docs/guide-openspec-integration.zh-CN.md)

## 配置

可以使用以下环境变量来配置服务：

- `PROJECT_BRAIN_HOST`: 服务器绑定的主机地址（默认：`127.0.0.1`）。
- `PROJECT_BRAIN_PORT`: 监听端口（默认：`3210`）。
- `PROJECT_BRAIN_ALLOWED_ORIGINS`: 用于 MCP 验证的以逗号分隔的允许源列表。

## 架构

Project Brain 采用分层架构：

- **protocol**: 纯类型定义和 Schema。
- **core**: 领域逻辑、命令、查询和端口。
- **infra-fs**: 存储和 Git 端口的本地文件系统实现。
- **transport-http**: HTTP API 实现。
- **transport-mcp**: MCP 服务器实现。
- **app**: CLI 入口和服务器组装。

## 开发

```bash
npm install
npm run build
npm test
npm run dev
```

## 开源协议

MIT

---

[English](./README.md)
