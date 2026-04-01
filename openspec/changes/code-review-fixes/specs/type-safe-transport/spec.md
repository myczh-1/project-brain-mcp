## ADDED Requirements

### Requirement: sendJson accepts any serializable body
The `sendJson` helper in `packages/transport-http/src/server.ts` SHALL accept `body: unknown` instead of requiring a `JsonRecord` type. The function SHALL call `JSON.stringify(body)` directly, which natively handles `unknown`. All call sites that currently use `as unknown as JsonRecord` to satisfy the old signature SHALL pass their response objects directly without casts.

#### Scenario: Response object passed without cast
- **WHEN** a route handler calls `sendJson(res, someTypedResponse)`
- **THEN** the compiler accepts the call without requiring `as unknown as JsonRecord`
- **THEN** the HTTP response body is identical JSON to the current behavior

#### Scenario: Build succeeds with zero type-erasure casts in HTTP transport
- **WHEN** `tsc --noEmit` runs against `packages/transport-http/src/server.ts`
- **THEN** compilation succeeds
- **THEN** the file contains zero instances of `as unknown as`

### Requirement: toStructuredContent returns MCP-compatible type
The `toStructuredContent` helper in `packages/transport-mcp/src/server.ts` SHALL return a type compatible with the MCP SDK's expected `Record<string, unknown>` without using `as unknown as`. The implementation SHALL produce a clean JSON-serializable object from the command result.

#### Scenario: MCP tool result passes without cast
- **WHEN** a tool handler calls `toStructuredContent(result)` and passes the return value to the MCP SDK
- **THEN** the compiler accepts the value without `as unknown as` at the call site
- **THEN** the MCP response payload is identical to the current behavior

#### Scenario: Build succeeds with zero type-erasure casts in MCP transport
- **WHEN** `tsc --noEmit` runs against `packages/transport-mcp/src/server.ts`
- **THEN** compilation succeeds
- **THEN** the file contains zero instances of `as unknown as`

### Requirement: No type-erasure casts in the codebase
After this change, the entire codebase SHALL contain zero instances of `as unknown as`. Any future introduction of `as unknown as` SHALL be treated as a build policy violation.

#### Scenario: Full codebase grep finds no type erasure
- **WHEN** a text search for `as unknown as` runs across all `packages/**/*.ts` files
- **THEN** zero matches are returned
