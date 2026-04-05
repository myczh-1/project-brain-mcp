# Agent Integration Guide

## Overview

Project Brain is integrated through a file protocol: agents read and write `.project-brain/` as the durable system of record.

This guide defines how to keep agent behavior consistent without requiring MCP endpoint or HTTP service setup.

## Integration Contract

Agents should follow this contract for non-trivial work:

1. Read current context before implementation.
2. Create or update a change record for meaningful tasks.
3. Record key decisions, notes, and progress during execution.
4. Reflect and close the loop at task completion.

## Recommended Agent Prompt Snippet

```text
Use `.project-brain/` as the system of record for durable project memory.

Before substantial implementation, read `project-spec.json` and active `changes/*.json`.
For meaningful implementation, create or update a change record.
During execution, write decisions to `decisions.ndjson`, notes to `notes.ndjson`, and progress to `progress.ndjson`.
Before concluding substantial work, update change status and persist stable conclusions.

Do not rely on chat history as the source of truth when `.project-brain/` is present.
```

## Minimal Record Set

- **Project truth**: `.project-brain/project-spec.json`
- **Task records**: `.project-brain/changes/*.json`
- **Decisions**: `.project-brain/decisions.ndjson`
- **Notes**: `.project-brain/notes.ndjson`
- **Progress**: `.project-brain/progress.ndjson`
- **Milestones**: `.project-brain/milestones.json`

## Lightweight Workflow Loop

1. **Read**
   - `project-spec.json`
   - currently active change files
2. **Plan + execute**
   - update change scope/status fields as work evolves
3. **Record**
   - append decision/progress/note entries
4. **Finish**
   - mark done/dropped and write follow-up direction

## Guardrails

- Keep stable architectural truth in `project-spec.json`.
- Keep in-flight uncertainty in `changes` and `notes`.
- Avoid silent rewrites: prefer append/update with explicit rationale.
- Keep entries concise and machine-parseable.

## Historical Service/HTTP/UI Integration

Legacy MCP endpoint and HTTP service integration content is archived at:
- [docs/future/service-http-ui-archive.md](./future/service-http-ui-archive.md)
