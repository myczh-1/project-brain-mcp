# Project Brain MCP 使用指南

## 目录
- [快速开始](#快速开始)
- [配置 MCP 客户端](#配置-mcp-客户端)
- [可用工具](#可用工具)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

---

## 快速开始

### 1. 安装依赖

```bash
cd /Users/huanghe/Documents/project/node/ProjectBrain
npm install
npm run build
```

### 2. 验证安装

```bash
node dist/index.js
# 应该看到: Project Brain MCP server running on stdio
```

按 `Ctrl+C` 退出。

---

## 配置 MCP 客户端

### 方式 1: 使用本地路径（开发模式）

在你的 AI 客户端配置文件中添加：

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "project-brain": {
      "command": "node",
      "args": ["/Users/huanghe/Documents/project/node/ProjectBrain/dist/index.js"]
    }
  }
}
```

**Cursor / VS Code** (`.cursor/mcp.json` 或 `.vscode/mcp.json`):
```json
{
  "mcpServers": {
    "project-brain": {
      "command": "node",
      "args": ["/Users/huanghe/Documents/project/node/ProjectBrain/dist/index.js"]
    }
  }
}
```

### 方式 2: 使用 npx（发布后）

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "project-brain"]
    }
  }
}
```

### 3. 重启 AI 客户端

配置完成后，重启你的 AI 客户端（Claude Desktop / Cursor / VS Code）。

---

## 可用工具

Project Brain 提供 7 个 MCP 工具：

### 1. `brain_init` - 初始化项目

**用途**: 收集并校验项目长期目标；仅在明确用户确认后才会写入 manifest（默认只初始化一次）

**初始化策略**:
- `answers` 可分步提供（不再要求首次调用就填满）
- 如果缺字段，返回 `need_more_info` + `questions` + `draft_manifest`（不会写文件）
- 只有显式确认后才允许写入：`confirmed_by_user=true`
- 写入前必须提供确认来源：`goal_confirmation_source`（兼容旧字段 `goal_confirmation.source`）
- 可选（可为空/草稿）: `constraints`, `tech_stack`, `locale`
- 已初始化后默认返回 `already_initialized`
- 仅在用户明确要求改目标时，使用 `force_goal_update=true` + `update_reason`

**参数**:
```json
{
  "confirmed_by_user": true,
  "goal_confirmation_source": "user message: confirmed final product goals",
  "answers": {
    "project_name": "你的项目名",
    "one_liner": "一句话描述项目",
    "goals": ["目标1", "目标2"],
    "constraints": ["约束条件"],
    "tech_stack": ["技术栈"],
    "locale": "zh-CN"
  }
}
```

**示例**:
```json
{
  "confirmed_by_user": true,
  "goal_confirmation_source": "PRD v1.2 confirmed by product owner",
  "answers": {
    "project_name": "My Awesome App",
    "one_liner": "A revolutionary task management tool",
    "goals": [
      "Build intuitive UI",
      "Support real-time collaboration"
    ],
    "constraints": [
      "Must work offline",
      "Use TypeScript"
    ],
    "tech_stack": [
      "React",
      "Node.js",
      "PostgreSQL"
    ]
  }
}
```

---

### 2. `brain_context` - 获取项目上下文

**用途**: 生成 AI 可读的完整项目上下文（包含进度估计和下一步建议）

**参数**:
```json
{
  "depth": "normal",              // "short" | "normal"
  "include_recent_activity": true,
  "recent_commits": 30
}
```

**返回内容**:
- 项目目标和技术栈
- 当前开发焦点
- 里程碑进度估计（带百分比和解释）
- 建议的下一步行动（按优先级排序）
- 最近的提交活动
- 关键决策记录

---

### 3. `brain_recent_activity` - 查看最近活动

**用途**: 获取 Git 提交历史和热点路径

**参数**:
```json
{
  "limit": 50,        // 返回的提交数量
  "since_days": 7     // 最近 N 天的提交
}
```

**返回**:
```json
{
  "commits": [
    {
      "hash": "abc123",
      "time": "2026-03-05 14:53:37",
      "author": "huanghe",
      "message": "实现新功能",
      "tag": "feat",
      "files_changed_count": 3
    }
  ],
  "hot_paths": [
    {
      "path": "src/components",
      "change_count": 15
    }
  ]
}
```

---

### 4. `brain_estimate_progress` - 估计里程碑进度 ⭐ 新功能

**用途**: 自动计算里程碑完成度（0-100%），带可解释的依据

**参数**:
```json
{
  "milestone_name": "可选：指定里程碑名称",
  "recent_commits": 50
}
```

**返回示例**:
```json
{
  "estimations": [
    {
      "milestone_name": "用户认证功能",
      "percentage": 65,
      "confidence": "mid",
      "explanation": "65% complete because:\n- 8 of 20 recent commits match milestone keywords (40% weight → 32%)\n- Hot paths match: src/auth (30% weight → 25%)\n- 5 related commits in last 7 days (30% weight → 8%)\nConfidence: mid",
      "contributing_signals": [
        {
          "signal_type": "commit_activity",
          "weight": 0.4,
          "value": 80,
          "description": "8 of 20 recent commits match milestone keywords"
        }
      ]
    }
  ]
}
```

**计算方法**:
- **40% 权重**: 提交活跃度（匹配里程碑关键词的提交比例）
- **30% 权重**: 热点路径匹配（活跃开发区域是否与里程碑相关）
- **30% 权重**: 时间活跃度（最近活动的新鲜度）

---

### 5. `brain_suggest_actions` - 推荐下一步行动 ⭐ 新功能

**用途**: 基于项目状态生成优先级排序的任务建议

**参数**:
```json
{
  "limit": 5,                          // 返回数量
  "filter_by_milestone": "可选：里程碑名称",
  "recent_commits": 50
}
```

**返回示例**:
```json
{
  "next_actions": [
    {
      "id": "milestone-user-auth",
      "title": "Complete: 用户认证功能",
      "description": "Work on completing the 用户认证功能 milestone. Currently at 65%.",
      "priority_score": 100,
      "reasoning": "Milestone is in_progress. Currently at 65%. high confidence in estimate.",
      "impact": 3,
      "effort": 2,
      "confidence": "high",
      "related_milestone": "用户认证功能",
      "suggested_by": "milestone_tracking"
    },
    {
      "id": "hotpath-src-auth",
      "title": "Continue work in src/auth",
      "description": "This area has 15 recent changes. Consider completing related tasks or adding tests.",
      "priority_score": 67,
      "reasoning": "High activity area (15 changes). Momentum suggests continuing here.",
      "impact": 2,
      "effort": 2,
      "confidence": "mid",
      "suggested_by": "hot_path_analysis"
    }
  ],
  "reasoning_summary": "Generated 5 candidate actions from signals: milestone_tracking, hot_path_analysis, decision_analysis. Top 5 actions selected by RICE scoring."
}
```

**推荐来源**:
- `milestone_tracking`: 未完成的里程碑
- `stall_detection`: 7 天以上无活动的里程碑
- `hot_path_analysis`: 当前活跃的开发区域
- `decision_analysis`: 最近决策中提到的行动

**优先级算法**: RICE 评分 = (Impact × Confidence) / Effort × 100

---

### 6. `brain_record_progress` - 记录进度/决策/里程碑

**用途**: 手动记录开发进度、关键决策或里程碑状态

**记录进度**:
```json
{
  "type": "progress",
  "progress": {
    "summary": "完成了用户登录功能",
    "confidence": "high"
  }
}
```

**记录决策**:
```json
{
  "type": "decision",
  "decision": {
    "decision": "使用 JWT 进行身份验证",
    "reason": "更适合无状态 API，易于扩展"
  }
}
```

**记录里程碑**:
```json
{
  "type": "milestone",
  "milestone": {
    "name": "用户认证功能",
    "status": "in_progress",
    "confidence": "high"
  }
}
```

**里程碑状态**:
- `not_started`: 未开始
- `in_progress`: 进行中
- `completed`: 已完成

---

### 7. `brain_capture_note` - 捕获笔记

**用途**: 记录项目相关的想法、未知问题等

**参数**:
```json
{
  "note": "需要调研 Redis 集群方案",
  "tags": ["unknown", "infrastructure"]
}
```

**常用标签**:
- `unknown`: 未知问题
- `decision`: 待决策事项
- `milestone`: 里程碑相关
- `technical-debt`: 技术债务

---

## 使用示例

### 场景 1: 新项目初始化

```bash
# 1. 初始化项目信息
AI: 使用 brain_init 工具
{
  "answers": {
    "project_name": "TaskMaster",
    "one_liner": "智能任务管理系统",
    "goals": ["提高团队协作效率", "支持多平台"],
    "tech_stack": ["React", "Node.js", "MongoDB"]
  }
}

# 2. 创建第一个里程碑
AI: 使用 brain_record_progress 工具
{
  "type": "milestone",
  "milestone": {
    "name": "项目基础架构",
    "status": "in_progress"
  }
}

# 3. 获取项目上下文
AI: 使用 brain_context 工具
```

---

### 场景 2: 日常开发中查看进度

```bash
# 1. 查看所有里程碑的进度
AI: 使用 brain_estimate_progress 工具
{}

# 2. 获取下一步建议
AI: 使用 brain_suggest_actions 工具
{
  "limit": 3
}

# 3. 查看完整项目上下文（包含进度和建议）
AI: 使用 brain_context 工具
{
  "depth": "normal",
  "recent_commits": 50
}
```

---

### 场景 3: 记录关键决策

```bash
# 开发过程中做了重要决策
AI: 使用 brain_record_progress 工具
{
  "type": "decision",
  "decision": {
    "decision": "采用微服务架构",
    "reason": "便于团队并行开发，易于扩展"
  }
}

# 记录进度
AI: 使用 brain_record_progress 工具
{
  "type": "progress",
  "progress": {
    "summary": "完成了 API Gateway 设计",
    "confidence": "high"
  }
}
```

---

### 场景 4: 里程碑管理

```bash
# 1. 创建新里程碑
AI: 使用 brain_record_progress 工具
{
  "type": "milestone",
  "milestone": {
    "name": "用户认证系统",
    "status": "not_started"
  }
}

# 2. 开始工作后更新状态
AI: 使用 brain_record_progress 工具
{
  "type": "milestone",
  "milestone": {
    "name": "用户认证系统",
    "status": "in_progress"
  }
}

# 3. 查看进度估计
AI: 使用 brain_estimate_progress 工具
{
  "milestone_name": "用户认证系统"
}

# 4. 完成后标记
AI: 使用 brain_record_progress 工具
{
  "type": "milestone",
  "milestone": {
    "name": "用户认证系统",
    "status": "completed"
  }
}
```

---

## 最佳实践

### 1. 初始化项目时

✅ **推荐做法**:
- 填写清晰的项目目标（3-5 个）
- 列出关键约束条件（技术、时间、资源）
- 明确技术栈

❌ **避免**:
- 目标过于宽泛（"做一个好产品"）
- 遗漏关键技术栈信息

---

### 2. 里程碑管理

✅ **推荐做法**:
- 里程碑名称清晰具体（"用户认证功能" 而非 "后端开发"）
- 及时更新状态（not_started → in_progress → completed）
- 里程碑粒度适中（1-2 周完成）

❌ **避免**:
- 里程碑过大（"完成整个项目"）
- 长期不更新状态

---

### 3. 进度估计

✅ **理解进度计算**:
- 进度基于 Git 提交历史自动计算
- 提交信息中包含里程碑关键词会提高匹配度
- 例如：里程碑 "用户认证功能"，提交信息写 "实现用户登录接口" 会被识别

✅ **提高准确性**:
```bash
# 好的提交信息
git commit -m "实现用户认证：添加 JWT token 生成"
git commit -m "用户认证：完成密码加密逻辑"

# 不好的提交信息
git commit -m "update"
git commit -m "fix bug"
```

---

### 4. 使用建议

✅ **日常工作流**:
1. 早上：查看 `brain_suggest_actions` 了解优先级
2. 开发中：使用 `brain_record_progress` 记录关键决策
3. 晚上：查看 `brain_estimate_progress` 了解进度

✅ **团队协作**:
- 定期更新里程碑状态
- 记录重要决策的原因
- 使用 `brain_context` 让新成员快速了解项目

---

### 5. 数据存储位置

所有数据存储在项目根目录的 `.project-brain/` 文件夹：

```
.project-brain/
├── manifest.json          # 项目基本信息
├── milestones.json        # 里程碑列表
├── progress.json          # 进度记录
├── decisions.json         # 决策记录
├── notes.ndjson          # 笔记流
└── next_actions.json     # 推荐行动（自动生成）
```

**建议**: 将 `.project-brain/` 加入 Git 版本控制，团队共享项目上下文。

---

## 故障排查

### 问题 1: MCP 工具不显示

**检查步骤**:
1. 确认配置文件路径正确
2. 重启 AI 客户端
3. 查看客户端日志（通常在 `~/Library/Logs/Claude/` 或类似位置）

### 问题 2: 进度估计不准确

**可能原因**:
- 提交信息中缺少里程碑关键词
- 里程碑名称过于宽泛
- 最近提交数量不足（建议至少 20+ 提交）

**解决方案**:
- 优化提交信息，包含里程碑相关关键词
- 调整 `recent_commits` 参数（默认 50）

### 问题 3: 没有推荐行动

**可能原因**:
- 没有创建里程碑
- 所有里程碑都已完成
- 最近无 Git 活动

**解决方案**:
- 使用 `brain_record_progress` 创建里程碑
- 确保里程碑状态为 `in_progress`

---

## 高级用法

### 1. 多项目管理

可以为不同项目使用不同的 `repo_path` 参数：

```json
{
  "repo_path": "/path/to/another/project"
}
```

### 2. 自定义分析深度

调整 `recent_commits` 参数来控制分析的历史深度：

```json
{
  "recent_commits": 100  // 分析最近 100 次提交
}
```

### 3. 过滤特定里程碑的建议

```json
{
  "filter_by_milestone": "用户认证功能",
  "limit": 3
}
```

---

## 反馈与支持

- **问题反馈**: [GitHub Issues](https://github.com/your-repo/project-brain/issues)
- **功能建议**: 欢迎提交 PR 或 Issue

---

## 更新日志

### v0.0.2 (2026-03-05)
- ✨ 新增 `brain_estimate_progress` 工具
- ✨ 新增 `brain_suggest_actions` 工具
- 🎯 `brain_context` 自动包含进度估计和行动建议
- 📊 基于 RICE 算法的优先级排序

### v0.0.1 (2026-03-05)
- 🎉 初始版本发布
- ✅ 基础项目上下文管理
- ✅ Git 活动分析
- ✅ 进度和决策记录
