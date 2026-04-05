# Using Project Brain with OpenSpec

## Overview

OpenSpec manages the structured proposal-to-implementation workflow (propose → design → spec → tasks). Project Brain manages durable project memory (decisions, progress, notes, milestones, project spec). Together, they form a complete AI-assisted development workflow where OpenSpec provides the roadmap and Project Brain captures the execution trace.

## How They Complement Each Other

- **OpenSpec**: Owns the "what to build" lifecycle. It creates change proposals, design docs, detailed specifications, and actionable task breakdowns.
- **Project Brain**: Owns the "what happened" memory. It records decisions made during coding, progress updates, raw notes, and project-level rules.
- **Integration Points**:
  - OpenSpec changes can feed into Project Brain change records to maintain a unified history.
  - Project Brain's durable context (e.g., architecture rules, previous decisions) enriches OpenSpec's proposal and design phases.

## Two Integration Approaches

### Service Mode
Run `npx @myczh/project-brain` alongside OpenSpec skills. The AI assistant connects to Project Brain via its Model Context Protocol (MCP) server while using file-based skills for OpenSpec operations. This optional runtime mode provides conveniences like automatic git activity analysis and dashboard visualization.

### Lightweight Mode (no server)
The AI assistant reads and writes the `.project-brain/` directory directly following the protocol, while simultaneously using OpenSpec skills. No HTTP server or background process is required. This approach is ideal for single-developer workflows and environments where running a local server is inconvenient.

## Lightweight Mode Setup

In lightweight mode, no installation is needed beyond ensuring the AI assistant understands the Project Brain protocol.

### Directory Structure
Both systems coexist at the repository root:
```text
.project-brain/      <-- Project Brain (Durable Memory)
openspec/            <-- OpenSpec (Active Changes)
  changes/
    feature-x/
      proposal.md
      design.md
      tasks.md
```

### Protocol Access
The AI assistant requires access to the `protocol/` documentation (specifically `files.md`, `semantics.md`, and schemas) to ensure it generates valid records.

### .project-brain/ Layout
```text
.project-brain/
  manifest.json      <-- Project identity
  project-spec.json  <-- Stable project truth & rules
  changes/           <-- Structured change records
    <id>.json
  decisions.ndjson   <-- Append-only decision log
  notes.ndjson       <-- Append-only observation log
  progress.ndjson    <-- Append-only execution updates
  milestones.json    <-- Phase tracking snapshots
```

## Workflow Example (Lightweight Mode)

1. **Ideation**: User describes a new feature idea to the AI.
2. **OpenSpec Propose**: The AI uses the `openspec-propose` skill to create `proposal.md`, `design.md`, and `tasks.md` within the `openspec/` directory.
3. **Context Hydration**: Before starting implementation, the AI reads `.project-brain/project-spec.json` and recent `decisions.ndjson` to align with project rules.
4. **Execution Recording**: During implementation, the AI appends new decisions to `decisions.ndjson` and progress updates to `progress.ndjson` as they occur.
5. **Change Closure**: When the feature is complete, the AI updates the corresponding `.project-brain/changes/<id>.json` status to `done`.
6. **OpenSpec Archive**: The AI uses the `openspec-archive-change` skill to move the completed OpenSpec artifacts to the archive.

## Protocol Reference (Quick)

### File Behavior
- **Append-only (NDJSON)**: `decisions.ndjson`, `notes.ndjson`, `progress.ndjson`. One JSON object per line. Never modify existing lines.
- **Snapshot (JSON)**: `manifest.json`, `project-spec.json`, `changes/<id>.json`, `milestones.json`. Replace the full file on update. **Always read the current file before writing** to avoid overwriting concurrent changes.

### Core Semantics
- **Timestamps**: Use ISO 8601 UTC format (e.g., `2026-04-02T10:00:00.000Z`).
- **Change Status**: `proposed`, `active`, `done`, `dropped`.
- **Soft References**: Link records using IDs (e.g., a progress entry referencing a change ID).

## Best Practices

- **Read Before Write**: Always refresh your view of the `.project-brain/` state before performing a write, especially when resuming work after a pause.
- **Record Immediately**: Capture decisions and progress as they happen. Do not wait until the end of the session.
- **Separation of Concerns**: Use OpenSpec for planning and structural breakdown; use Project Brain for capturing the reality of development and long-term memory.
- **No Duplication**: Avoid mirroring the full content of OpenSpec design docs into Project Brain. Use Project Brain to record the *fact* that a design was adopted and any *deviations* or *implementation-time decisions* made later.

## Recommended AI Skill Configuration

To use both systems effectively, configure your AI coding assistant with both the OpenSpec skills and the Project Brain protocol context. If using a tool-based assistant, ensure it has `Read` and `Write` permissions for both the `openspec/` and `.project-brain/` directories.

When working in lightweight mode, include a system prompt instruction:
"You are a lightweight Project Brain producer. Follow the protocol in `/protocol` when updating `.project-brain/`. Use OpenSpec skills for change lifecycle management."
