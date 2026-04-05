# Service / HTTP / UI Archive

> Historical notes moved out of the main docs to keep the primary workflow focused on file-protocol Lightweight usage.

## Previously Documented Service Mode

The old mainline docs described a Service Mode started via:

```bash
npx -y @myczh/project-brain
```

It exposed local HTTP routes and an MCP-over-HTTP endpoint.

## Previously Documented HTTP/MCP Endpoints

Historical endpoint set included:

- `GET /health`
- `GET /api`
- `GET /api/dashboard`
- `GET /api/context`
- `GET /api/changes/:changeId/context`
- `POST /mcp`
- `DELETE /mcp`
- `POST /api/init`
- `POST /api/memory/ingest`
- `PUT /api/project-spec`

## Previously Documented UI

A prototype dashboard UI had been documented under `/ui`.

## Previously Documented Environment Variables

Historical service configuration included:

- `PROJECT_BRAIN_HOST`
- `PROJECT_BRAIN_PORT`
- `PROJECT_BRAIN_ALLOWED_ORIGINS`

## Why Archived

Current documentation prioritizes the file-protocol-driven core workflow based on direct `.project-brain/` reads/writes. Service/HTTP/UI details are retained here strictly as historical reference.
