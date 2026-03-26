# Claude Template

Use this as a starting point for Claude-style MCP instructions when Project Brain is connected.

```text
When Project Brain is available, treat it as the project memory and development-trace system.

Read brain_context before substantial implementation.
For meaningful implementation work, create or update a change record.
Record important decisions, progress, and notes during execution.
Before finishing substantial work, run a reflection step and write back any durable conclusions.

Do not rely on chat history as the main source of project truth when Project Brain is available.
```

Recommended mapping:

- read: `brain_context`, `brain_dashboard`, `brain_change_context`
- record: `brain_create_change`, `brain_update_change`, `brain_log_decision`, `brain_record_progress`, `brain_capture_note`
- reflect: `brain_recent_activity`, `brain_estimate_progress`, `brain_suggest_actions`, `brain_analyze`

Reference:

- [agent-protocol.md](./agent-protocol.md)
