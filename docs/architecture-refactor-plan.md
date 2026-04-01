# Architecture Refactor Plan

## Goal

Make the package boundaries real.

Target dependency direction:

`protocol <- core <- application <- transport`

Allowed top-level composition layers:

- `mode-service`
- `mode-embedded`
- `app`

These composition layers may depend on `application` and `transport`, but they should not become new business-logic layers.

## Current Diagnosis

The current repository has a clear product idea, but the package graph is not telling the truth.

The biggest structural issues are:

- `core-protocol` mixes protocol, storage, git helpers, pure analysis, and runtime write flows.
- `runtime` and `context` are both application-layer orchestration, but they are split in a way that encourages cross-package reach-through.
- `transport-http` and `transport-mcp` import application internals by relative `src` paths.
- `mode-service`, `mode-embedded`, and `app` are assembling the system by importing other packages' `src` files directly.
- There is one explicit reverse dependency from `core-protocol` back into `runtime`.

## Target Package Layout

### `packages/protocol`

Responsibility:

- public types
- command/query definitions
- schemas
- semantic rules

Must not contain:

- file IO
- git execution
- runtime orchestration
- HTTP or MCP logic

### `packages/core`

Responsibility:

- file-backed storage
- repo-root and brain-dir resolution
- git readers and parsers
- pure analysis helpers
- text/template generation helpers

May depend on:

- `protocol`

Must not depend on:

- `application`
- `transport-*`
- `mode-*`
- `app`

### `packages/application`

Responsibility:

- use-case orchestration
- command handlers
- query handlers
- analysis flows that compose `core`
- unified service facade for transports

May depend on:

- `protocol`
- `core`

Must not depend on:

- `transport-*`
- `mode-*`
- `app`

### `packages/transport-http`

Responsibility:

- HTTP request parsing
- runtime input validation
- response serialization
- HTTP error mapping
- UI asset serving

May depend on:

- `application`
- `protocol`

Must not depend on:

- `core` directly

### `packages/transport-mcp`

Responsibility:

- MCP tool registration
- MCP input validation
- MCP response shaping
- MCP transport session handling

May depend on:

- `application`
- `protocol`

Must not depend on:

- `core` directly

### `packages/mode-service`

Responsibility:

- compose application + transports for service mode

### `packages/mode-embedded`

Responsibility:

- compose application facade for embedded mode

### `packages/app`

Responsibility:

- process startup
- env parsing
- graceful shutdown

## File Mapping

This table is the migration contract for the refactor. "Action" means the intended move, not necessarily the first PR.

| Current file | Current role | Target package | Target area | Action |
| --- | --- | --- | --- | --- |
| `protocol/README.md` | protocol docs | `protocol` | docs | keep, later co-locate or publish with `packages/protocol` |
| `protocol/commands.md` | protocol docs | `protocol` | docs | keep, later co-locate or publish with `packages/protocol` |
| `protocol/files.md` | protocol docs | `protocol` | docs | keep |
| `protocol/lightweight-mode.md` | protocol docs | `protocol` | docs | keep |
| `protocol/runtime-composites.md` | protocol docs | `protocol` | docs | keep |
| `protocol/semantics.md` | protocol docs | `protocol` | docs | keep |
| `protocol/schemas/source/*.json` | source schemas | `protocol` | `schemas/source` | move under `packages/protocol` when package is introduced |
| `protocol/schemas/derived/*.json` | derived schemas | `protocol` | `schemas/derived` | move under `packages/protocol` when package is introduced |
| `packages/core-protocol/src/storage/fileOps.ts` | storage primitive | `core` | `storage` | move |
| `packages/core-protocol/src/storage/brainDir.ts` | storage primitive | `core` | `storage` | move |
| `packages/core-protocol/src/storage/repoRoot.ts` | storage primitive | `core` | `storage` | move |
| `packages/core-protocol/src/storage/manifest.ts` | manifest storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/projectSpec.ts` | spec storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/changes.ts` | change storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/decisions.ts` | decision storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/notes.ts` | note storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/progress.ts` | progress storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/milestones.ts` | milestone storage | `core` | `storage` | move |
| `packages/core-protocol/src/storage/nextActions.ts` | derived storage helper | `core` | `storage` | move |
| `packages/core-protocol/src/git/gitExec.ts` | git exec | `core` | `git` | move |
| `packages/core-protocol/src/git/parseLog.ts` | git parse | `core` | `git` | move |
| `packages/core-protocol/src/git/hotPaths.ts` | git analysis helper | `core` | `git` | move |
| `packages/core-protocol/src/understanding/contextTemplate.ts` | pure context template | `core` | `understanding` | move |
| `packages/core-protocol/src/understanding/estimateProgress.ts` | pure analysis | `core` | `understanding` | move |
| `packages/core-protocol/src/understanding/inferFocus.ts` | pure analysis | `core` | `understanding` | move |
| `packages/core-protocol/src/understanding/recommendActions.ts` | pure analysis | `core` | `understanding` | move |
| `packages/core-protocol/src/understanding/i18n.ts` | helper | `core` | `understanding` | move |
| `packages/core-protocol/src/runtime/initializeProject.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/defineProjectSpec.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/createChange.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/updateChange.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/logDecision.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/captureNote.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/recordProgress.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/startWork.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/checkpointWork.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/ingestMemory.ts` | command orchestration | `application` | `commands` | move |
| `packages/core-protocol/src/runtime/createProtocolCore.ts` | reverse adapter | delete | n/a | remove; `protocol` must not depend on `runtime` |
| `packages/core-protocol/src/index.ts` | unstable façade | split | n/a | replace with explicit `protocol` and `core` entrypoints |
| `packages/runtime/src/protocol.ts` | runtime command/query type facade | `protocol` or `application` | `types` | split: public message types to `protocol`, runtime-specific facade to `application` only if still needed |
| `packages/runtime/src/service.ts` | application service | `application` | `service` | move and simplify |
| `packages/runtime/src/index.ts` | runtime facade | `application` | `index` | move and simplify |
| `packages/context/src/context/getProjectContext.ts` | query orchestration | `application` | `queries` | move |
| `packages/context/src/context/getChangeContext.ts` | query orchestration | `application` | `queries` | move |
| `packages/context/src/dashboard/buildDashboard.ts` | query composition | `application` | `queries/dashboard` | move |
| `packages/context/src/dashboard/getDashboard.ts` | query orchestration | `application` | `queries/dashboard` | move |
| `packages/context/src/dashboard/types.ts` | dashboard DTO types | `application` | `queries/dashboard` | move |
| `packages/context/src/analysis/recentActivity.ts` | query/analysis orchestration | `application` | `analysis` | move |
| `packages/context/src/analysis/suggestNextActions.ts` | analysis orchestration | `application` | `analysis` | move |
| `packages/context/src/analysis/brainAnalyze.ts` | analysis orchestration | `application` | `analysis` | move |
| `packages/context/src/analysis/finishWork.ts` | command + reflection orchestration | `application` | `analysis` | move |
| `packages/context/src/service.ts` | query service | `application` | `service` | merge into unified application service |
| `packages/context/src/index.ts` | query facade | `application` | `index` | merge into unified application entrypoint |
| `packages/transport-http/src/api.ts` | transport-to-service adapter | `transport-http` | `api` | keep, rewrite against `application` facade only |
| `packages/transport-http/src/server.ts` | HTTP server | `transport-http` | `server` | keep, add input validation and stop using cross-package `src` imports |
| `packages/transport-http/src/ui.ts` | HTTP UI prototype | `transport-http` | `ui` | keep |
| `packages/transport-http/src/index.ts` | HTTP entrypoint | `transport-http` | `index` | keep |
| `packages/transport-mcp/src/server.ts` | MCP tool server | `transport-mcp` | `server` | keep, rewrite against `application` facade only |
| `packages/transport-mcp/src/index.ts` | MCP entrypoint | `transport-mcp` | `index` | keep |
| `packages/mode-service/src/index.ts` | service-mode composition | `mode-service` | `index` | keep, but import only package entrypoints |
| `packages/mode-service/src/cli.ts` | service CLI | `mode-service` | `cli` | keep |
| `packages/mode-embedded/src/index.ts` | embedded composition | `mode-embedded` | `index` | keep, but import only package entrypoints |
| `packages/app/src/serverMain.ts` | process entrypoint | `app` | `serverMain` | keep, but import only transport package entrypoint |
| `packages/app/src/index.ts` | process entrypoint re-export | `app` | `index` | keep |
| `packages/core-protocol/src/test/testRepo.ts` | test helper | `core` | `test` | move |
| `packages/core-protocol/src/storage/*.test.ts` | core tests | `core` | `storage tests` | move with implementations |
| `packages/core-protocol/src/runtime/createChange.test.ts` | application test | `application` | `command tests` | move with implementation |

## Illegal Dependency Inventory

These imports are the first wave to eliminate.

### Reverse dependency that must die first

- `packages/core-protocol/src/runtime/createProtocolCore.ts -> ../../../runtime/src/index.js`

This is the clearest architectural break. The bottom layer is reaching upward.

### Cross-package relative `src` imports that must be replaced

- `app -> transport-http`
- `mode-service -> context`
- `mode-service -> runtime`
- `mode-service -> transport-http`
- `mode-service -> transport-mcp`
- `mode-service -> app`
- `mode-embedded -> runtime`
- `transport-http -> context`
- `transport-http -> runtime`
- `transport-http -> core-protocol`
- `transport-http/server -> transport-mcp`
- `transport-mcp -> context`
- `transport-mcp -> runtime`
- `runtime -> core-protocol`
- `context -> core-protocol`
- `context/finishWork -> runtime`

## Refactor Phases

### Phase 1: Make imports honest

Objective:

- stop importing across packages by relative `src` paths
- introduce stable package entrypoints or TypeScript path aliases
- remove the `core-protocol -> runtime` reverse dependency

Deliverables:

- package entrypoints for each surviving package
- updated import graph
- build and tests still passing

Non-goals:

- no major file moves yet
- no behavior changes

### Phase 2: Split `core-protocol`

Objective:

- create `packages/protocol`
- create `packages/core`
- move docs/schemas/types into `protocol`
- move storage/git/pure analysis into `core`

Deliverables:

- `core-protocol` removed or reduced to a compatibility shim for one release
- `application` imports only from `core` and `protocol`

Non-goals:

- no transport rewrite yet

### Phase 3: Collapse orchestration into `application`

Objective:

- merge `runtime` and `context` into one application layer
- expose one unified service facade for commands, queries, and analysis

Suggested internal layout:

- `packages/application/src/commands/*`
- `packages/application/src/queries/*`
- `packages/application/src/analysis/*`
- `packages/application/src/service.ts`
- `packages/application/src/index.ts`

Deliverables:

- `transport-http` and `transport-mcp` depend only on `application`
- `mode-service` and `mode-embedded` compose only through package entrypoints

### Phase 4: Harden transport boundaries

Objective:

- remove `as unknown as` style transport boundary casting
- validate HTTP and MCP inputs at runtime
- normalize transport error mapping

Deliverables:

- per-endpoint/per-tool schemas
- failure-path tests
- CORS methods fixed for `DELETE /mcp`

### Phase 5: Add architecture guardrails

Objective:

- prevent future cross-layer drift

Deliverables:

- dependency rule checker in CI
- layer rules encoded in config

Recommended tooling:

- `dependency-cruiser`, or
- `eslint-plugin-boundaries`

## First PR Scope

The first PR should be intentionally boring.

Do only this:

1. Introduce stable internal package import paths.
2. Replace cross-package relative `src` imports with those paths.
3. Delete `createProtocolCore.ts` or move that adapter upward.
4. Keep behavior unchanged.

Success criteria:

- `npm run build` passes
- `npm test` passes
- no import path contains another package's `/src/`

## Validation Checklist Per Phase

- TypeScript build passes.
- Existing tests pass.
- HTTP smoke path still works.
- MCP server still registers tools.
- Public npm export surface is reviewed before release.

## Notes

- Do not start by moving every file. That is how refactors become garbage.
- First make the dependency graph truthful.
- Then split the mixed package.
- Then collapse orchestration into one application layer.
- Then harden transport boundaries.
