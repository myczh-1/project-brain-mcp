## ADDED Requirements

### Requirement: Single resolveChange entry point
The `startWork` command in `packages/application/src/commands/startWork.ts` SHALL use a single `resolveChange(cwd, input)` helper function to handle all three change-resolution branches: adopt recent change, reuse by ID, and create new change. The helper SHALL return a result containing the resolved change object, the change file path, and the action taken (adopted, reused, or created).

#### Scenario: Adopt recent change
- **WHEN** `resolveChange` is called with input that matches a recent open change
- **THEN** it returns `{ change, changePath, action: "adopted" }` for that change
- **THEN** the returned change is identical to what the current inline branch produces

#### Scenario: Reuse change by ID
- **WHEN** `resolveChange` is called with input containing an explicit change ID
- **THEN** it returns `{ change, changePath, action: "reused" }` for the matching change
- **THEN** the returned change is identical to what the current inline branch produces

#### Scenario: Create new change
- **WHEN** `resolveChange` is called with input that does not match any existing change
- **THEN** it returns `{ change, changePath, action: "created" }` with a newly created change
- **THEN** the returned change is identical to what the current inline branch produces

### Requirement: Single progress-recording code path
After the change is resolved, the `startWork` command SHALL record progress through a single shared code path regardless of which resolution branch was taken. The duplicated progress-recording blocks SHALL be removed entirely.

#### Scenario: Progress recorded identically for all branches
- **WHEN** `startWork` resolves a change via any of the three branches
- **THEN** progress is recorded using the same function call with the same parameters
- **THEN** no duplicated progress-recording logic exists in the file

#### Scenario: Grep confirms no duplication
- **WHEN** a text search for the progress-recording call pattern runs in `startWork.ts`
- **THEN** exactly one call site exists (not three)
