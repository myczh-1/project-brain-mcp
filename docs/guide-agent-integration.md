# Agent Integration Guide

## Overview

Project Brain provides durable project memory for AI coding assistants via the Model Context Protocol (MCP). This guide covers how to connect, configure, and use Project Brain from any AI assistant to maintain a consistent system of record for project context, development-time recording, and reflection.

## Connection Setup

To integrate an AI assistant with Project Brain, the service must be running locally.

- **Start the service**: `npx @myczh/project-brain`
- **MCP endpoint**: `http://127.0.0.1:3210/mcp`
- **Protocol**: MCP Streamable HTTP

## Host-Specific Configuration

### Cursor
Add Project Brain as an MCP server in Cursor settings (Settings > LSP > MCP).
```json
{
  "project-brain": {
    "type": "http",
    "url": "http://127.0.0.1:3210/mcp"
  }
}
```

### Claude Desktop
Start the Project Brain server in a terminal first:
```bash
npx -y @myczh/project-brain
```
Then add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "project-brain": {
      "url": "http://127.0.0.1:3210/mcp"
    }
  }
}
```
*Note: Claude Desktop connects to the running HTTP server. Keep the terminal open while using Claude Desktop.*

### OpenCode
Add to the `mcpServers` section of your `opencode.json`:
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
In Windsurf settings, add a new MCP server:
- **Name**: project-brain
- **Type**: HTTP
- **URL**: http://127.0.0.1:3210/mcp

### Generic MCP Client
Point your client to the following endpoint:
- **URL**: `http://127.0.0.1:3210/mcp`
- **Method**: POST (for initialization and messages)

## System Prompt Templates

### Generic Snippet
Use this for most AI assistants to ensure they follow the Project Brain protocol.
```text
When Project Brain is available over MCP, use it as the system of record for project memory, development-time recording, and reflection.

Before substantial implementation, call brain_context.
Before resuming an existing change or writing state from uncertain context, call brain_change_context, brain_context, or brain_dashboard first.
For meaningful implementation work, create or update a change record.
During execution, record important decisions, progress, or notes instead of leaving them only in chat.
Before concluding substantial work, run a reflection step using Project Brain tools and update durable records when warranted.

Do not treat Project Brain as a full ideation system. Divergence and convergence may happen outside it.
Do not silently overwrite stable project truth.
```

### Short Snippet
For narrow system prompt budgets.
```text
If Project Brain MCP is available: read brain_context before substantial work, re-read brain_change_context or brain_dashboard before resuming work or writing from stale context, create or update a change for meaningful implementation, record decisions/progress/notes during execution, and run a reflection step before concluding larger work.
```

### Claude-Specific Template
```text
When Project Brain is available, treat it as the project memory and development-trace system.

Read brain_context before substantial implementation.
Before resuming an existing change or recording new progress from uncertain state, read brain_change_context, brain_context, or brain_dashboard first.
For meaningful implementation work, create or update a change record.
Record important decisions, progress, and notes during execution.
Before finishing substantial work, run a reflection step and write back any durable conclusions.

Do not rely on chat history as the main source of project truth when Project Brain is available.
```

### Codex-Specific Template
```text
Use Project Brain as the durable memory and development-recording layer for this repository.

Before substantial implementation, call brain_context.
Before resuming an existing change or recording new progress from uncertain state, call brain_change_context, brain_context, or brain_dashboard first.
When starting meaningful work, create or update a change.
During execution, record concrete decisions, progress, and notes through Project Brain instead of leaving them only in chat.
Before concluding substantial work, run a reflection step and update the relevant change or memory records.

Project Brain is responsible for memory, development-time recording, and reflection. It is not responsible for the full divergence and convergence workflow.
```

## Complete Tool Reference

### Read/Inspect
Tools used to understand current project state and recent history.
- **brain_context**: Lightweight project context. Typical use: Initial read before starting a task.
- **brain_dashboard**: Unified memory and status view. Typical use: High-level project status check.
- **brain_change_context**: Detailed context for a specific change. Typical use: Resuming or refining a specific task.
- **brain_recent_activity**: Inspect recent repository activity and hot paths. Typical use: Contextualizing changes with git history.
- **brain_analyze**: Broader reflection pass across memory and activity. Typical use: Deep project analysis or periodic review.
- **brain_suggest_actions**: Suggest likely next engineering actions. Typical use: Planning the next phase of work.

### Write/Record
Tools used to track implementation activity and decisions.
- **brain_create_change**: Create a structured change record. Typical use: Defining a new task or feature work.
- **brain_update_change**: Update an existing change record. Typical use: Evolving the scope or status of a task.
- **brain_log_decision**: Record a concrete decision with rationale. Typical use: Capturing architecture choices or trade-offs.
- **brain_record_progress**: Record execution updates or milestone movement. Typical use: Logging task completion or blockers.
- **brain_capture_note**: Capture raw implementation notes or observations. Typical use: Saving fragments that aren't yet decisions.
- **brain_ingest_memory**: Ingest a confirmed structured memory record. Typical use: Manual update of project truth.

### Composite Workflows
High-level tools that combine multiple operations for common workflows.
- **brain_start_work**: Create or adopt a change and optionally write initial progress. Typical use: Lowest-friction start for new implementation.
- **brain_checkpoint**: Record an in-progress checkpoint with progress and notes. Typical use: Frequent updates during a coding session.
- **brain_finish_work**: Finalize a change and return reflection outputs. Typical use: Completing a task and preparing for the next.

### Initialize
- **brain_init**: Initialize or update the project identity anchor. Typical use: Setting up a new repository for Project Brain.

## Recommended Workflow Loop

Follow this four-phase loop for effective project tracking:

1. **Phase 1: Read Context**
   Call `brain_context` or `brain_dashboard` to align with current goals and active changes.
2. **Phase 2: Start Work**
   Call `brain_start_work` or `brain_create_change` to establish a system-of-record for your current task.
3. **Phase 3: During Work**
   As you make progress or choices, call `brain_checkpoint`, `brain_log_decision`, `brain_record_progress`, or `brain_capture_note`. If you pause, re-read context via `brain_change_context` before resuming.
4. **Phase 4: Finish**
   Call `brain_finish_work`. Use the resulting reflection (or tools like `brain_analyze`) to determine next steps.

### Example Session
1. `brain_context` -> Understand current goals.
2. `brain_start_work` -> Create change record for "Implement user auth".
3. *Implementation steps*...
4. `brain_log_decision` -> "Using JWT for session management because..."
5. `brain_checkpoint` -> "Completed login endpoint".
6. `brain_finish_work` -> Finalize change and get reflection for next steps.

## Minimum Compliance Rules

1. Read `brain_context` before substantial implementation.
2. Create or update a `change` for meaningful implementation work.
3. Re-read `brain_change_context`, `brain_context`, or `brain_dashboard` before writing state when continuing existing work.
4. Record at least one of `decision`, `progress`, or `note` during non-trivial execution.
5. Perform a reflection step before concluding substantial work.

## What Not To Do

- **Do not treat Project Brain as a full ideation system**: Use it for recording and reflection, not for open-ended brainstorming.
- **Do not silently overwrite stable project truth**: Changes to project-spec should follow a reflection pass.
- **Do not leave important decisions only in chat**: If a choice affects future work, record it with `brain_log_decision`.
- **Do not require brain_init before use**: The system is functional as long as the service is running and tools are used.
- **Do not write noise into project-spec**: Use `changes` and `notes` for in-progress work; only move stable conclusions to the spec.

## Advanced: Lightweight Mode

Project Brain can also operate in a file-based Lightweight Mode without the service running. In this mode, assistants read and write directly to the `.project-brain/` directory following the same protocol schemas. See the [OpenSpec Integration Guide](./guide-openspec-integration.md) for more details.
