# Getting Started with Project Brain

This guide provides step-by-step instructions for installing, configuring, and using Project Brain in your development environment.

## Prerequisites

Before starting, ensure you have the following installed:
- Node.js 18 or higher
- A git repository where you intend to use Project Brain

## Installation

You can run Project Brain without installation or install it as a dependency.

### Quick Run
Execute without installation:
```bash
npx -y @myczh/project-brain
```

### Global Installation
Install globally to use the `project-brain` command anywhere:
```bash
npm install -g @myczh/project-brain
```

### Development Dependency
Install in your project to lock the version:
```bash
npm install --save-dev @myczh/project-brain
```

## Starting the Service

Start the Project Brain server by running:
```bash
npx @myczh/project-brain
# OR if globally installed:
project-brain
```

Expected output:
```text
Project Brain HTTP server running at http://127.0.0.1:3210
```

### Verify the Service
Confirm the server is active by checking the health endpoint:
```bash
curl http://127.0.0.1:3210/health
```
The response should be `{"status":"ok"}`.

## Connecting Your AI Assistant

Project Brain provides an MCP (Model Context Protocol) endpoint at `http://127.0.0.1:3210/mcp`.

### Cursor
1. Go to **Settings** -> **MCP Servers**.
2. Add a new server with the URL: `http://127.0.0.1:3210/mcp`.

### Claude Desktop
First, start the Project Brain server in a terminal:
```bash
npx -y @myczh/project-brain
```
Then edit your `claude_desktop_config.json` file:
```json
{
  "mcpServers": {
    "project-brain": {
      "url": "http://127.0.0.1:3210/mcp"
    }
  }
}
```
*Note: Claude Desktop connects to the running HTTP server. Keep the terminal open while using Claude Desktop.*

### OpenCode
Edit your `opencode.json` file to include the MCP server:
```json
{
  "mcpServers": {
    "project-brain": {
      "url": "http://127.0.0.1:3210/mcp"
    }
  }
}
```

## First Use — Initialize Project

Once connected, your AI assistant can interact with Project Brain.

1. **Initialize Project**: Call `brain_init`. This sets up the initial project identity and repository structure.
2. **Check Context**: Call `brain_context` to verify the current state and see active goals.

## Daily Workflow

Follow this pattern to maintain a durable project memory:

1. **Before Work**: Call `brain_context` to hydrate the assistant with current goals and recent progress.
2. **Start Meaningful Work**: Call `brain_start_work` when beginning a new feature or fix.
3. **During Work**:
   - Call `brain_checkpoint` to record milestones.
   - Call `brain_log_decision` when making architectural or implementation choices.
   - Call `brain_capture_note` for observations or follow-up items.
4. **End of Work**: Call `brain_finish_work` to summarize the changes and update the project state.

## Understanding Your Data

Project Brain stores all data in a `.project-brain/` directory at your repository root:

- `manifest.json`: Project identity (name, summary, repo type, stack).
- `project-spec.json`: Stable project truth and rules.
- `changes/<id>.json`: Structured records for individual implementation tasks.
- `decisions.ndjson`: Append-only log of engineering decisions.
- `notes.ndjson`: Captured fragments and observations.
- `progress.ndjson`: Timeline of execution updates and blockers.
- `milestones.json`: Broad phase and milestone tracking.

You can inspect these files directly or view them through the Dashboard UI at `http://127.0.0.1:3210/ui`.

## Configuration

Environment variables can be used to customize the server:

- `PROJECT_BRAIN_HOST`: The interface to bind the server to (default: `127.0.0.1`).
- `PROJECT_BRAIN_PORT`: The port for the HTTP server (default: `3210`).
- `PROJECT_BRAIN_ALLOWED_ORIGINS`: Comma-separated list of origins for CORS.

## Troubleshooting

- **Port in Use**: If port 3210 is occupied, set a different `PROJECT_BRAIN_PORT`.
- **CORS Errors**: Ensure your client origin is included in `PROJECT_BRAIN_ALLOWED_ORIGINS`.
- **MCP Connection Fails**: Verify the server is running and the endpoint `/mcp` is accessible via browser or curl.

## Next Steps

- Consult the [Agent Integration Guide](./guide-agent-integration.md) for deep integration with specific AI assistants.
- Review the [OpenSpec Integration Guide](./guide-openspec-integration.md) to learn how to use Project Brain with specification-driven development.
