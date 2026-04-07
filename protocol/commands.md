# Commands And Queries

Protocol v0 is file-state first.

This document defines the minimal logical operations that correspond directly to durable protocol state.
It does not define runtime convenience workflows.

For storage semantics, overwrite rules, and conflict behavior, see `protocol/semantics.md`.
For runtime convenience workflows, see `protocol/runtime-composites.md`.

## Minimal Protocol Commands

### `write_manifest`

- effect: write one complete `manifest` snapshot
- target: `manifest.json`

### `write_project_spec`

- effect: write one complete `project_spec` snapshot
- target: `project-spec.json`

### `write_change`

- effect: write one complete `change` snapshot for a specific change ID
- target: `changes/<change-id>.json`

### `write_modules`

- effect: write one complete `module` array snapshot
- target: `modules.json`

### `append_decision`

- effect: append one immutable `decision` record
- target: `decisions.ndjson`

### `append_note`

- effect: append one immutable `note` record
- target: `notes.ndjson`

### `append_progress`

- effect: append one immutable `progress` record
- target: `progress.ndjson`

### `write_milestones`

- effect: write one complete milestone array snapshot
- target: `milestones.json`

## Queries

Minimal protocol queries are state reads over canonical stored objects.

- `get_manifest`
- `get_project_spec`
- `get_change`
- `list_changes`
- `list_decisions`
- `list_notes`
- `list_progress`
- `list_milestones`
- `list_modules`
- `get_state`

These queries are the read side of the protocol. Producers should use them, or equivalent direct file reads, before writes when stale state could change the resulting durable record.

## Lightweight Producer Guidance

A lightweight producer does not need to implement the query surface or any runtime workflow helper.

It only needs to know:

- which file each object maps to
- which schema each object must satisfy
- which write mode applies to that object

However, safe lightweight production still depends on the query model conceptually:

- before `write_manifest`, `write_project_spec`, `write_change`, or `write_milestones`, read the current target state first
- before `append_progress`, `append_decision`, or `append_note` while continuing existing work, read relevant current state if assumptions may be stale
- `get_state` is the highest-level query shape for producers that want one refresh step before deciding what to write
