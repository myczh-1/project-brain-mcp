# Install Project Brain With Your AI Assistant

Use your coding assistant as the installer.

Give it this repository, point it at this file, and let it handle the environment-specific setup.

## What The Assistant Should Do

1. Ask the user which AI tool to configure.
   - Ask the user to explicitly choose the target tool, for example Codex, Claude, or OpenCode.
   - Do not guess the target tool if the user has not named it.

2. Ask whether to initialize the current repository.
   - Ask whether the user wants Project Brain initialized in the current repository.
   - If yes, initialize `.project-brain/` and generate or update repository-local `AGENTS.md` guidance.
   - If no, configure the tool integration only.
   - Do not ask the user to choose between global config and project config as a product choice; treat config location as an implementation detail of the selected AI tool.

3. Inspect the current repository and target config.
   - Inspect repository state:
     - Confirm the repository root.
     - Check whether `.project-brain/` already exists.
     - Check whether `AGENTS.md` already exists.
     - Check whether `protocol/` exists.
     - Check whether OpenSpec is present.
   - Inspect tool configuration state:
     - Check the selected AI tool config for an existing `project-brain stdio` entry.
     - If repository initialization was requested, check whether the repository already has Project Brain guidance in `AGENTS.md`.

4. Determine whether installation is already complete.
   - If the selected tool config already points to `project-brain stdio`, do not reinstall the tool integration.
   - If repository initialization was requested and `.project-brain/` plus the Project Brain `AGENTS.md` guidance already exist, do not reinitialize them.
   - In that case, report what is already configured, then run verification only.

5. Ensure Project Brain is installed.
   - Before configuring MCP or prompt settings, ensure the `project-brain` binary is available.
   - If `project-brain` is already executable, reuse it.
   - If the binary is missing and the current repository is available, prefer a project-local install so the repository can resolve its own executable, for example:

   ```bash
   npm install --save-dev @myczh/project-brain
   ```

   - If a project-local install is not appropriate and the tool config requires a global executable, install it globally, for example:

   ```bash
   npm install -g @myczh/project-brain
   ```

   - Do not rely on `npx` for persistent tool configuration.

6. Resolve the executable path for stdio.
   - Resolve the executable path that matches the installation method.
   - Prefer a local binary when available, for example:

   ```bash
   ./node_modules/.bin/project-brain stdio
   ```

   - Otherwise use the global binary:

   ```bash
   project-brain stdio
   ```

   - Use `npx -y @myczh/project-brain stdio` only as a temporary fallback when installation cannot be completed automatically.
   - Do not treat `npx` execution as installation.

7. Configure Project Brain through `stdio`.
   - The runtime entrypoint is:

   ```bash
   project-brain stdio
   ```

   - The assistant must wire the resolved stdio command into the target tool's MCP, tool, or agent configuration in the format expected by that tool.
   - Use the closest supported persistent configuration model for the selected AI tool.
   - If the selected AI tool supports repository-local MCP or tool configuration, prefer it only when it is the tool's supported persistent model.
   - If the selected AI tool does not support repository-local MCP or tool configuration, tell the user that limitation explicitly and use the supported persistent scope instead.

8. Initialize the repository when requested.
   - If the user chose repository initialization, ensure `.project-brain/` exists.
   - Generate or update `AGENTS.md` in the repository root with Project Brain usage guidance.
   - If `AGENTS.md` already exists, preserve user-authored content and update only the Project Brain managed section.

9. Verify the installation.
   - Confirm the target AI tool config points to the resolved Project Brain stdio command.
   - If repository initialization was requested, confirm the repository has a valid `.project-brain/` directory and a repository-root `AGENTS.md` containing the Project Brain managed section.
   - If practical, run a simple stdio smoke test against the resolved command.

10. Explain the changes made.
   - Show which files were updated.
   - State which AI tool was configured.
   - Confirm which stdio command was configured.
   - If repository initialization was requested, confirm whether `.project-brain/` and `AGENTS.md` were created or reused.
   - If any config file could not be edited automatically, say that installation is not complete yet.
  
## Important Rules

- Initialization is not the same as installation. Installation is complete only after the target AI tool config has been updated and verified.
- Ask the user to choose the target AI tool before editing config, unless they already made that choice explicitly.
- Ask whether to initialize the current repository before writing `.project-brain/` or `AGENTS.md`.
- Check whether the selected tool is already installed before running initialization or editing config.
- Ensure the `project-brain` binary exists before writing MCP or tool configuration that depends on it.
- Resolve the executable path that matches the chosen installation method instead of assuming `project-brain` is on `PATH`.
- Always prefer `project-brain stdio` for Project Brain access.
- Do not edit `.project-brain/` files directly during installation except through the supported CLI initialization flow.
- Do not delete, recreate, or overwrite Project Brain files manually.
- Do not overwrite user-authored `AGENTS.md` content; update only the Project Brain managed section.
- Do not write a global prompt when repository-local `AGENTS.md` guidance can express the behavior safely.
- Preserve any existing OpenSpec workflow in the repository.
- Do not claim repository-local MCP support unless the selected AI tool actually supports repository-local MCP or tool configuration.

## Fallback

If the assistant cannot safely edit the target tool's config automatically:

- print the exact config snippet needed,
- explain where that snippet should be placed,
- clearly say that automatic installation is incomplete,
- and avoid making speculative edits.
