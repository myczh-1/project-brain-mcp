# Install Project Brain With Your AI Assistant

Use your coding assistant as the installer.

Give it this repository, point it at this file, and let it handle the environment-specific setup.

## What The Assistant Should Do

1. Ask the user which AI tool to configure.
   - Ask the user to explicitly choose the target tool, for example Codex, Claude, or OpenCode.
   - Do not guess the target tool if the user has not named it.

2. Confirm the installation scope before editing config.
   - Ask the user whether they want project-level installation or global installation.
   - Do not choose global or project-level config silently unless the user has already said which one they want.
   - Treat this as the user's preferred scope, then apply the closest supported configuration model for the selected AI tool.

3. Inspect the current repository and target config.
   - Inspect repository state:
     - Confirm the repository root.
     - Check whether `.project-brain/` already exists.
     - Check whether `protocol/` exists.
     - Check whether OpenSpec is present.
   - Inspect tool configuration state:
   - Check the selected AI tool config for an existing `project-brain stdio` entry.
   - Check whether the selected AI tool config already includes the Project Brain prompt/instructions.

4. Determine whether installation is already complete.
   - If the selected tool config already points to `project-brain stdio` and already contains the Project Brain prompt/instructions, do not reinstall.
   - In that case, report that Project Brain is already installed for the selected tool and scope, then run verification only.

5. Ensure Project Brain is installed.
   - Before configuring MCP or prompt settings, ensure the `project-brain` binary is available.
   - If `project-brain` is already executable, reuse it.
   - If the binary is missing and the user chose project-level installation, prefer a project-local install, for example:

   ```bash
   npm install --save-dev @myczh/project-brain
   ```

   - If the binary is missing and the user explicitly chose global installation, install it globally, for example:

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
   - If the selected AI tool supports project-level MCP or tool configuration and the user chose project-level installation, edit the project-local config.
   - If the selected AI tool does not support project-level MCP or tool configuration, tell the user that limitation explicitly and use the closest supported scope instead.
   - If the user chose global installation, edit the global config.
   - Do not treat Project Brain as installed until this config has been updated successfully.

8. Initialize Project Brain if needed.
   - After stdio has been configured, check whether `.project-brain/manifest.json` is missing.
   - If initialization is needed, initialize Project Brain for this repository without overwriting existing memory.
   - If your environment cannot perform that initialization through the configured Project Brain tool path yet, you may temporarily bootstrap with:

   ```bash
   npx -y @myczh/project-brain setup
   ```

   - Do not treat that `npx` command as installation.
   - Treat this step as repository bootstrap only. Initialization alone does not complete installation.

9. Add or update the prompt/instructions.
   - Add the required Project Brain prompt to the same target tool configuration:

   ```text
   Use Project Brain through the `project-brain stdio` tools for this repository.
   Do not edit `.project-brain/` files directly.
   ```

   - You may also add optional guidance such as:

   ```text
   Use Project Brain whenever you need repository memory, prior decisions, active changes, or execution context.
   If a needed operation is not available through the stdio tools, report the gap instead of modifying `.project-brain` manually.
   Prefer module-scoped retrieval before broad historical search.
   ```

   - If the selected AI tool supports project-level instructions and the user chose project-level installation, place the prompt in project-local config.
   - If the selected AI tool does not support project-level MCP but does support project-level instructions, use project-level instructions together with the closest supported MCP scope.

10. Verify the installation.
   - Confirm the repository has a valid `.project-brain/` directory.
   - Confirm the target AI tool config points to the resolved Project Brain stdio command.
   - Confirm the prompt/instructions were added to the intended scope, or to the closest supported scope if the selected tool does not support the user's preferred scope directly.
   - Confirm a simple stdio request succeeds, for example:

```bash
printf '%s\n' '{"id":"smoke-1","message":{"type":"get_state","repo_path":"'"$(pwd)"'"}}' | project-brain stdio
```

   - If the configured command is a local binary path, validate that exact path instead of substituting `project-brain`.

11. Explain the changes made.
   - Show which files were updated.
   - State the user's requested scope and the scope actually used.
   - State which AI tool was configured.
   - Confirm which stdio command was configured.
   - Call out any tool limitation that prevented exact project-level or global alignment.
   - If installation was already present, say that no config changes were needed.
   - If any config file could not be edited automatically, say that installation is not complete yet.

## Important Rules

- Initialization is not the same as installation. Installation is complete only after the target AI tool config has been updated and verified.
- Ask the user to choose both the target AI tool and the installation scope before editing config, unless they already made those choices explicitly.
- Check whether the selected tool and scope are already installed before running initialization or editing config.
- Ensure the `project-brain` binary exists before writing MCP or tool configuration that depends on it.
- Resolve the executable path that matches the chosen installation method instead of assuming `project-brain` is on `PATH`.
- Always prefer `project-brain stdio` for Project Brain access.
- Do not edit `.project-brain/` files directly during installation.
- Do not delete, recreate, or overwrite Project Brain files manually.
- Preserve any existing OpenSpec workflow in the repository.
- If the selected tool has multiple valid config locations, explain the options and follow the user's chosen scope when the tool supports it.
- Do not claim project-level MCP support unless the selected AI tool actually supports project-local MCP or tool configuration.

## Fallback

If the assistant cannot safely edit the target tool's config automatically:

- print the exact config snippet needed,
- explain where that snippet should be placed,
- clearly say that automatic installation is incomplete,
- and avoid making speculative edits.
