## Why

The codebase has several structural problems identified during code review that increase maintenance cost and hide type-safety bugs:

1. **11 instances of `as unknown as` type erasure** in transport layers bypass TypeScript's type system, silently accepting breaking changes at compile time that surface only at runtime.
2. **Triplicated progress-recording logic** in `startWork.ts` violates DRY and makes future changes error-prone.
3. **Redundant re-export packages** (`core`, `core-protocol/runtime`) add indirection with zero functional value — no independent consumers exist.
4. **1454-line string-template UI** in `ui.ts` cannot be linted, type-checked, or tested, and is growing in complexity.
5. **Dead `src/` directory** referenced in `tsconfig.json` but contains zero `.ts` files.

These are all low-risk fixes that improve correctness and reduce cognitive overhead without changing any public API behavior.

## What Changes

- Eliminate all `as unknown as` casts in `transport-http/server.ts` and `transport-mcp/server.ts` by fixing generic signatures on `sendJson` and `toStructuredContent`.
- Refactor `startWork.ts` to extract a shared `resolveChange` step and a shared progress-recording step, removing the three near-identical branches.
- Consolidate `packages/core` (pure re-export of `core-protocol`) into direct imports at call sites; remove the `core` package.
- Consolidate `packages/core-protocol/src/runtime/` (pure re-export of `application/commands`) into direct imports at call sites; remove the re-export layer.
- Extract `ui.ts` inline HTML/CSS/JS into static files served from disk, so they can be linted and tested independently.
- Remove the empty `src/` directory and its reference from `tsconfig.json`.
- Update `package.json` exports and `tsconfig.json` path aliases to reflect the consolidated package structure.

## Capabilities

### New Capabilities
- `type-safe-transport`: Eliminate `as unknown as` type erasure in HTTP and MCP transport layers through proper generic signatures.
- `startwork-dedup`: Refactor `startWork.ts` to eliminate triplicated progress-recording logic via extracted helper functions.
- `package-consolidation`: Remove pure re-export packages (`core`, `core-protocol/runtime`) and update all import paths to reference canonical locations directly.
- `static-ui-extraction`: Extract inline HTML/CSS/JS from `ui.ts` string templates into serveable static files.
- `dead-code-cleanup`: Remove empty `src/` directory and stale `tsconfig.json` references.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Affected code**: `packages/transport-http/`, `packages/transport-mcp/`, `packages/application/src/commands/startWork.ts`, `packages/core/`, `packages/core-protocol/src/runtime/`, `packages/runtime/src/service.ts`, `tsconfig.json`, `package.json`
- **APIs**: No public API changes. HTTP endpoints, MCP tools, and CLI remain identical.
- **Dependencies**: No new dependencies. Possible removal of unused path aliases.
- **Risk**: Low. All changes are internal refactoring. Type-safety fixes may surface currently-hidden type errors that need correction.
