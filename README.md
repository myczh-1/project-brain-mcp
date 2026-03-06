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

### project_init

Initialize the project with manifest information.

### project_recent_activity

Read recent Git commits and detect hot paths.

### project_context

Generate AI-ready project context.

### project_capture_note

Store notes about the project.

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
