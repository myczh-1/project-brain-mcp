# Project Brain Protocol v0

## Stability Tiers

- **stable protocol**: persisted `.project-brain/*` data contract defined in this `protocol/` directory.
- **optional runtime convenience**: MCP/HTTP services, dashboard views, and composite workflow helpers built on top of the stable protocol.

Project Brain has two different concepts now:

- the protocol contract for `.project-brain/*`
- the runtime and product implementations that read, write, analyze, and serve that state

This directory defines the protocol contract.

The goal is simple:

- a lightweight tool should be able to produce valid Project Brain state by understanding this protocol alone
- HTTP, MCP, UI, and runtime packages are implementations over this contract, not the contract itself

Protocol v0 is the current persisted-state contract.

- It is file-state first, not RPC first.
- It does not require a Project Brain runtime package.
- It allows direct file generation plus optional thin validation.

Start here:

- `protocol/files.md` - directory layout and ownership rules
- `protocol/semantics.md` - the single normative source for storage semantics, overwrite rules, conflict handling, and state invariants
- `protocol/commands.md` - minimal protocol commands and queries
- `protocol/runtime-composites.md` - optional runtime convenience workflows built on top of minimal protocol operations
- `protocol/lightweight-mode.md` - how coding tools can use the protocol without binding to runtime code
- `protocol/schemas/source/*.json` - machine-readable schemas for core source records
- `protocol/schemas/derived/*.json` - optional schemas for derived artifacts

Versioning notes:

- Protocol v0 documents the current persisted-state model used by this repository.
- Protocol version is explicit at the contract level: external producers should declare that they target `Project Brain Protocol v0` and validate against this schema set.
- Persisted records in v0 do not yet require in-file version markers.
- If multiple stored protocol versions ever need to coexist in one repository, manifest-level version markers become mandatory in a later revision.
