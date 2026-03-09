

Project Brain MCP

AI Project Context Engine

Architecture & Implementation Spec

⸻

1 项目目标

Project Brain 是一个 MCP (Model Context Protocol) server，用于帮助 AI coding agent 理解项目。

它通过读取：
•	本地 Git 历史
•	项目初始化信息
•	用户补充 notes

生成一个稳定的 Project Context，供 AI 使用。

目标解决的问题：

AI coding agent 缺少项目意图上下文

例如 AI 通常不知道：
•	项目目标
•	当前开发阶段
•	最近开发重点
•	已完成模块
•	未确认事项

Project Brain 提供这些信息。

⸻

2 设计原则

系统设计遵循以下原则：

AI First

系统主要为 AI 调用，而不是人类 UI。

Local First

所有数据保存在本地 repo：

.project-brain/

Zero Setup

用户无需安装依赖，只需要：

npx project-brain

Deterministic First

优先使用：
•	Git 解析
•	规则推断

LLM 推断为可选增强。

Minimal Surface

MVP 只提供少量 tools。

⸻

3 系统架构

整体结构：

+----------------------+
| AI Client            |
| Cursor / OpenCode    |
| Claude Code          |
+----------+-----------+
|
| MCP (stdio)
|
+----------v-----------+
| Project Brain MCP    |
| Server               |
|                      |
| Tools:               |
| - brain_init         |
| - brain_context      |
| - brain_recent_activity |
| - brain_suggest_actions |
| - brain_capture_note |
+----------+-----------+
|
|
v
+----------------------+
| Local Repository     |
|                      |
| git history          |
| .project-brain/      |
+----------------------+


⸻

4 MCP Transport

本项目使用：

stdio transport

原因：
•	不需要端口
•	更安全
•	与 AI client 生命周期绑定
•	更适合 npx 启动

AI client 启动方式：

command: npx
args: ["-y", "project-brain"]


⸻

5 工具（Tools / Skills）

MVP 提供 4+1 tools。

⸻

5.1 brain_init

初始化项目长期目标（默认一次）。

创建：

.project-brain/manifest.json

Input

{
"repo_path": "optional",
"force_goal_update": false,
"update_reason": "required when force_goal_update=true",
"goal_confirmation": {
"confirmed_by_user": true,
"goal_horizon": "final",
"source": "user confirmation or approved product document"
},
"answers": {
"project_name": "",
"one_liner": "",
"goals": ["at least one goal"],
"constraints": [],
"tech_stack": [],
"locale": "optional"
}

Guardrail: brain_init requires goal_confirmation.confirmed_by_user=true and
goal_confirmation.goal_horizon="final" so stored goals are final project goals,
not current implementation snapshots.
}

Output

初始化成功：

{
"status": "ok",
"manifest": {...},
"manifest_path": ".project-brain/manifest.json"
}

已初始化（默认）：

{
"status": "already_initialized",
"manifest": {...},
"manifest_path": ".project-brain/manifest.json"
}

显式改目标：

{
"status": "goal_updated",
"manifest": {...},
"manifest_path": ".project-brain/manifest.json"
}

需要补充信息：

{
"status": "need_more_info",
"questions": [...]
}


⸻

5.2 brain_recent_activity

读取最近 Git 活动。

Input

{
"limit": 50,
"since_days": 7
}

Output

{
"commits": [
{
"hash": "",
"time": "",
"author": "",
"message": "",
"tag": "feat|fix|refactor|docs|test|chore|other",
"files_changed_count": 0
}
],
"hot_paths": [
{
"path": "",
"change_count": 0
}
],
"summary": ""
}


⸻

5.3 brain_context

生成 AI 使用的项目上下文。

Input

{
"depth": "short|normal",
"include_recent_activity": true,
"recent_commits": 30
}

Output

{
"context_text": "...",
"structured": {...}
}


⸻

6 Context 模板

AI 使用的文本结构：

# Project Context

## One-liner
...

## Goals
- ...

## Constraints & Tech
- ...

## Current inferred focus
...
confidence: mid

## Recent activity
- commit summary

## Unknowns
- ...


⸻

7 Git 数据获取

使用 git CLI。

Repo root

git rev-parse --show-toplevel

Commit log

git log -n N --date=iso --pretty=format:%H%x1f%ad%x1f%an%x1f%s

Files changed

git show --name-only --pretty=format: HASH


⸻

8 Commit 分类

根据 commit message：

feat:
fix:
refactor:
docs:
test:
chore:

否则：

other


⸻

9 Hot Paths 计算

统计最近 commits 的文件路径。

路径归一化：

src/tools/projectInit.ts
→ src/tools

聚合 change_count。

⸻

10 本地数据结构

项目 root：

.project-brain/

结构：

.project-brain/
manifest.json
notes.ndjson
cache.json
snapshots/


⸻

11 manifest.json

{
"project_name": "",
"one_liner": "",
"goals": [],
"constraints": [],
"tech_stack": [],
"created_at": ""
}


⸻

12 notes.ndjson

每行一个 JSON：

{"id":"...","time":"...","tags":["decision"],"note":"..."}


⸻

13 代码结构

project-brain/
package.json
tsconfig.json

src/
index.ts

    tools/
      projectInit.ts
      projectContext.ts
      recentActivity.ts
      suggestNext.ts
      captureNote.ts

    git/
      gitExec.ts
      parseLog.ts
      hotPaths.ts

    storage/
      repoRoot.ts
      brainDir.ts
      manifest.ts
      notes.ts

    understanding/
      inferFocus.ts
      contextTemplate.ts


⸻

14 npm 发布结构

package.json：

{
"name": "project-brain",
"version": "0.0.1",
"type": "module",
"bin": {
"project-brain": "./dist/index.js"
},
"files": ["dist"]
}

用户运行：

npx project-brain


⸻

15 MCP 配置示例

AI client config：

{
"mcpServers": {
"project-brain": {
"command": "npx",
"args": ["-y", "project-brain"]
}
}
}


⸻

16 开发流程

开发者流程：

pnpm install
pnpm dev
pnpm build
npm publish

用户流程：

npx project-brain


⸻

17 MVP 验收标准

必须满足：

1

brain_init

创建 manifest.json

2

brain_recent_activity

返回 commits

3

brain_context

返回稳定 context

4

brain_capture_note

写入 notes

⸻

18 后续版本规划

未来扩展：

1 项目阶段识别

project_stage
milestone_signal

2 issue / PR 分析

GitHub / GitLab integration

3 多 repo workspace

monorepo support

4 LLM 推断增强
•	focus inference
•	milestone detection
•	architecture inference

⸻

19 开发复杂度预估

MVP 规模：

400 — 800 行代码

模块：
•	MCP server
•	git parser
•	storage
•	tools

⸻

20 OpenCode 初始化任务

第一步：

创建项目结构：

src/index.ts
src/tools/*
src/git/*
src/storage/*

第二步：

实现 MCP server

第三步：

实现：

brain_init
brain_recent_activity
brain_context

第四步：

实现 git parser。
