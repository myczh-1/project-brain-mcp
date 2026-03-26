# Codex Template

Use this as a starting point for Codex-style agent instructions when Project Brain is installed as an MCP server.

```text
Use Project Brain as the durable memory and development-recording layer for this repository.

Before substantial implementation, call brain_context.
When starting meaningful work, create or update a change.
During execution, record concrete decisions, progress, and notes through Project Brain instead of leaving them only in chat.
Before concluding substantial work, run a reflection step and update the relevant change or memory records.

Project Brain is responsible for memory, development-time recording, and reflection. It is not responsible for the full divergence and convergence workflow.
```

Recommended mapping:

- read: `brain_context`, `brain_dashboard`, `brain_change_context`
- record: `brain_create_change`, `brain_update_change`, `brain_log_decision`, `brain_record_progress`, `brain_capture_note`
- reflect: `brain_recent_activity`, `brain_estimate_progress`, `brain_suggest_actions`, `brain_analyze`

Reference:

- [agent-protocol.md](./agent-protocol.md)
