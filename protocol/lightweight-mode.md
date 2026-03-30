# Lightweight Mode

Lightweight mode does not mean:

- start no HTTP server
- skip MCP
- call a smaller runtime API

Lightweight mode means:

- understand the Project Brain protocol
- read relevant current `.project-brain/*` state before making durable updates
- write legal `.project-brain/*` state directly
- optionally run a very thin validator or helper
- avoid depending on the full runtime implementation

## What A Lightweight Tool Needs

A coding tool or skill only needs:

- `protocol/files.md`
- `protocol/semantics.md`
- `protocol/schemas/source/*.json`

Optionally, it may also use:

- a future schema validator helper
- a path helper for locating `.project-brain/`
- conformance fixtures

## Minimal Capabilities

A lightweight producer should be able to:

- create `project-spec.json`
- create or update `changes/<id>.json`
- append `decisions.ndjson`
- append `notes.ndjson`
- append `progress.ndjson`

That is enough to generate valid Project Brain state.

## Example Workflow

For a coding assistant or skill:

1. Read protocol docs and schemas.
2. Read the current repository state for the target records you may update.
3. Decide which record type to emit.
4. Re-check whether your planned write still matches the current stored state if the work involved a pause, handoff, or additional reasoning step.
5. Serialize valid JSON or NDJSON.
6. Write directly into `.project-brain/`.
7. Optionally validate against the schema set.

Safe default:

- if you are not sure whether your view of `.project-brain/*` is current, read first and then write

Read guidance:

- for `project-spec.json`, `manifest.json`, `changes/<id>.json`, and `milestones.json`, read the current snapshot before replacing it
- for `progress.ndjson`, `decisions.ndjson`, and `notes.ndjson`, read relevant recent state when continuing existing work so new entries do not assume outdated context

## Example: Append A Decision

Append one line to `.project-brain/decisions.ndjson`:

```json
{"id":"decision-001","title":"Use append-only logs","decision":"Store decisions as NDJSON","rationale":"Preserves history and supports lightweight producers","alternatives_considered":["overwrite decisions.json"],"scope":"project","created_at":"2026-03-27T07:50:23.851Z"}
```

## Example: Write A Change Snapshot

Write `.project-brain/changes/extract-auth-core.json`:

```json
{
  "id": "extract-auth-core",
  "title": "Extract auth core",
  "summary": "Move auth state transitions into a shared package.",
  "status": "active",
  "goals": ["Decouple auth from transport"],
  "non_goals": ["Redesign auth UX"],
  "constraints": ["Preserve current behavior"],
  "acceptance_criteria": ["HTTP and embedded flows share auth state logic"],
  "affected_areas": ["packages/core-protocol", "packages/mode-service"],
  "related_decision_ids": ["decision-001"],
  "created_at": "2026-03-27T07:50:23.851Z",
  "updated_at": "2026-03-27T07:50:23.851Z"
}
```

Before replacing that file, read the existing `changes/extract-auth-core.json` snapshot first so the new record reflects the latest stored state rather than an outdated local assumption.

## What Lightweight Mode Does Not Need

It does not need to understand:

- `createRuntime()`
- `RuntimeService`
- `createEmbeddedMode()`
- HTTP routes
- MCP tool registration
- dashboard or analysis internals

Those belong to implementation layers.

## Current Repository Status

At the moment, the repository still contains runtime packages and embedded adapters.
Those are valid implementation helpers, but they are not the intended lightweight contract surface.

The intended lightweight contract surface is this protocol directory.

If a tool also wants implementation conveniences like workflow helpers or derived artifacts, those are optional extensions and should not be treated as core protocol requirements.
