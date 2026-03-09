# Project Brain

AI Project Context Engine — an MCP server that helps AI coding agents understand your project.

Project Brain reads your Git history, stores project notes, and generates structured project context for AI assistants.

---

## Quick Start

Run the MCP server:

```bash
npx -y @myczh/project-brain
```

If you see:

```
Project Brain MCP server running on stdio
```

the server started successfully.

---

## Add to MCP Client

### OpenCode

Add to your config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "project-brain": {
      "type": "local",
      "command": ["npx", "-y", "@myczh/project-brain"],
      "enabled": true
    }
  }
}
```

Restart OpenCode after updating the config.

---

### Claude Desktop

Edit:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add:

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "@myczh/project-brain"]
    }
  }
}
```

Restart Claude Desktop.

---

### Cursor

Add to MCP config:

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "@myczh/project-brain"]
    }
  }
}
```

Restart Cursor.

---

## Available Tools

### brain_init

Collect and validate final goals. This tool now writes manifest only after explicit user confirmation.

- `answers` can be partial during collection; if incomplete, tool returns `need_more_info` with questions and `draft_manifest`
- Manifest write is blocked unless explicit confirmation is provided: `confirmed_by_user=true`
- Confirmation source is required before write: `goal_confirmation_source` (or legacy `goal_confirmation.source`)
- Legacy `goal_confirmation` remains accepted for backward compatibility
- Optional and can be empty/draft: `constraints`, `tech_stack`, `locale`
- If already initialized, this tool returns `already_initialized` by default
- To change goals later, call with `force_goal_update=true` and `update_reason` (enforced at runtime)

### brain_recent_activity

Read recent Git commits and detect hot paths.

### brain_context

Generate AI-ready project context.

### brain_capture_note

Store notes about the project.

### brain_record_progress

Record progress, decisions, and milestones.

### brain_estimate_progress

Estimate milestone progress with explainable reasoning.

### brain_suggest_actions

Generate prioritized next actions.

## Init Policy

- `brain_init` is designed as a one-time goal anchor.
- The long-term goal should come from explicit user input, not model guesses.
- `brain_init` now enforces explicit confirmation that saved goals are final goals, not current implementation state.
- Non-goal profile fields can be filled gradually or left empty.
- Goal changes are allowed only when explicitly requested by the user.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/myczh-1/project-brain-mcp
cd project-brain-mcp
```

Install dependencies:

```bash
pnpm install
```

Run development server:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

---

## License

MIT
