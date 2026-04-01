## 1. Dead Code Cleanup

- [x] 1.1 Delete the empty top-level `src/` directory
- [x] 1.2 Remove `src/**/*` from the `include` array in `tsconfig.json`
- [x] 1.3 Run `tsc --noEmit` and confirm zero errors

## 2. Type-Safe Transport — HTTP

- [x] 2.1 Change `sendJson` signature in `packages/transport-http/src/server.ts` to accept `body: unknown` instead of `JsonRecord`
- [x] 2.2 Remove the `JsonRecord` type if it has no other consumers
- [x] 2.3 Remove all `as unknown as JsonRecord` casts at `sendJson` call sites (9 instances)
- [x] 2.4 Run `tsc --noEmit` and fix any cascading type errors in `packages/transport-http/`

## 3. Type-Safe Transport — MCP

- [x] 3.1 Fix `toStructuredContent` return type in `packages/transport-mcp/src/server.ts` to return `Record<string, unknown>` compatible with MCP SDK
- [x] 3.2 Remove `as unknown as` casts at `toStructuredContent` call sites (2 instances)
- [x] 3.3 Run `tsc --noEmit` and fix any cascading type errors in `packages/transport-mcp/`
- [x] 3.4 Grep all `packages/**/*.ts` for `as unknown as` — confirm zero matches

## 4. startWork Deduplication

- [x] 4.1 Extract `resolveChange(cwd, input)` helper function in `packages/application/src/commands/startWork.ts` that returns `{ change, changePath, action }`
- [x] 4.2 Replace the three inline resolution branches with a single call to `resolveChange`
- [x] 4.3 Collapse the three duplicated progress-recording blocks into one shared code path after `resolveChange`
- [x] 4.4 Run `tsc --noEmit` and confirm the file compiles cleanly
- [x] 4.5 Verify the progress-recording call pattern appears exactly once (not three times)

## 5. Package Consolidation — core

- [x] 5.1 Find all import sites referencing `@myczh/project-brain/core/storage`, `core/git`, `core/understanding` across the codebase
- [x] 5.2 Update each import to reference `@myczh/project-brain/core-protocol/storage`, `core-protocol/git`, `core-protocol/understanding`
- [x] 5.3 Delete `packages/core/` directory entirely
- [x] 5.4 Remove `./core`, `./core/git`, `./core/storage`, `./core/understanding` from `package.json` exports
- [x] 5.5 Remove `core/*` path aliases from `tsconfig.json` that pointed to `packages/core/src/`

## 6. Package Consolidation — core-protocol/runtime

- [x] 6.1 Find all import sites referencing `@myczh/project-brain/core-protocol/runtime`
- [x] 6.2 Update each import to reference `@myczh/project-brain/application/commands` directly
- [x] 6.3 Delete `packages/core-protocol/src/runtime/` directory
- [x] 6.4 Remove `./core-protocol/runtime` from `package.json` exports if present
- [x] 6.5 Remove `core-protocol/runtime` path alias from `tsconfig.json` if present
- [x] 6.6 Run `tsc --noEmit` on full project — confirm zero errors after both consolidation phases

## 7. Static UI Extraction

- [x] 7.1 Create `packages/transport-http/static/` directory
- [x] 7.2 Extract HTML content from `ui.ts` render function into `static/index.html`
- [x] 7.3 Extract CSS content from `ui.ts` into `static/styles.css`
- [x] 7.4 Extract JS content from `ui.ts` into `static/app.js`
- [x] 7.5 Remove TypeScript string escaping artifacts from all three static files
- [x] 7.6 Replace the inline render functions in `ui.ts` with a loader that reads cached static files via `readFileSync` at module load
- [x] 7.7 Verify `ui.ts` is under 100 lines after extraction
- [x] 7.8 Run `tsc --noEmit` and confirm the transport-http package compiles cleanly

## 8. Final Verification

- [x] 8.1 Run full `tsc --noEmit` — zero errors
- [x] 8.2 Run `npm run build` — exit code 0
- [x] 8.3 Grep for `as unknown as` across all `packages/**/*.ts` — zero matches
- [x] 8.4 Confirm `packages/core/` does not exist
- [x] 8.5 Confirm `packages/core-protocol/src/runtime/` does not exist
- [x] 8.6 Confirm `src/` does not exist at project root
- [x] 8.7 Start the server and verify `GET /ui` returns the dashboard correctly
