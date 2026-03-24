# Project Brain

Project memory and execution context engine for AI coding agents.

Project Brain is an MCP server that helps agents understand a repository through layered memory:

- `manifest`: project identity anchor
- `project-spec`: stable governance rules
- `change-spec`: single-change contract
- `decisions`: rationale log
- `notes`: raw observations
- `progress / milestones`: execution facts
- `git / hot paths`: code evidence

It also exposes a read-only `MCP Apps` dashboard surface through `brain_dashboard` for hosts that support embedded app UIs. Hosts without Apps support still receive the same summary and structured data as normal tool output.

It is designed to answer two different questions:

- "What kind of project is this?"
- "What should an agent know before executing this change?"

## Positioning

Project Brain is not just another spec workflow tool.

- OpenSpec focuses on defining structured changes
- Project Brain focuses on combining project memory, historical decisions, and code evidence into agent-ready context

Project Brain can also consume OpenSpec change inputs from `openspec/changes/` as a read-only source when generating change context.

## Quick Start

Run the MCP server:

```bash
npx -y @myczh/project-brain
```

If you see:

```text
Project Brain MCP server running on stdio
```

the server started successfully.

## Add to MCP Client

### OpenCode

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "project-brain": {
      "type": "local",
      "command": ["npx", "-y", "@myczh/project-brain"],
      "enabled": true
    }
  }
}
```

### Claude Desktop

Update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "@myczh/project-brain"]
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "@myczh/project-brain"]
    }
  }
}
```

## Memory Layout

Project Brain stores data in `.project-brain/`:

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

### Layer responsibilities

- `manifest.json`: project identity only
- `project-spec.json`: stable rules that stay valid across multiple changes
- `changes/<id>.json`: the contract for one change
- `decisions.ndjson`: concrete decisions and rationale
- `notes.ndjson`: temporary or raw observations
- `progress.ndjson`: execution facts, blockers, current status
- `milestones.json`: milestone state used for broader analysis

## Architecture

Project Brain is now split into explicit layers:

- `src/core`
  - file-backed memory storage
  - git evidence and repository inspection
  - inference and recommendation logic
- `src/service`
  - product-facing use cases such as initialization, memory ingest, context building, and dashboard data assembly
- `src/transports/mcp`
  - MCP protocol adapter, tool registry, and resource registry
- `src/app`
  - runtime entrypoints
  - current MCP stdio bootstrap
  - future local server bootstrap placeholder

Current production entry remains MCP over `stdio`.
The split is intended to make future MCP over HTTP and custom web UI work reuse the same service layer.

## Available Tools

### Initialize

- `brain_init`: initialize or update the project identity anchor

### Inspect

- `brain_dashboard`: inspect the current project memory and status through a unified dashboard view

### Execution Context

- `brain_context`: get lightweight context for everyday coding conversations
- `brain_change_context`: get detailed context for a specific change before larger decisions or implementations

### Update Memory

- `brain_ingest_memory`: validate and ingest a structured memory record from user input or GPT output

## MCP Apps Notes

- `brain_dashboard` keeps the existing `stdio` workflow intact. No extra port or web server is required.
- Hosts with MCP Apps support can render the dashboard resource inline through `ui://project-brain/dashboard`.
- Hosts without MCP Apps support still get:
  - a compact text summary
  - the full dashboard payload in `structuredContent`
  - a `resource_link` to `ui://project-brain/dashboard`

## Example Flow

1. Initialize the project identity with `brain_init`
2. Ingest confirmed project memory or GPT-structured results with `brain_ingest_memory`
3. Ask `brain_context` for lightweight day-to-day coding context
4. Ask `brain_change_context` for detailed change execution context
5. Use `brain_dashboard` to inspect the current project memory and status

## GPT Collaboration Loop

Use GPT for convergence, not as the memory system and not as the executor.

Standard loop:

1. Use GPT to discuss and converge
2. Ask GPT for a ProjectBrain-structured result
3. Confirm manually
4. Call `brain_ingest_memory`
5. Use `brain_change_context` for execution

Recommended GPT prompt:

```text
把我们刚才的讨论整理成可写入 ProjectBrain 的结构化结论，并标明 type。不要解释，只输出 JSON。
```

Example ingest request:

```json
{
  "memory": {
    "type": "decision",
    "confirmed_by_user": true,
    "payload": {
      "title": "Separate identity and governance",
      "decision": "Keep manifest as identity anchor and move stable rules to project-spec",
      "rationale": "This avoids overlap between identity and governance layers",
      "scope": "project"
    }
  }
}
```

`brain_ingest_memory` is intentionally single-record and create-first:

- it validates the payload
- it routes the record to the right internal ProjectBrain layer
- it rejects silent overwrites of existing project spec or change spec
- it keeps execution agents dependent on ProjectBrain context, not GPT chat history

## OpenSpec Compatibility

Project Brain does not depend on OpenSpec, but it can read change intent from:

- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>.md`

Compatibility is read-only in this version. Project Brain keeps its own memory layers for identity, stable rules, decisions, and progress.

## Local Development

```bash
git clone https://github.com/myczh-1/project-brain-mcp
cd project-brain-mcp
pnpm install
pnpm build
pnpm dev
```

## License

MIT
