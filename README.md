# Project Brain

AI Project Context Engine - MCP server for understanding project context.

## What is Project Brain?

Project Brain is an MCP (Model Context Protocol) server that helps AI coding agents understand your project by:

- Reading local Git history
- Storing project initialization information
- Capturing user notes
- Generating stable project context for AI

## Installation

```bash
npx project-brain
```

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "project-brain": {
      "command": "npx",
      "args": ["-y", "project-brain"]
    }
  }
}
```

## Available Tools

### project_init

Initialize project with manifest information.

### project_recent_activity

Get recent git activity with commits and hot paths.

### project_context

Generate AI-ready project context.

### project_capture_note

Capture notes about the project.

## Local Development

```bash
pnpm install
pnpm dev
pnpm build
```

## License

MIT
