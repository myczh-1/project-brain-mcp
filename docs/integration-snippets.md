# Project Brain Integration Snippets

This document provides small, reusable prompt snippets for hosts that connect to Project Brain over MCP.

Use these snippets to improve compliance with [agent-protocol.md](./agent-protocol.md).

These snippets do not replace MCP capabilities. They reinforce the expected operating loop so the assistant actually uses the tools.

## Generic MCP Host Snippet

Use this when the host supports a system prompt, agent profile, or integration instructions block.

```text
When Project Brain is available over MCP, use it as the system of record for project memory, development-time recording, and reflection.

Before substantial implementation, call brain_context.
For meaningful implementation work, create or update a change record.
During execution, record important decisions, progress, or notes instead of leaving them only in chat.
Before concluding substantial work, run a reflection step using Project Brain tools and update durable records when warranted.

Do not treat Project Brain as a full ideation system. Divergence and convergence may happen outside it.
Do not silently overwrite stable project truth.
```

## Short Host Snippet

Use this when the host allows only a small instruction budget.

```text
If Project Brain MCP is available: read brain_context before substantial work, create or update a change for meaningful implementation, record decisions/progress/notes during execution, and run a reflection step before concluding larger work.
```

## Use Cases

The generic snippet is appropriate for:

- hosted coding assistants
- local agent frameworks
- editor integrations
- custom MCP clients

The short snippet is appropriate for:

- narrow system prompt budgets
- tool descriptions
- temporary integration experiments
