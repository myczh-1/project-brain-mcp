# Runtime Composite Commands

> Stability notice: this document is **not a stable commitment**.
> Composite commands are **optional runtime convenience**, may be removed, and are **not the mainline protocol contract**.

These commands are implementation conveniences.

They are not part of the minimal interoperable protocol surface.

Their purpose is to help a runtime coordinate multiple minimal protocol operations into one higher-level workflow.

## Composite Commands

### `initialize_project`

- convenience wrapper over `write_manifest`

### `define_project_spec`

- convenience wrapper over `write_project_spec`

### `create_change`

- convenience wrapper over `write_change`

### `update_change`

- convenience wrapper that computes a new complete `change` snapshot, then writes it through `write_change`

### `log_decision`

- convenience wrapper over `append_decision`

### `capture_note`

- convenience wrapper over `append_note`

### `record_progress`

- convenience wrapper over either `append_progress` or `write_milestones`

### `start_work`

- workflow helper
- may create or update a `change`
- may append an initial `progress` record
- not required for lightweight protocol conformance

### `checkpoint_work`

- workflow helper
- may write a new `change` snapshot
- may append `progress`
- may append `note`
- not required for lightweight protocol conformance

### `finish_work`

- workflow helper
- may compose checkpoint writes plus reflection/query behavior
- not required for lightweight protocol conformance

### `ingest_memory`

- workflow helper that routes one structured payload into one or more minimal protocol operations
- not required for lightweight protocol conformance

## Why This Split Exists

Minimal protocol operations describe interoperable state transitions.

Composite commands describe one runtime's convenience layer over those state transitions.

External producers should treat composite commands as optional helpers, not as the protocol itself.
