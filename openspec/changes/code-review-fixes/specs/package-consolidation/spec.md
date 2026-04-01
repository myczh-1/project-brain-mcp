## ADDED Requirements

### Requirement: Remove packages/core re-export layer
The `packages/core/` directory SHALL be deleted. All import sites that reference `@myczh/project-brain/core/storage`, `@myczh/project-brain/core/git`, or `@myczh/project-brain/core/understanding` SHALL be updated to reference the canonical location in `@myczh/project-brain/core-protocol/` directly (e.g., `@myczh/project-brain/core-protocol/storage`).

#### Scenario: No imports reference packages/core
- **WHEN** a text search for `from.*core/storage`, `from.*core/git`, or `from.*core/understanding` (excluding `core-protocol`) runs across all `packages/**/*.ts`
- **THEN** zero matches reference the old `packages/core/` paths
- **THEN** all matches point to `core-protocol/` canonical paths

#### Scenario: packages/core directory does not exist
- **WHEN** the filesystem is inspected after the change
- **THEN** `packages/core/` does not exist

#### Scenario: Build succeeds without packages/core
- **WHEN** `tsc --noEmit` runs on the full project
- **THEN** compilation succeeds with zero errors

### Requirement: Remove core-protocol/runtime re-export layer
The re-export files in `packages/core-protocol/src/runtime/` SHALL be deleted. All import sites that reference `@myczh/project-brain/core-protocol/runtime` SHALL be updated to reference `@myczh/project-brain/application/commands` directly.

#### Scenario: No imports reference core-protocol/runtime
- **WHEN** a text search for `from.*core-protocol/runtime` runs across all `packages/**/*.ts`
- **THEN** zero matches are returned (excluding the deleted re-export files themselves)

#### Scenario: core-protocol/src/runtime directory does not exist
- **WHEN** the filesystem is inspected after the change
- **THEN** `packages/core-protocol/src/runtime/` does not exist

### Requirement: package.json exports updated
The `package.json` exports map SHALL remove entries for `./core`, `./core/git`, `./core/storage`, `./core/understanding`, and `./core-protocol/runtime`. The exports for `./core-protocol/*` that remain valid SHALL be preserved.

#### Scenario: No stale export paths in package.json
- **WHEN** `package.json` is parsed
- **THEN** no export key starts with `./core/` (the old pure re-export package)
- **THEN** no export key equals `./core-protocol/runtime`

### Requirement: tsconfig.json path aliases updated
The `tsconfig.json` paths SHALL remove aliases that pointed to the deleted `packages/core/` and `packages/core-protocol/src/runtime/` directories.

#### Scenario: No stale path aliases in tsconfig.json
- **WHEN** `tsconfig.json` is parsed
- **THEN** no path alias key contains `core/` that pointed to `packages/core/src/`
- **THEN** no path alias key references `core-protocol/runtime`
