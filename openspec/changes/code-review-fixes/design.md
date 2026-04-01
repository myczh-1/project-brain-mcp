## Context

ProjectBrain is a Node.js/TypeScript monorepo (single `tsc` build, single npm package `@myczh/project-brain`) organized into 12 internal packages under `packages/`. A code review identified five categories of structural debt:

1. **Type erasure**: 11 uses of `as unknown as` in the two transport layers bypass compile-time safety.
2. **Code duplication**: `startWork.ts` contains three near-identical branches for progress recording.
3. **Indirection bloat**: `packages/core` is a pure re-export of `packages/core-protocol`; `packages/core-protocol/src/runtime/` is a pure re-export of `packages/application/src/commands/`.
4. **Untestable UI**: `ui.ts` embeds 1454 lines of HTML/CSS/JS as TypeScript string templates.
5. **Dead references**: Empty `src/` directory still referenced in `tsconfig.json`.

All changes are internal refactoring. The public surface (HTTP API, MCP tools, CLI) is unchanged.

## Goals / Non-Goals

**Goals:**
- Eliminate all `as unknown as` casts so the compiler catches type drift at build time
- Remove duplicated logic in `startWork.ts` so future changes only need one edit
- Reduce the number of indirection layers the developer must trace through
- Make the UI code lintable and testable by extracting it from string templates
- Remove dead code and stale config references

**Non-Goals:**
- Changing public API behavior or wire formats
- Adding new features or capabilities
- Migrating to a real monorepo tool (turborepo, nx) — the single-build approach is fine for now
- Building a production frontend toolchain (webpack, vite) — static files served by node:http are sufficient
- Restructuring the overall package architecture beyond removing pure re-export layers

## Decisions

### D1: Fix `sendJson` with generic signature instead of `unknown` body

**Choice**: Change `sendJson` to accept `body: unknown` and call `JSON.stringify` on it (which already accepts `unknown`). Remove the `JsonRecord` type constraint.

**Alternative considered**: Make `sendJson` generic `<T>`. Rejected because `JSON.stringify` already accepts `any` — adding a generic adds complexity without safety benefit. The real safety comes from removing the cast at the call site.

**Alternative considered**: Use zod runtime validation on responses. Rejected as over-engineering for a local service where the response types are already well-defined by the command layer.

### D2: Fix `toStructuredContent` with proper typing

**Choice**: Change `toStructuredContent` return type to `Record<string, unknown>` and use `JSON.parse(JSON.stringify(payload))` to ensure a clean JSON-compatible object, OR accept `unknown` and let the MCP SDK handle serialization.

**Alternative considered**: Define a `StructuredContent` interface matching the MCP SDK's expectation. Rejected because the SDK itself uses `Record<string, unknown>` — matching that directly is sufficient.

### D3: Extract `resolveChange` helper in `startWork.ts`

**Choice**: Extract a `resolveChange(cwd, input)` function that handles the three branches (adopt recent, reuse by id, create new) and returns `{ change, change_path, action }`. The shared progress-recording logic follows as a single code path.

**Alternative considered**: Use a strategy pattern with separate handler classes. Rejected — over-engineering for three branches in one function.

### D4: Collapse `core` package into direct imports

**Choice**: Update all import sites that use `@myczh/project-brain/core/storage` to use `@myczh/project-brain/core-protocol/storage` directly. Remove `packages/core/`, its `package.json` exports, and its `tsconfig.json` path aliases.

Similarly, update imports of `@myczh/project-brain/core-protocol/runtime` to use `@myczh/project-brain/application/commands` directly. Remove the re-export files in `packages/core-protocol/src/runtime/`.

**Alternative considered**: Keep `core` as a convenience facade. Rejected — a facade with zero logic adds a layer that developers must mentally dereference. Direct imports are clearer.

### D5: Extract UI to static files

**Choice**: Create `packages/transport-http/static/` with `index.html`, `styles.css`, and `app.js`. Serve them via `node:fs.readFileSync` at startup (cache in memory). Remove the three render functions from `ui.ts`.

**Alternative considered**: Use a bundler (vite, esbuild). Rejected — adds a build dependency for a debug dashboard. Plain files are sufficient.

**Alternative considered**: Delete the UI entirely. Rejected — the dashboard provides real value for debugging and observability.

### D6: Phased execution order

**Choice**: Execute in dependency order to keep the codebase buildable at every step:
1. Dead code cleanup (`src/`, tsconfig) — zero risk
2. Type-safe transport — fixes hidden bugs, no structural change
3. `startWork` dedup — isolated to one file
4. Package consolidation — widest blast radius, done last when other changes are stable
5. UI extraction — independent, can happen anytime

## Risks / Trade-offs

- **[Package consolidation breaks external consumers]** → Mitigation: This is version 0.0.3 with no known external consumers beyond the author. The npm exports in `package.json` for `./core`, `./core/git`, `./core/storage`, `./core/understanding` will be removed. If any external consumer exists, they break. Acceptable at this version.
- **[Type fixes surface hidden type errors]** → Mitigation: This is the point. Run `tsc --noEmit` after each change to catch and fix cascading errors immediately. These are bugs that already exist but are hidden by casts.
- **[UI extraction changes serving behavior]** → Mitigation: Use `readFileSync` at startup to cache files in memory, so runtime behavior is identical to the current string-return approach. No I/O on each request.
