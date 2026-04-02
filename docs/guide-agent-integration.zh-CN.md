# Agent 集成指南

## 概述

Project Brain 通过 Model Context Protocol (MCP) 为 AI 编程助手提供持久的项目记忆。本指南涵盖了如何从任何 AI 助手连接、配置和使用 Project Brain，以维护项目上下文、开发过程记录和反思的统一记录系统。

## 连接设置

要将 AI 助手与 Project Brain 集成，服务必须在本地运行。

- **启动服务**：`npx @myczh/project-brain`
- **MCP 端点**：`http://127.0.0.1:3210/mcp`
- **协议**：MCP Streamable HTTP

## 特定宿主配置

### Cursor
在 Cursor 设置中（Settings > LSP > MCP）将 Project Brain 添加为 MCP 服务器。
```json
{
  "project-brain": {
    "type": "http",
    "url": "http://127.0.0.1:3210/mcp"
  }
}
```

### Claude Desktop
首先在终端中启动 Project Brain 服务器：
```bash
npx -y @myczh/project-brain
```
然后将以下内容添加到您的 `claude_desktop_config.json` 中：
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
添加到 `opencode.json` 的 `mcpServers` 部分：
```json
{
  "mcpServers": [
    {
      "name": "project-brain",
      "url": "http://127.0.0.1:3210/mcp"
    }
  ]
}
```

### Windsurf
在 Windsurf 设置中，添加一个新的 MCP 服务器：
- **名称**：project-brain
- **类型**：HTTP
- **URL**：http://127.0.0.1:3210/mcp

### 通用 MCP 客户端
将您的客户端指向以下端点：
- **URL**：`http://127.0.0.1:3210/mcp`
- **方法**：POST（用于初始化和消息传递）

## 系统提示词模板

### 通用片段
适用于大多数 AI 助手，确保它们遵循 Project Brain 协议。
```text
当 Project Brain 通过 MCP 可用时，将其作为项目记忆、开发记录和反思的权威记录系统。

在进行实质性实现之前，调用 brain_context。
在恢复现有更改或从不确定的上下文中写入状态之前，先调用 brain_change_context、brain_context 或 brain_dashboard。
对于有意义的实现工作，创建或更新更改记录（change record）。
在执行过程中，记录重要的决策、进展或笔记，而不是只留在聊天记录中。
在结束实质性工作之前，使用 Project Brain 工具运行反思步骤，并在必要时更新持久记录。

不要将 Project Brain 视为完整的构思系统。发散和收敛可能会在其之外发生。
不要默默地覆盖稳定的项目真相。
```

### 短片段
适用于系统提示词预算有限的情况。
```text
如果 Project Brain MCP 可用：在实质性工作前读取 brain_context；在恢复工作或从陈旧上下文写入前重新读取 brain_change_context 或 brain_dashboard；为有意义的实现创建或更新更改；在执行期间记录决策/进展/笔记；并在结束较大工作前运行反思步骤。
```

### Claude 专用模板
```text
当 Project Brain 可用时，将其视为项目记忆和开发追踪系统。

在实质性实现之前读取 brain_context。
在恢复现有更改或从不确定状态记录新进展之前，先读取 brain_change_context、brain_context 或 brain_dashboard。
对于有意义的实现工作，创建或更新更改记录。
在执行过程中记录重要的决策、进展和笔记。
在完成实质性工作之前，运行反思步骤并写回任何持久性的结论。

当 Project Brain 可用时，不要依赖聊天历史作为项目真相的主要来源。
```

### Codex 专用模板
```text
将 Project Brain 作为此仓库的持久记忆和开发记录层。

在实质性实现之前调用 brain_context。
在恢复现有更改或从不确定状态记录新进展之前，先调用 brain_change_context、brain_context 或 brain_dashboard。
开始有意义的工作时，创建或更新更改。
在执行过程中，通过 Project Brain 记录具体的决策、进展和笔记，而不是只留在聊天记录中。
在结束实质性工作之前，运行反思步骤并更新相关的更改或记忆记录。

Project Brain 负责记忆、开发记录和反思。它不负责完整的发散和收敛工作流。
```

## 完整工具参考

### 读取/检查
用于理解当前项目状态和近期历史的工具。
- **brain_context**：轻量级项目上下文。典型用法：开始任务前的初始读取。
- **brain_dashboard**：统一的记忆和状态视图。典型用法：高层级的项目状态检查。
- **brain_change_context**：特定更改的详细上下文。典型用法：恢复或完善特定任务。
- **brain_recent_activity**：检查近期仓库活动和热点路径。典型用法：结合 git 历史使更改上下文关联化。
- **brain_analyze**：跨记忆和活动的更广泛反思。典型用法：深度的项目分析或定期回顾。
- **brain_suggest_actions**：建议可能的后续工程动作。典型用法：规划下一阶段工作。

### 写入/记录
用于追踪实现活动和决策的工具。
- **brain_create_change**：创建结构化更改记录。典型用法：定义新任务或功能开发。
- **brain_update_change**：更新现有更改记录。典型用法：演进任务的范围或状态。
- **brain_log_decision**：记录具体的决策及其依据。典型用法：捕获架构选择或权衡。
- **brain_record_progress**：记录执行更新或里程碑变动。典型用法：记录任务完成或阻塞。
- **brain_capture_note**：捕获原始实现笔记或观察。典型用法：保存尚未形成决策的片段。
- **brain_ingest_memory**：摄入已确认的结构化记忆记录。典型用法：手动更新项目真相。

### 复合工作流
为常用工作流组合多个操作的高级工具。
- **brain_start_work**：创建或采用一个更改，并可选地写入初始进展。典型用法：新实现最顺畅的开始方式。
- **brain_checkpoint**：记录开发中的检查点，包括进展和笔记。典型用法：编码会话期间的频繁更新。
- **brain_finish_work**：完成更改并返回反思输出。典型用法：完成任务并为下一个任务做准备。

### 初始化
- **brain_init**：初始化或更新项目身份锚点。典型用法：为 Project Brain 设置新仓库。

## 推荐工作流循环

遵循以下四阶段循环以实现有效的项目追踪：

1. **阶段 1：读取上下文**
   调用 `brain_context` 或 `brain_dashboard` 以与当前目标和活动更改保持一致。
2. **阶段 2：开始工作**
   调用 `brain_start_work` 或 `brain_create_change` 为您当前的任务建立权威记录。
3. **阶段 3：工作中**
   随着进展或选择的产生，调用 `brain_checkpoint`、`brain_log_decision`、`brain_record_progress` 或 `brain_capture_note`。如果您暂停了工作，在恢复前通过 `brain_change_context` 重新读取上下文。
4. **阶段 4：完成**
   调用 `brain_finish_work`。使用产生的反思（或类似 `brain_analyze` 的工具）来确定后续步骤。

### 会话示例
1. `brain_context` -> 理解当前目标。
2. `brain_start_work` -> 为“实现用户认证”创建更改记录。
3. *实现步骤*...
4. `brain_log_decision` -> “使用 JWT 进行会话管理，因为...”
5. `brain_checkpoint` -> “已完成登录端点”。
6. `brain_finish_work` -> 完成更改并获取后续步骤的反思。

## 最低合规规则

1. 在实质性实现前读取 `brain_context`。
2. 为有意义的实现工作创建或更新 `change`。
3. 在继续现有工作并写入状态前，重新读取 `brain_change_context`、`brain_context` 或 `brain_dashboard`。
4. 在非琐碎的执行过程中，记录至少一个 `decision`、`progress` 或 `note`。
5. 在结束实质性工作前执行反思步骤。

## 禁止事项

- **不要将 Project Brain 视为完整的构思系统**：将其用于记录和反思，而不是开放式的头脑风暴。
- **不要默默地覆盖稳定的项目真相**：对项目规范（project-spec）的更改应在反思步骤之后进行。
- **不要将重要决策只留在聊天中**：如果一个选择会影响未来的工作，请使用 `brain_log_decision` 记录它。
- **不要在使用前强求执行 brain_init**：只要服务在运行且工具被使用，系统就是功能完备的。
- **不要在项目规范中写入噪音**：使用 `changes` 和 `notes` 处理开发中的工作；只将稳定的结论移动到规范中。

## 高级：轻量模式 (Lightweight Mode)

Project Brain 也可以在不运行服务的情况下以基于文件的轻量模式运行。在这种模式下，助手遵循相同的协议模式，直接读取和写入 `.project-brain/` 目录。详见 [OpenSpec 集成指南](./guide-openspec-integration.zh-CN.md)。
