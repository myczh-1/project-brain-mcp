## ADDED Requirements

### Requirement: UI served from static files
The HTTP transport SHALL serve the dashboard UI from static files located in `packages/transport-http/static/` instead of from inline TypeScript string templates. The static directory SHALL contain `index.html`, `styles.css`, and `app.js` as separate files.

#### Scenario: Static files exist on disk
- **WHEN** the filesystem is inspected
- **THEN** `packages/transport-http/static/index.html` exists and contains valid HTML
- **THEN** `packages/transport-http/static/styles.css` exists and contains valid CSS
- **THEN** `packages/transport-http/static/app.js` exists and contains valid JavaScript

#### Scenario: Dashboard renders identically
- **WHEN** a browser loads `http://127.0.0.1:3210/ui`
- **THEN** the rendered page is visually and functionally identical to the current inline-template version

### Requirement: Static files cached at startup
The server SHALL read static files via `node:fs.readFileSync` at module load time and cache the contents in memory. The `/ui` route handler SHALL serve cached strings, not perform file I/O per request.

#### Scenario: No per-request file I/O
- **WHEN** the server starts and loads the UI module
- **THEN** `readFileSync` is called once per static file during module initialization
- **WHEN** a request hits `/ui` after startup
- **THEN** the handler returns the cached string without calling `readFileSync`

### Requirement: Inline template functions removed
The render functions in `packages/transport-http/src/ui.ts` that return HTML/CSS/JS as string literals SHALL be removed or replaced with a thin loader that returns the cached static file content. The file SHALL be reduced from ~1454 lines to under 100 lines.

#### Scenario: ui.ts is minimal
- **WHEN** `packages/transport-http/src/ui.ts` is inspected after the change
- **THEN** the file contains fewer than 100 lines of code
- **THEN** no multi-line template literal containing HTML tags exists in the file

### Requirement: Static files are lintable
The extracted `index.html`, `styles.css`, and `app.js` files SHALL be valid standalone files that standard linters and formatters can process. They SHALL NOT contain TypeScript string escaping artifacts.

#### Scenario: HTML file passes validation
- **WHEN** `index.html` is opened in a browser or HTML validator
- **THEN** no escaped backticks, no `${` interpolation syntax, and no TypeScript artifacts are present
