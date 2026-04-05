# Project Brain

File-protocol-driven durable project memory for AI-assisted development.

## `.project-brain/` Structure

Project Brain stores durable state in your repository under `.project-brain/`:

```text
.project-brain/
  manifest.json
  project-spec.json
  changes/
    <change-id>.json
  decisions.ndjson
  notes.ndjson
  progress.ndjson
  milestones.json
```

Core files:

- `manifest.json`: Optional project identity (name, summary, stack).
- `project-spec.json`: Stable project truth and architectural constraints.
- `changes/*.json`: Structured records for implementation tasks.
- `decisions.ndjson`: Decision log with rationale.
- `notes.ndjson`: Raw observations and follow-up fragments.
- `progress.ndjson`: Execution timeline and blocker tracking.
- `milestones.json`: High-level phases and milestone tracking.

## Minimal CLI Commands

- `npx -y @myczh/project-brain setup` — detect repository context and initialize `.project-brain/`.
- `npx -y @myczh/project-brain init` — create minimal project identity files.
- `npx -y @myczh/project-brain doctor` — validate repository readiness and local environment.

If globally installed:

```bash
project-brain setup
project-brain init
project-brain doctor
```

## Typical Lightweight Workflow

1. **Initialize once**
   - Run `project-brain setup`.
2. **Before implementation**
   - Read `.project-brain/project-spec.json` and active `changes/*.json`.
3. **During implementation**
   - Update `changes/<change-id>.json`.
   - Append decisions to `decisions.ndjson` and notes to `notes.ndjson`.
   - Record progress checkpoints in `progress.ndjson`.
4. **After implementation**
   - Mark change status done/dropped and sync stable conclusions into `project-spec.json` if needed.

## Guides

- [Getting Started](./docs/guide-getting-started.md)
- [Agent Integration](./docs/guide-agent-integration.md)
- [OpenSpec Integration](./docs/guide-openspec-integration.md)

## Archive

Historical Service/HTTP/UI documentation has been moved to:

- [docs/future/service-http-ui-archive.md](./docs/future/service-http-ui-archive.md)

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT

---

[中文文档](./README.zh-CN.md)
