# Project Brain Agent Protocol v0

## Purpose

This document defines the agent-facing operating profile for coding assistants that connect to Project Brain over MCP.

It is derived from the core rules in `protocol/semantics.md`, `protocol/commands.md`, and `protocol/lightweight-mode.md`.

The goal is not to make Project Brain own ideation. The goal is to make assistants consistently use Project Brain as the system of record for:

- project memory
- development-time recording
- reflection after implementation activity

This profile is intentionally small. It translates the core protocol into a host- and agent-friendly execution loop for MCP-capable assistants.

## Product Boundary

The broader workflow may look like:

`divergence -> convergence -> memory -> development -> reflection`

Project Brain is responsible only for:

- memory
- recording during development
- reflection of development reality back into project context

Divergence and convergence may happen outside the system, including meetings, planning, brainstorming, and AI chat.

## Core Rule

Do not rely on prior chat history as the primary source of project truth when Project Brain is available.

Instead:

1. read current project context from Project Brain before acting on stale assumptions
2. record meaningful work while it is happening
3. reflect stable conclusions back into durable memory

## Required Workflow

### 1. Before substantial work

Read the current project state.

Minimum:

- `brain_context`

Use when needed:

- `brain_dashboard` for broader status and memory inspection
- `brain_change_context` when continuing an existing change

Expectation:

- the assistant should understand current goals, active changes, recent decisions, and execution state before making larger implementation moves
- if the assistant is resuming prior work or inheriting an active change, it should prefer a read step before adding fresh progress records

### 2. When starting meaningful implementation

Create or adopt a change record.

Preferred:

- `brain_start_work` for the lowest-friction default path
- `brain_create_change` for new implementation work
- `brain_update_change` when continuing an existing change

A change should exist when the work is more than a trivial one-off edit.

Typical triggers:

- multi-file edits
- architectural or workflow changes
- work expected to span multiple messages or sessions
- work likely to generate decisions, progress, or follow-up notes

### 3. During implementation

Keep the read side alive while work is ongoing, not only at session start.

Re-read when needed:

- `brain_change_context` before resuming, extending, or updating an existing change after a pause
- `brain_context` when the assistant needs the latest goals, recent decisions, or recent progress before taking another step
- `brain_dashboard` when the assistant needs a broader status check before making project-level updates

Common triggers:

- the assistant is about to append progress but has not checked current state recently
- the work spans multiple messages, sessions, or handoffs
- the assistant is uncertain whether the current plan still matches recorded progress
- another tool result suggests the project state may have changed

Write development traces into Project Brain while work is ongoing.

Use:

- `brain_checkpoint` for the lowest-friction in-progress checkpoint path
- `brain_log_decision` for concrete choices with rationale
- `brain_record_progress` for execution updates, blockers, or milestone movement
- `brain_capture_note` for raw observations, unresolved fragments, or follow-ups
- `brain_update_change` when the change status, scope, or affected areas evolve

Expectation:

- significant work should leave behind structured traces
- reads should refresh execution state before writes when the assistant may be operating on stale context
- decisions should not remain only in chat
- blockers and progress should be recorded close to when they occur

### 4. After implementation or at a checkpoint

Reflect development reality back into project context.

Use one or more of:

- `brain_finish_work`
- `brain_recent_activity`
- `brain_estimate_progress`
- `brain_suggest_actions`
- `brain_analyze`
- `brain_dashboard`

Then update durable records if warranted:

- update the active `change`
- add a `progress` record
- add a `decision` record if a stable choice emerged
- use `brain_ingest_memory` for confirmed structured memory when a single-record ingest path is more natural

## Tool Roles

### Read and inspect

- `brain_context`: lightweight day-to-day project context
- `brain_dashboard`: unified memory and status view
- `brain_change_context`: detailed context for one change
- `brain_recent_activity`: recent commits and hot paths
- `brain_analyze`: broader reflection pass
- `brain_estimate_progress`: progress estimation
- `brain_suggest_actions`: likely next steps

### Write and record

- `brain_create_change`: create a structured change record
- `brain_start_work`: create or adopt the active change and optionally record initial progress
- `brain_checkpoint`: update the active change and optionally record progress and a note
- `brain_finish_work`: finalize the change and return reflection outputs
- `brain_update_change`: update an existing change
- `brain_log_decision`: record a decision with rationale
- `brain_record_progress`: record progress or milestone movement
- `brain_capture_note`: capture raw notes
- `brain_ingest_memory`: generic single-record ingest path

### Initialization

- `brain_init`: optional identity anchor only; not a prerequisite for normal use

## Minimum Compliance Rules

An assistant is considered compliant with the Project Brain protocol if it does the following:

1. Reads `brain_context` before substantial implementation when Project Brain is available.
2. Creates or updates a `change` for meaningful implementation work.
3. Re-reads `brain_change_context`, `brain_context`, or `brain_dashboard` before writing state when continuing existing work or when current state may be stale.
4. Records at least one of `decision`, `progress`, or `note` during non-trivial execution.
5. Performs a reflection step before concluding substantial work.

## What Not To Do

- Do not treat Project Brain as a full ideation system.
- Do not silently overwrite stable project truth.
- Do not leave important decisions only in chat when they affect future work.
- Do not require `brain_init` before the system can be useful.
- Do not write noise into `project-spec`; stable conclusions should reach spec only after reflection.

## Example Session

For a medium-sized implementation, the assistant should roughly behave like this:

1. Call `brain_context`.
2. Call `brain_start_work`.
3. Implement.
4. Call `brain_change_context` or `brain_context` before resuming after a pause or before appending a new progress update on uncertain state.
5. Call `brain_checkpoint` at a meaningful checkpoint.
6. Call `brain_log_decision` if a concrete tradeoff is chosen.
7. Call `brain_finish_work`.

## Status

This is `v0`.

It defines the minimum operating loop for assistants.
Future versions can add stronger automation, promotion rules, and host-specific guidance without changing the core boundary.
