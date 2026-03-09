# ProjectBrain MCP Architecture Specification

## 1. Overview

ProjectBrain is a **Model Context Protocol (MCP) server** designed to provide structured project memory and context to AI coding agents.

Its purpose is to enable AI agents to:

* understand project goals
* analyze development progress
* infer project milestones
* access historical development signals

ProjectBrain acts as a **long-term project memory layer** for AI coding systems.

Typical consumers include:

* AI coding agents (Hephaestus, Oracle, etc.)
* developer assistants
* project analysis tools

---

# 2. System Role in AI Development Architecture

ProjectBrain is positioned between **AI agents** and **project data sources**.

```
AI Agent
   │
   │ tool calls
   ▼
MCP Client Runtime
   │
   │ stdio
   ▼
ProjectBrain MCP Server
   │
   ├── git repository
   ├── brain storage
   └── project metadata
```

ProjectBrain aggregates information from:

* git history
* stored project knowledge
* inferred development signals

and exposes them as **MCP tools**.

---

# 3. Core Responsibilities

ProjectBrain performs four main functions.

### 3.1 Project Context Storage

Stores high-level information about the project:

* project purpose
* architecture
* technology stack
* core modules

This allows AI agents to understand the **intent of the project**.

---

### 3.2 Development Progress Inference

Analyzes signals such as:

* git commits
* recent development changes
* developer input

to infer:

* current focus
* recent progress
* possible milestone activity

---

### 3.3 Milestone Signal Detection

ProjectBrain does not enforce milestone progression.

Instead, it produces **signals suggesting milestone alignment**.

Example:

```
Recent activity: implemented MCP server
Possible milestone: tool integration
Confidence: mid
```

This avoids hard-coding project workflows.

---

### 3.4 Long-Term Memory for AI Agents

Unlike normal chat-based AI tools, ProjectBrain provides **persistent project knowledge**.

Agents can retrieve structured information instead of repeatedly re-analyzing codebases.

---

# 4. MCP Tool Interface

ProjectBrain exposes the following MCP tools.

## 4.1 brain_init

Initialize project goals once with user-confirmed answers.

### Input

```
{
  "goal_confirmation": {
    "confirmed_by_user": true,
    "goal_horizon": "final",
    "source": "user confirmation or approved PRD"
  },
  "answers": {
    "project_name": "string",
    "one_liner": "string",
    "goals": ["string"],
    "constraints": ["string"],
    "tech_stack": ["string"]
  },
  "force_goal_update": false,
  "update_reason": "string"
}
```

### Behavior

Creates initial manifest on first call. If already initialized, returns already_initialized unless force_goal_update=true with update_reason.
The call is rejected with need_more_info unless goal_confirmation explicitly marks goals as user-confirmed final goals.

---

## 4.2 brain_recent_activity

Retrieve recent git activity signals.

### Input

```
{
  "limit": number
}
```

### Output

```
{
  "commits": [
    {
      "message": "string",
      "author": "string",
      "date": "string"
    }
  ]
}
```

---

## 4.3 brain_context

Returns stored project context.

### Output

```
{
  "project_name": "string",
  "goal": "string",
  "tech_stack": ["string"],
  "core_modules": ["string"]
}
```

---

## 4.4 brain_record_progress

Stores inferred progress signals.

### Input

```
{
  "summary": "string",
  "confidence": "low | mid | high"
}
```

---

# 5. Brain Storage Structure

ProjectBrain maintains structured project memory.

```
.project-brain/
 ├── manifest.json
 ├── milestones.json
 ├── progress.json
 ├── decisions.json
 ├── notes.ndjson
 └── next_actions.json
```

Each file serves a specific purpose.

---

## manifest.json

Project goal anchor initialized by `brain_init`.

Example:

```
{
  "project_name": "ProjectBrain",
  "one_liner": "Enable AI to understand project progress",
  "goals": ["Provide stable project context for coding agents"],
  "tech_stack": ["Node", "TypeScript"],
  "core_modules": [
    "progress-understanding",
    "milestone-signal"
  ]
}
```

---

## milestones.json

Optional milestone signals inferred by AI.

```
[
  {
    "name": "MCP Server Implementation",
    "status": "in_progress"
  }
]
```

---

## progress.json

Records inferred development progress.

```
[
  {
    "date": "2026-03-05",
    "summary": "Implemented MCP server interface",
    "confidence": "high"
  }
]
```

---

## decisions.json

Stores important project decisions.

```
[
  {
    "decision": "Use MCP as tool protocol",
    "reason": "Agent interoperability"
  }
]
```

---

# 6. Agent Interaction Model

Typical interaction flow:

```
User
 │
 ▼
AI Agent
 │
 │ tool call
 ▼
ProjectBrain MCP
 │
 ▼
Structured Project Data
```

Example agent reasoning process:

```
Agent receives user query:
"What has been done recently in this project?"

Agent actions:

1. call brain_recent_activity
2. call brain_context
3. combine signals
4. produce summary
```

---

# 7. Integration with OpenCode / AI Agent Systems

ProjectBrain should be registered as an MCP server.

Example configuration:

```
{
  "mcpServers": {
    "project-brain": {
      "command": "node",
      "args": [
        "/path/to/ProjectBrain/dist/index.js"
      ]
    }
  }
}
```

Agents can then invoke ProjectBrain tools as needed.

---

# 8. Design Principles

ProjectBrain follows several principles.

### 8.1 Signal Over Assertion

The system produces **signals** instead of enforcing project states.

### 8.2 Minimal Developer Intervention

Developers should not need to manually maintain project state.

### 8.3 Structured AI Memory

All stored information must be structured and machine-readable.

### 8.4 Non-Intrusive Operation

ProjectBrain should not modify project code or workflow.

It only observes and records signals.

---

# 9. Future Extensions

Possible future capabilities:

* commit semantic analysis
* milestone prediction
* development velocity estimation
* multi-project knowledge linking
* AI-driven project retrospectives

---

# 10. Summary

ProjectBrain is a **persistent project memory layer for AI coding systems**.

It enables AI agents to:

* access structured project context
* infer development progress
* detect milestone signals
* maintain long-term project understanding

Through the MCP protocol, it integrates naturally with modern AI agent ecosystems.
