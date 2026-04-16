# AGENTS

## Purpose

VS Code extension that runs curated project actions and auto-detects scripts from common project files.

## Stack

- TypeScript
- VS Code Extension API
- Bun for build scripts
- Mocha for tests

## Important Paths

- `src/`: source code
- `src/detectors/`: script detectors for supported file types
- `src/test/suite/`: test files
- `resources/project-actions.schema.json`: config schema
- `out/`: compiled output, generated

## Working Rules

- Make changes in `src/`, not `out/`
- Keep changes small and aligned with existing patterns
- Preserve VS Code extension behavior and command IDs unless the task requires changes
- Update tests when behavior changes

## Common Commands

- `bun run compile`: compile TypeScript to `out/`
- `bun run test`: run test suite
- `bun run bundle`: bundle extension entrypoint
- `bun run vscode:prepublish`: bundle and compile

## Key Behaviors

- Curated actions come from `.vscode/project-actions.json`
- JSON schema also supports `.cursor/project-actions.json`
- Suggested actions are detected from `package.json`, `composer.json`, and Makefiles
- Destructive commands should keep confirmation behavior
- Untrusted workspaces are not supported
