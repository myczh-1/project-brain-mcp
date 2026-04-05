# Getting Started with Project Brain

This guide focuses on the file-protocol-driven Lightweight workflow.

## Prerequisites

- Node.js 18+
- A git repository
- An AI assistant that can read/write repository files

## Install and Initialize

Run setup in your repository root:

```bash
npx -y @myczh/project-brain setup
```

Or with a global install:

```bash
npm install -g @myczh/project-brain
project-brain setup
```

Optional checks:

```bash
project-brain doctor
project-brain init
```

## Verify `.project-brain/`

After setup, ensure these files exist:

```text
.project-brain/
  manifest.json
  project-spec.json
  changes/
  decisions.ndjson
  notes.ndjson
  progress.ndjson
  milestones.json
```

## First Use

1. Open `.project-brain/project-spec.json` and confirm baseline project truth.
2. Create a change record in `.project-brain/changes/<change-id>.json`.
3. During implementation, append operational trace:
   - decisions -> `decisions.ndjson`
   - notes -> `notes.ndjson`
   - progress -> `progress.ndjson`
4. On completion, mark change status and sync stable conclusions back into `project-spec.json`.

## Daily Lightweight Loop

1. **Read context**: project-spec + active changes.
2. **Do work**: implement code changes.
3. **Record memory**: decisions / notes / progress.
4. **Close loop**: update change status and next steps.

## Troubleshooting

- **Missing `.project-brain/`**: rerun `project-brain setup` in repo root.
- **Schema drift**: use files under `protocol/schemas/` as source-of-truth when validating records.
- **Context too noisy**: keep stable rules in `project-spec.json`; keep temporary thoughts in `notes.ndjson`.

## Historical Service/HTTP/UI Docs

Legacy Service/HTTP/UI setup notes are archived at:
- [docs/future/service-http-ui-archive.md](./future/service-http-ui-archive.md)
