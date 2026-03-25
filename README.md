# Project Brain

Project Brain is an HTTP service for AI collaborative development.

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

Each layer has a different responsibility:

- `manifest.json`: optional identity anchor for project name, summary, repo type, and long-term goal
- `project-spec.json`: stable project truth, especially product goal, non-goals, architecture rules, coding rules, and agent rules
- `changes/<id>.json`: a structured contract for one concrete change
- `decisions.ndjson`: why a choice was made
- `notes.ndjson`: raw observations and unresolved fragments
- `progress.ndjson`: execution updates, blockers, and status
- `milestones.json`: broader phase tracking

## Recommended Loop

The intended operating loop is:

1. Bring in project signals from user input, discussion outcomes, code activity, or development work.
2. Analyze those signals and turn them into explicit memory records.
3. Keep writing progress, decisions, notes, and changes as work continues.
4. Use `brain_context` and `brain_change_context` to execute against accumulated memory.
5. Reflect stable conclusions back into `project-spec`.

Project Brain is strongest when the team keeps the boundary clear:

- external discussion can stay outside the system
- Project Brain is responsible for what gets recorded and retained
- spec must reflect stable conclusions, not temporary noise

## Available HTTP API Capabilities

- `brain_dashboard`: inspect memory, recent activity, and current project state
- `brain_context`: get lightweight project context for day-to-day execution
- `brain_change_context`: get detailed context for one change before implementation
- `brain_ingest_memory`: ingest one confirmed structured memory record
- `brain_init`: optionally initialize or update the identity anchor

Internal service capabilities also exist for project-spec and change management, but the public tool surface stays intentionally small.

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
- `GET /api/dashboard`
- `GET /api/context`
- `GET /api/changes/:changeId/context`
- `POST /api/init`
- `POST /api/memory/ingest`
- `PUT /api/project-spec`

## Example Requests

Inspect the service and endpoint index:

```bash
curl http://127.0.0.1:3210/
curl http://127.0.0.1:3210/api
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

The current project-level spec lives in [docs/project-brain-spec.md](/Users/huanghe/Documents/project/node/ProjectBrain/docs/project-brain-spec.md).

## License

MIT
