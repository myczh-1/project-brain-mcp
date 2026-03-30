# Next Phase Plan: From Explicit Logging To Low-Friction Recording

## Why This Document Exists

This document captures the product gaps exposed by using Project Brain on a real project (`3d-test`) and defines the next phase of work needed to move from explicit logging toward low-friction recording.

The goal is not to expand scope back into ideation. The goal is to improve how Project Brain handles:

- memory
- recording during development
- reflection after development activity

## Evidence From `3d-test`

Observed memory shape:

- `manifest.json` exists
- `decisions.ndjson` exists
- `progress.ndjson` exists
- `changes/` does not exist
- `project-spec.json` does not exist
- `notes.ndjson` does not exist
- `milestones.json` has no meaningful inferred milestones

Observed behavior:

- Project Brain can preserve a useful sequence of decisions and progress updates
- Project Brain can infer focus and hot paths from git activity
- The dashboard can summarize what happened
- The resulting memory is still too shallow to behave like a durable engineering execution model

## Core Diagnosis

The current system records events, but it does not yet organize those events into a strong execution structure.

In practice, this means:

1. The system is good at keeping a development log.
2. The system is weaker at representing a change lifecycle.
3. Reflection still reads from scattered records instead of stable execution objects.

That is why the output looks informative but still feels incomplete.

## Main Product Gaps

### 1. Missing primary execution object

`change` should be the default execution anchor for meaningful work.

Without `change` records:

- progress entries are detached
- decisions are detached
- the dashboard can describe motion but not stable work units
- later assistants cannot easily answer "what is the active task boundary?"

### 2. Recording still depends on deliberate prompting

The current behavior is closer to:

- "the assistant can record"

than to:

- "the assistant naturally leaves a durable trace"

This is the central gap between explicit logging and low-friction recording.

### 3. Reflection is summarizing more than it is converging

The dashboard can infer:

- recent focus
- recent commits
- likely next actions

But it is still weak at promoting those signals into:

- active changes
- milestone movement
- stable conclusions
- spec candidates

### 4. Records are not cross-linked strongly enough

Many `decision` and `progress` entries are useful in isolation, but they do not point back to a `change`.

Without strong cross-linking:

- memory remains readable
- memory remains less actionable for future execution

## Product Goal For The Next Phase

Move Project Brain from "explicit structured logging" to "low-friction structured recording with stronger execution anchors."

This does not require full automation. It requires reducing the effort needed for assistants to leave well-structured traces.

## Required Capabilities

### Capability 1: Make `change` the default anchor

For meaningful work, the system should strongly prefer that a `change` exists.

This implies:

- assistants should default to creating a `change` for non-trivial work
- `decision`, `progress`, and `note` should prefer linking to a `related_change_id`
- dashboards and context assembly should treat active changes as first-class state

### Capability 2: Add low-friction recording entry points

The current low-level tools are useful, but too manual for routine behavior.

The next phase should add higher-level entry points such as:

- `brain_start_work`
- `brain_checkpoint`
- `brain_finish_work`

These do not replace the current tools. They orchestrate them.

### Capability 3: Add promotion and repair logic

Project Brain should become more willing to propose structure when the trace is incomplete.

Examples:

- infer that repeated progress updates should attach to an active change
- propose a new change when there is clear implementation momentum but no change exists
- propose milestone movement from repeated progress and git activity
- propose candidate spec updates only after enough repeated evidence accumulates

### Capability 4: Improve reflection outputs

Reflection should not stop at a summary.

It should produce actionable structure such as:

- active change candidates
- unresolved follow-ups
- milestone drift
- stable conclusions worth promoting later

## Suggested MCP Evolution

### Keep existing granular tools

These remain important:

- `brain_create_change`
- `brain_update_change`
- `brain_log_decision`
- `brain_record_progress`
- `brain_capture_note`
- `brain_recent_activity`
- `brain_estimate_progress`
- `brain_suggest_actions`
- `brain_analyze`

### Add orchestration tools

The next likely additions are:

- `brain_start_work`
  - create or reuse a change
  - optionally write an initial progress record
  - return the active change id

- `brain_checkpoint`
  - append progress
  - optionally attach a note
  - optionally update change status

- `brain_finish_work`
  - finalize progress
  - update change status
  - trigger a reflection pass
  - return suggested follow-up actions or promotion candidates

### Add "suggest but do not silently mutate" flows

To preserve trust, Project Brain should prefer:

- propose structure
- let the assistant confirm or execute

over:

- silently invent durable truth

## Prioritized Next Steps

### Priority 1

Make `change` the default execution anchor in the protocol and in MCP usage examples.

### Priority 2

Implement one orchestration tool, preferably `brain_start_work`.

Status:

- initial `brain_start_work` implementation added
- initial `brain_checkpoint` implementation added
- initial `brain_finish_work` implementation added
- next iteration should add stronger reuse rules and better change repair behavior

### Priority 3

Teach dashboard and context assembly to surface "trace quality" problems such as:

- no active change
- orphaned decisions
- orphaned progress
- no stable rules

### Priority 4

Add promotion suggestions from reflection rather than only summaries.

## Success Criteria

The next phase is working if a medium-sized implementation in a fresh repo tends to produce:

- at least one active or completed `change`
- linked decisions and progress
- fewer orphaned records
- clearer next actions
- less need for repeated manual prompting to keep Project Brain updated

## Non-Goal

This phase is not about making Project Brain own brainstorming or planning.

It is about making the memory/development/reflection segment structurally strong enough that the system feels reliable even when early discussion happened elsewhere.
