# Project Brain

Durable project memory for AI-assisted development.

> Mainline guarantee: Project Brain currently guarantees only the stable protocol contract in [`protocol/`](./protocol/README.md).
> Service mode, MCP tool surface, and dashboard views are optional runtime convenience layers.

## What It Does

- Provides a durable project memory mechanism for AI-assisted development loops.
- Stores project context, changes, decisions, and progress in the `.project-brain/` directory.
- Supports two usage modes over the same stable protocol: an optional Service Mode (HTTP/MCP) and a Lightweight Mode (direct file access).

## Two Usage Modes

### Service Mode (HTTP + MCP)

Run `npx @myczh/project-brain` to start a full server with an HTTP API and an MCP endpoint. This mode is ideal for teams, CI/CD pipelines, and multi-agent setups where a centralized coordination service is required.

### Lightweight/Skill Mode (file-based)

In this mode, no server is required. AI assistants read and write to the `.project-brain/` directory directly by following the established protocol. This is typically used alongside OpenSpec for single-developer + AI workflows.

## Choose Your Setup

- Already using OpenSpec: use `npx -y @myczh/project-brain setup` and choose Lightweight mode. This is the recommended path when OpenSpec is already present in the repository.
- Need MCP/HTTP access for Cursor, Claude Desktop, OpenCode, or a local dashboard: use `npx -y @myczh/project-brain setup` and choose Service mode.
- Want both: choose Both during setup. Lightweight mode stays the default day-to-day repository workflow, while the service remains available for MCP clients.

## Quick Start (Service Mode)

1. Start the service:
   ```bash
   npx -y @myczh/project-brain
   ```
2. Verify the service is running:
   ```bash
   curl http://127.0.0.1:3210/health
   ```
3. Connect your MCP client to the endpoint:
   ```text
   http://127.0.0.1:3210/mcp
   ```

## Quick Start (Lightweight Mode)

For detailed instructions, see [docs/guide-openspec-integration.md](./docs/guide-openspec-integration.md). In brief, the AI assistant reads the definitions in `protocol/` and writes structured data to `.project-brain/` directly.

## CLI Commands

- `project-brain`: Start the HTTP/MCP service.
- `project-brain setup`: Detect repository context, recommend Lightweight vs Service mode, and initialize `.project-brain/`.
- `project-brain doctor`: Check whether the repository and local service are ready.
- `project-brain init`: Create the minimal `.project-brain/` setup for the current repository.

## Core Data Model

Project Brain manages structured state within the `.project-brain/` directory:

- `manifest.json`: Optional project identity (name, summary, stack).
- `project-spec.json`: Stable project truth and architectural rules.
- `changes/`: Directory containing structured records for individual changes.
- `decisions.ndjson`: Rationale for project and implementation decisions.
- `notes.ndjson`: Raw observations and unresolved fragments.
- `progress.ndjson`: Execution updates, blockers, and status.
- `milestones.json`: Broad phase and milestone tracking.

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

## Optional MCP Tool Surface (Runtime Convenience)

### Read/Inspect
- `brain_dashboard`: Inspect the current project memory and status through a unified dashboard view.
- `brain_context`: Get lightweight project context for day-to-day execution.
- `brain_change_context`: Get detailed context for a specific change before implementation.
- `brain_recent_activity`: Inspect recent repository activity and hot paths.
- `brain_analyze`: Run a broader reflection pass across memory and activity.
- `brain_suggest_actions`: Suggest likely next engineering actions.

### Write/Record
- `brain_create_change`: Create a structured change record for a task.
- `brain_start_work`: Create or adopt a change and optionally write initial progress.
- `brain_checkpoint`: Record an in-progress checkpoint with progress and notes.
- `brain_finish_work`: Mark a change done/dropped and return reflection.
- `brain_update_change`: Update an existing change record.
- `brain_log_decision`: Record a concrete decision with its rationale.
- `brain_record_progress`: Record progress or milestone updates.
- `brain_capture_note`: Capture raw implementation notes or observations.
- `brain_ingest_memory`: Ingest a confirmed structured memory record.

### Initialize
- `brain_init`: Initialize or update the project identity anchor.

## HTTP API

- `GET /`: Service index.
- `GET /health`: Health check.
- `GET /api`: API endpoint index.
- `GET /ui`: Dashboard UI prototype.
- `GET /api/dashboard`: Get dashboard data.
- `GET /api/context`: Get project context.
- `GET /api/changes/:changeId/context`: Get context for a specific change.
- `POST /mcp`: MCP Streamable HTTP endpoint.
- `POST /api/init`: Initialize project.
- `POST /api/memory/ingest`: Ingest memory record.
- `DELETE /mcp`: Close MCP session.
- `PUT /api/project-spec`: Update project spec.

## Integration Guides

- [Getting Started](./docs/guide-getting-started.md)
- [Agent Integration](./docs/guide-agent-integration.md)
- [OpenSpec Integration](./docs/guide-openspec-integration.md)

## Configuration

The following environment variables can be used to configure the service:

- `PROJECT_BRAIN_HOST`: The host to bind the server to (default: `127.0.0.1`).
- `PROJECT_BRAIN_PORT`: The port to listen on (default: `3210`).
- `PROJECT_BRAIN_ALLOWED_ORIGINS`: Comma-separated list of allowed origins for MCP validation.

## Architecture

Project Brain follows a layered architecture:

- **protocol**: Pure type definitions and schemas.
- **core**: Domain logic, commands, queries, and ports.
- **infra-fs**: Filesystem implementation of storage and git ports.
- **transport-http**: HTTP API implementation.
- **transport-mcp**: MCP server implementation.
- **app**: CLI entry point and server composition.

## Development

```bash
npm install
npm run build
npm test
npm run dev
```

## License

MIT

---

[中文文档](./README.zh-CN.md)
