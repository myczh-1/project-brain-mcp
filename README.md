# Project Brain

Durable project memory for AI-assisted development.

## What It Does

- Provides a durable project memory mechanism for AI-assisted development loops.
- Stores project context, changes, decisions, and progress in the `.project-brain/` directory.
- Uses a lightweight file-based workflow where AI tools read and write `.project-brain/` directly.

## In Practice

| Feature | Experience |
|:--|:--|
| **Change History** | The AI becomes more "stateful" and stops repeating the same architectural mistakes. |
| **Architecture Index** | The AI is less likely to lose track of things during cross-file changes. |
| **Preference Capture** | The AI learns your architecture decisions and implementation choices, so its outputs feel more consistent¹. |
| **Failed Attempt Memory** | The AI stops recommending approaches you already tried and ruled out. |

## Quick Start

Copy the text below into your AI assistant and let it complete the installation:

```text
Please install Project Brain in this repository by following https://github.com/myczh-1/project-brain/docs/install.md.
Configure Project Brain through `project-brain stdio`.
Do not edit `.project-brain/` files directly.
Explain which files you plan to modify before editing them.
```

Or, if you prefer, you can follow the docs and install it manually.

## Integration Guides

- [Install](./docs/install.md)
- [Getting Started](./docs/guide-getting-started.md)
- [OpenSpec Integration](./docs/guide-openspec-integration.md)

## Learn More

### How It Works After Install

Once installed, your AI assistant will:

- call Project Brain through `project-brain stdio`,
- follow repository-local instructions from `AGENTS.md` when present,
- read Project Brain when it needs project memory or task context,
- and update Project Brain through the stdio tools instead of editing `.project-brain/` files directly.

For the full workflow, see [docs/guide-openspec-integration.md](./docs/guide-openspec-integration.md).

### Architecture

Project Brain follows a layered architecture:

- **protocol**: Pure type definitions and schemas.
- **core**: Domain logic, commands, queries, and ports.
- **infra-fs**: Filesystem implementation of storage and git ports.
- **mode-embedded**: File-based integration helpers for repository-local workflows.
- **app**: Bootstrap CLI and stdio entry point.

## License

MIT

---

[中文文档](./README.zh-CN.md)

<small>
1: Or the model's own preferences
</small>
