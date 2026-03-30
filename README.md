# Project Brain

Project Brain is an HTTP service for AI collaborative development, with a standard MCP Streamable HTTP endpoint for assistant integrations.

Its responsibility is the engineering loop after project intent has begun to exist:

`memory ingestion -> development trace -> project spec`

It accepts signals from discussion, user input, repository activity, and ongoing implementation, then turns those signals into durable project memory and spec-ready context.

## Positioning

Project Brain should be understood as an analysis-driven project memory mechanism.

It is useful in two situations:

- the team already has discussion results or project input that should be ingested as durable memory
- the team is already coding and wants the system to keep recording and interpreting process even if the early discussion was not captured

That means `brain_init` is optional. It is an identity anchor, not a hard prerequisite for using the system.

## Core Model

Project Brain stores project knowledge in `.project-brain/`:

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

The protocol contract for this state now lives in `protocol/`:

- `protocol/README.md`
- `protocol/files.md`
- `protocol/semantics.md`
- `protocol/commands.md`
- `protocol/runtime-composites.md`
- `protocol/lightweight-mode.md`
- `protocol/schemas/source/*.json`
- `protocol/schemas/derived/*.json`

This protocol layer is the intended contract surface and lightweight integration surface. Runtime, HTTP, MCP, and UI packages are implementations over that contract.

Each layer has a different responsibility:

- `manifest.json`: optional identity anchor for project name, summary, repo type, and long-term goal
- `project-spec.json`: stable project truth, especially product goal, non-goals, architecture rules, coding rules, and agent rules
- `changes/<id>.json`: a structured contract for one concrete change
- `decisions.ndjson`: why a choice was made
- `notes.ndjson`: raw observations and unresolved fragments
- `progress.ndjson`: execution updates, blockers, and status
- `milestones.json`: broader phase tracking

## Recommended Loop

The protocol defines the durable contract. The public loop below is a high-level summary of how implementations and integrations typically use that contract:

1. Bring in project signals from user input, discussion outcomes, code activity, or development work.
2. Analyze those signals and turn them into explicit memory records.
3. Re-read the current durable state before resuming work or before writes when the current view may be stale.
4. Keep writing progress, decisions, notes, and changes as work continues.
5. Reflect stable conclusions back into `project-spec`.

Project Brain is strongest when the team keeps the boundary clear:

- external discussion can stay outside the system
- Project Brain is responsible for what gets recorded and retained
- spec must reflect stable conclusions, not temporary noise

## Agent Protocol

Project Brain exposes its core rules through the protocol directory and then provides an agent-facing profile in [docs/agent-protocol.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/agent-protocol.md) for MCP-connected assistants.

If an MCP-aware coding assistant is connected to Project Brain, the expected default loop is:

1. Read `brain_context` before substantial implementation.
2. Use `brain_start_work` or create/update a `change` for meaningful work.
3. Re-read `brain_change_context`, `brain_context`, or `brain_dashboard` before resuming work or writing state from uncertain context.
4. Use `brain_checkpoint` or record `decision`, `progress`, or `note` while work is happening.
5. Use `brain_finish_work` or run a reflection step before concluding larger work.

That agent-facing profile is derived from the protocol contract. Skills or host-specific prompts can strengthen compliance, but they should remain wrappers over the protocol/profile rather than separate sources of truth.

Integration helpers:

- generic host snippets: [docs/integration-snippets.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/integration-snippets.md)
- Codex-oriented template: [docs/codex-template.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/codex-template.md)
- Claude-oriented template: [docs/claude-template.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/claude-template.md)
- next-phase recording plan: [docs/next-phase-recording-plan.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/next-phase-recording-plan.md)

## Available HTTP API Capabilities

- `brain_dashboard`: inspect memory, recent activity, and current project state
- `brain_context`: get lightweight project context for day-to-day execution
- `brain_change_context`: get detailed context for one change before implementation
- `brain_start_work`: create or adopt an active change and optionally write initial progress
- `brain_checkpoint`: update an active change and optionally append progress and a note
- `brain_finish_work`: mark a change done or dropped, optionally record final progress, and return reflection
- `brain_create_change`: create a structured change record before or during implementation
- `brain_update_change`: update an existing change as work evolves
- `brain_log_decision`: record a concrete decision and its rationale
- `brain_record_progress`: record progress or milestone updates during execution
- `brain_capture_note`: capture raw implementation notes or follow-up fragments
- `brain_ingest_memory`: ingest one confirmed structured memory record
- `brain_recent_activity`: inspect recent commits and hot paths for reflection
- `brain_estimate_progress`: estimate overall or milestone progress from activity signals
- `brain_suggest_actions`: suggest likely next engineering actions
- `brain_analyze`: run a broader reflection pass across memory and repository activity
- `brain_init`: optionally initialize or update the identity anchor

The public MCP surface is designed to cover the core loop of memory, development-time recording, and reflection.

## Why Analysis Matters

Project Brain already includes analysis capabilities such as:

- git activity parsing
- hot path detection
- milestone estimation
- next action recommendation

These are not optional extras. They are required so the system can:

- discover what is worth remembering
- keep recording development process as the codebase changes
- connect raw activity to higher-level memory
- support eventual reflection into `project-spec`

Convergence still matters, but here it happens after recording and analysis:

- raw signals become structured memory
- structured memory accumulates across execution
- stable memory is promoted into `project-spec`

## Quick Start

Start the local HTTP service:

```bash
npx -y @myczh/project-brain
```

If you see `Project Brain HTTP server running at http://127.0.0.1:3210`, the service started successfully.

You can also run it in development mode:

```bash
npm run dev
```

To expose the service on your local network:

```bash
PROJECT_BRAIN_HOST=0.0.0.0 PROJECT_BRAIN_PORT=3210 npm run dev
```

## Release And Install Test

Current npm status on 2026-03-26:

- package: `@myczh/project-brain`
- published latest: `0.0.3`

Recommended release flow:

```bash
npm install
npm run build
npm publish --dry-run
npm version patch
git push --follow-tags
npm publish
```

For a scoped public package, the first publish may require:

```bash
npm publish --access public
```

After publishing, test installation in a clean directory:

```bash
mkdir -p /tmp/project-brain-smoke
cd /tmp/project-brain-smoke
npx -y @myczh/project-brain@latest
```

Expected result:

- the process starts a local HTTP server on `http://127.0.0.1:3210`
- `GET /health` responds successfully
- MCP clients can connect to `http://127.0.0.1:3210/mcp`

## Local HTTP API

Project Brain exposes a minimal local HTTP server for custom clients and UI experiments.

Default address:

```text
http://127.0.0.1:3210
```

Current endpoints:

- `GET /`
- `GET /health`
- `GET /api`
- `GET /ui`
- `GET /mcp`
- `GET /api/dashboard`
- `GET /api/context`
- `GET /api/changes/:changeId/context`
- `POST /mcp`
- `POST /api/init`
- `POST /api/memory/ingest`
- `DELETE /mcp`
- `PUT /api/project-spec`

## MCP Streamable HTTP

Project Brain exposes a standard MCP Streamable HTTP endpoint at:

```text
http://127.0.0.1:3210/mcp
```

This endpoint is intended for AI assistants and MCP-aware clients.
The `/api/*` routes remain product-facing HTTP APIs for custom UI and direct integrations.

When running locally, Project Brain validates browser `Origin` headers for `/mcp`.
You can override the allowlist with:

```bash
PROJECT_BRAIN_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Example Requests

Inspect the service and endpoint index:

```bash
curl http://127.0.0.1:3210/
curl http://127.0.0.1:3210/api
```

Open the dashboard UI prototype:

```text
http://127.0.0.1:3210/ui
```

For MCP clients, use this endpoint URL:

```text
http://127.0.0.1:3210/mcp
```

Read project context for the current repository:

```bash
curl "http://127.0.0.1:3210/api/context?repo_path=$(pwd)"
```

Read the dashboard with deep analysis disabled:

```bash
curl "http://127.0.0.1:3210/api/dashboard?repo_path=$(pwd)&include_deep_analysis=false"
```

## Example Ingest

```json
{
  "memory": {
    "type": "decision",
    "confirmed_by_user": true,
    "payload": {
      "title": "Use analysis-driven memory workflow",
      "decision": "Treat Project Brain as the durable memory and process-recording layer for AI collaboration",
      "rationale": "Analysis is required to capture project signals, preserve execution history, and reflect stable conclusions into spec",
      "scope": "project"
    }
  }
}
```

Send that ingest payload:

```bash
curl -X POST http://127.0.0.1:3210/api/memory/ingest \
  -H "Content-Type: application/json" \
  -d @memory.json
```

`brain_ingest_memory` stays deliberately single-record and create-first:

- it validates the payload
- it routes the record to the right memory layer
- it rejects silent overwrites of existing `project-spec` or `change-spec`
- it keeps durable truth inside Project Brain instead of leaving it in chat history

## Spec

The current project-level spec lives in [docs/project-brain-spec.md](https://github.com/myczh-1/project-brain-mcp/blob/main/docs/project-brain-spec.md).

## License

MIT
