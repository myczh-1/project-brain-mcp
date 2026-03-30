# Semantics

This document defines behavior that JSON Schema alone cannot express.

## Normative Storage Table

This table is the canonical source for persistence semantics in Protocol v0.

| object | storage | write mode | overwrite rule | conflict rule | notes |
|---|---|---|---|---|---|
| `manifest` | `manifest.json` | snapshot | replace full file | last write wins | optional identity anchor |
| `project_spec` | `project-spec.json` | snapshot | replace full file | last write wins | stable project truth |
| `change` | `changes/<id>.json` | snapshot | replace full file | last write wins | one file per change ID |
| `decision` | `decisions.ndjson` | append-only | never modify prior lines | immutable entry stream | one JSON object per line |
| `note` | `notes.ndjson` | append-only | never modify prior lines | immutable entry stream | one JSON object per line |
| `progress` | `progress.ndjson` | append-only | never modify prior lines | immutable entry stream | one JSON object per line |
| `milestone` | `milestones.json` | snapshot | replace full array | last write wins | explicit milestones only; derived updates allowed by implementations |

## Source vs Derived

Minimal interoperable protocol objects are:

- `manifest`
- `project_spec`
- `change`
- `decision`
- `note`
- `progress`
- `milestone`

Derived artifacts are outside the minimal protocol surface.

Examples:

- `next_actions`
- implementation-inferred signals

Derived artifacts may be documented as optional extensions, but they are not required for protocol conformance.

## Legal Write Behavior

- Snapshot objects must be written as a complete new representation of the object state.
- Append-only objects must be appended as a single new immutable record.
- Writers should not partially patch JSON snapshot files in place.
- Writers should not rewrite NDJSON history except during explicit repair or migration work.

## Read-Before-Write Rule

Protocol v0 expects producers to refresh their view of durable state before emitting new writes when stale state would change the result.

- Before writing a snapshot object such as `manifest`, `project_spec`, `change`, or `milestone`, a producer should read the current stored state for that target first.
- Before appending `progress`, `decision`, or `note` as part of continuing existing work, a producer should read the relevant current state when it may be operating on stale assumptions.
- If a producer has not checked current state recently and is about to update durable memory, the safe default is read first and then write.

This rule matters because snapshot files use full replacement semantics and Protocol v0 otherwise assumes last write wins.

## Referential Integrity

Protocol v0 uses soft references.

- `change.related_decision_ids[]` may refer to decision IDs in `decisions.ndjson`
- `decision.related_change_id` may refer to a change ID in `changes/`
- `note.related_change_id` may refer to a change ID in `changes/`
- `progress.related_change_id` may refer to a change ID in `changes/`

Writers should only emit references they believe exist or will exist immediately.
Readers should tolerate unresolved references.

## Status Semantics

### Change Status

Allowed values:

- `proposed`
- `active`
- `done`
- `dropped`

Expected progression:

- normal flow: `proposed -> active -> done`
- aborted flow: `proposed -> dropped` or `active -> dropped`

Protocol v0 does not hard-forbid reopening, but runtime implementations may treat backwards transitions as exceptional.

### Change Update Rule

`update_change` semantics are full-snapshot replacement semantics for the stored `change` object.

- the resulting file must contain one complete legal `change` record
- partial patch syntax is an implementation convenience, not a storage-level contract
- if multiple producers write concurrently, Protocol v0 assumes last write wins

### Progress Status

Allowed values:

- `planned`
- `in_progress`
- `blocked`
- `done`

These describe a single progress entry, not global change state.

### Milestone Status

Allowed values:

- `not_started`
- `in_progress`
- `completed`

Milestones may be explicit or implementation-inferred.

Implementation note:

- a lightweight producer is not required to infer milestones
- a runtime may derive milestone updates, but that is an implementation extension layered over the protocol

## Timestamps

Protocol v0 expects ISO 8601 timestamps.

Examples:

- `2026-03-27T07:50:23.851Z`
- `2026-03-27T07:32:35.227Z`

Writers should use full UTC timestamps with `Z` when possible.

## Ordering

- NDJSON logs are chronological append streams.
- Newer entries should appear later in the file.
- `changes/*.json` and snapshot files express only latest state.
- Readers may sort change snapshots by `updated_at` rather than filename.

## Protocol Version Semantics

Protocol version is explicit at the contract level even though persisted records do not yet carry a required version field.

- External producers must target `Project Brain Protocol v0` explicitly.
- Validation must use the v0 schema set and v0 semantics in this directory.
- A future revision may require manifest-level or per-record version markers if multiple stored versions must coexist.

## Lightweight Producer Expectations

A protocol-native lightweight producer should:

- write valid JSON or NDJSON only
- refresh relevant current state before writes that could be invalidated by stale assumptions
- respect append-only vs snapshot behavior
- use legal enum values
- avoid inventing undocumented fields
- preserve IDs and references consistently

A lightweight producer does not need to:

- run git analysis
- compute hot paths
- infer milestones
- calculate next actions
- call runtime command handlers

## Compatibility Notes

Protocol v0 reflects current implementation tolerance for some legacy inputs:

- `manifest.json` readers may normalize legacy aliases like `one_liner`, `tech_stack`, and `goals`
- `decisions.json` and `progress.json` may still be readable by the runtime as legacy fallbacks

Those legacy shapes are compatibility behavior, not the preferred protocol surface.

Preferred protocol writers should emit only the canonical v0 files and shapes documented here.
