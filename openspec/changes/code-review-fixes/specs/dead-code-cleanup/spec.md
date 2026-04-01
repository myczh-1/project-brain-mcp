## ADDED Requirements

### Requirement: Empty src directory removed
The top-level `src/` directory SHALL be deleted. It contains no TypeScript source files and serves no purpose.

#### Scenario: src directory does not exist
- **WHEN** the filesystem is inspected at the project root
- **THEN** no `src/` directory exists

### Requirement: tsconfig.json no longer references src
The `tsconfig.json` `include` array SHALL NOT contain `src/**/*` or any pattern referencing the deleted `src/` directory.

#### Scenario: tsconfig include is clean
- **WHEN** `tsconfig.json` is parsed
- **THEN** the `include` array does not contain any entry matching `src/**/*`
- **THEN** `tsc --noEmit` succeeds without errors
