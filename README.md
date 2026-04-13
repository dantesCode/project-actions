# Project Actions

Execute project scripts from a sidebar panel. Define your own actions in a config file, and the extension automatically surfaces scripts from your project's tooling.

## Features

### Curated Actions
A user-defined list of commands stored in `.vscode/project-actions.json`. Actions are organized into named groups and can be executed with a single click from the sidebar.

**Create Config**: Click "Create Config File" in the sidebar to generate a starter config file.

### Detected Scripts
The extension automatically detects scripts from:
- `package.json` (npm scripts)
- `composer.json` (Composer scripts)
- `Makefile`, `makefile`, `GNUmakefile` (Make targets)

For Makefiles, if `.PHONY` is declared, only those targets are shown. Otherwise, all top-level targets are listed.

### Action Locations

Actions can be accessed from multiple locations in VS Code:

| Location | How to Access |
|----------|----------------|
| Activity Bar | Click the Project Actions icon in the left sidebar to open the sidebar panel |
| Sidebar - Project Actions | Curated actions organized in groups |
| Sidebar - Suggested Actions | Auto-detected scripts, grouped by source file |
| Editor Title Bar | Click the terminal icon in an open editor's tab |
| Explorer Context | Right-click a folder and select "Run Action..." |
| Command Palette | Run "Project Actions: Run Action..." |
| Status Bar | Click the terminal icon in the bottom-right corner |

All locations open the same action picker with your curated actions.

### Safety
Commands matching destructive patterns (e.g., `rm -rf`, `git reset --hard`, `DROP TABLE`) display a confirmation prompt before execution.

### Terminal Reuse
All commands run in a single named terminal ("Project Actions"). The terminal is reused across executions.

### JSON Schema
Config files are validated and support autocomplete via JSON Schema.

---

## Getting Started

1. Open a workspace in VS Code
2. Click the Project Actions icon in the Activity Bar
3. If the workspace contains `package.json`, `composer.json`, or a Makefile, scripts appear in "Suggested Actions"
4. Click "Add" next to any suggestion to add it to your curated list, or click "Create Config File" to create an empty config

---

## Configuration

Create `.vscode/project-actions.json` in your workspace root:

```json
{
  "groups": [
    {
      "id": "dev",
      "label": "Development",
      "actions": [
        {
          "id": "dev-server",
          "label": "Start Dev Server",
          "command": "npm run dev"
        },
        {
          "id": "run-tests",
          "label": "Run Tests",
          "command": "npm test"
        }
      ]
    },
    {
      "id": "db",
      "label": "Database",
      "actions": [
        {
          "id": "db-migrate",
          "label": "Run Migrations",
          "command": "php artisan migrate"
        }
      ]
    }
  ]
}
```

### Config Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groups` | array | Yes | Top-level list of action groups |
| `groups[].id` | string | Yes | Unique group identifier |
| `groups[].label` | string | Yes | Display name for the group |
| `groups[].actions` | array | Yes | List of actions in the group |
| `actions[].id` | string | Yes | Unique action identifier |
| `actions[].label` | string | Yes | Button label shown in the sidebar |
| `actions[].command` | string | Yes | Shell command to execute |
| `actions[].icon` | string | No | VS Code icon ID |
| `actions[].placements` | array | No | Where to display the action (sidebar, statusBar, editorTitle, explorerContext) |

---

## Commands

| Command | Description |
|---------|-------------|
| `Project Actions: Refresh` | Reload the sidebar from the config file |
| `Project Actions: Run Action...` | Open the action picker |
| `Project Actions: Create Config File` | Create a starter `.vscode/project-actions.json` |

---

## Requirements

- VS Code **1.85.0** or later
- Workspace Trust must be granted (the extension requires it to run terminal commands)

---

## Extension Settings

This extension does not contribute any VS Code settings. All configuration is done via `.vscode/project-actions.json`.

---

## Limitations

- Detectors for Taskfile, shell scripts, and other formats are not yet implemented

---

## License

MIT