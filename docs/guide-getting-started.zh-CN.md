# Project Brain 入门指南

本指南将为您提供在开发环境中安装、配置和使用 Project Brain 的逐步说明。

## 前置条件

在开始之前，请确保您已安装以下软件：
- Node.js 18 或更高版本
- 一个打算使用 Project Brain 的 git 仓库

## 安装

您可以不安装直接运行 Project Brain，也可以将其作为依赖项进行安装。

### 快速运行
无需安装直接执行：
```bash
npx -y @myczh/project-brain
```

### 全局安装
全局安装以便在任何地方使用 `project-brain` 命令：
```bash
npm install -g @myczh/project-brain
```

### 开发依赖安装
在项目中安装以锁定版本：
```bash
npm install --save-dev @myczh/project-brain
```

## 启动服务

通过运行以下命令启动 Project Brain 服务器：
```bash
npx @myczh/project-brain
# 或者如果已全局安装：
project-brain
```

预期输出：
```text
Project Brain HTTP server running at http://127.0.0.1:3210
```

### 验证服务
通过检查 health 接口确认服务器已激活：
```bash
curl http://127.0.0.1:3210/health
```
响应应该是 `{"status":"ok"}`。

## 连接您的 AI 助手

Project Brain 在 `http://127.0.0.1:3210/mcp` 提供了一个 MCP (Model Context Protocol) 接口。

### Cursor
1. 前往 **Settings** -> **MCP Servers**。
2. 添加一个新服务器，URL 为：`http://127.0.0.1:3210/mcp`。

### Claude Desktop
首先，在终端中启动 Project Brain 服务器：
```bash
npx -y @myczh/project-brain
```
然后编辑您的 `claude_desktop_config.json` 文件：
```json
{
  "mcpServers": {
    "project-brain": {
      "url": "http://127.0.0.1:3210/mcp"
    }
  }
}
```
*注意：Claude Desktop 连接到正在运行的 HTTP 服务器。使用 Claude Desktop 时请保持终端窗口打开。*

### OpenCode
编辑您的 `opencode.json` 文件以包含 MCP 服务器：
```json
{
  "mcpServers": {
    "project-brain": {
      "url": "http://127.0.0.1:3210/mcp"
    }
  }
}
```

## 首次使用 — 初始化项目

连接后，您的 AI 助手即可与 Project Brain 交互。

1. **初始化项目**：调用 `brain_init`。这将设置初始项目身份和仓库结构。
2. **检查上下文**：调用 `brain_context` 以验证当前状态并查看活动目标。

## 日常工作流

遵循此模式以维护持久的项目记忆：

1. **工作前**：调用 `brain_context` 为助手注入当前目标和近期进展。
2. **开始有意义的工作**：在开始新功能或修复时调用 `brain_start_work`。
3. **工作中**：
   - 调用 `brain_checkpoint` 记录里程碑。
   - 在做出架构或实现选择时调用 `brain_log_decision`。
   - 调用 `brain_capture_note` 记录观察结果或后续事项。
4. **工作结束**：调用 `brain_finish_work` 总结更改并更新项目状态。

## 了解您的数据

Project Brain 将所有数据存储在仓库根目录的 `.project-brain/` 目录中：

- `manifest.json`：项目身份（名称、摘要、仓库类型、技术栈）。
- `project-spec.json`：稳定的项目真相和规则。
- `changes/<id>.json`：单个实现任务的结构化记录。
- `decisions.ndjson`：工程决策的追加日志。
- `notes.ndjson`：捕获的片段和观察结果。
- `progress.ndjson`：执行更新和阻塞事项的时间轴。
- `milestones.json`：宽泛的阶段和里程碑跟踪。

您可以直接检查这些文件，或通过 `http://127.0.0.1:3210/ui` 的 Dashboard UI 查看它们。

## 配置

可以使用环境变量来自定义服务器：

- `PROJECT_BRAIN_HOST`：服务器绑定的接口（默认：`127.0.0.1`）。
- `PROJECT_BRAIN_PORT`：HTTP 服务器的端口（默认：`3210`）。
- `PROJECT_BRAIN_ALLOWED_ORIGINS`：用于 CORS 的以逗号分隔的 origin 列表。

## 故障排除

- **端口占用**：如果端口 3210 被占用，请设置不同的 `PROJECT_BRAIN_PORT`。
- **CORS 错误**：确保您的客户端 origin 已包含在 `PROJECT_BRAIN_ALLOWED_ORIGINS` 中。
- **MCP 连接失败**：确认服务器正在运行，且端点 `/mcp` 可通过浏览器或 curl 访问。

## 后续步骤

- 查阅 [Agent 集成指南](./guide-agent-integration.zh-CN.md) 以了解与特定 AI 助手的深度集成。
- 查看 [OpenSpec 集成指南](./guide-openspec-integration.zh-CN.md) 以学习如何在规范驱动开发中使用 Project Brain。
