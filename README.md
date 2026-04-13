# Project Actions v0.2.0

Run your project scripts from a clean VS Code sidebar — no more hunting through `package.json` or remembering terminal commands.

![Project Actions sidebar showing curated actions and suggested scripts](https://raw.githubusercontent.com/your-publisher-id/project-actions/main/resources/screenshot.png)

## Features

### ▶ Project Actions Panel
A curated list of one-click buttons defined in `.vscode/project-actions.json`. Organise your most-used commands into named groups and run them instantly from the sidebar.

**Create Config**: Click the **Create Config** button to generate a starter config file.

### 🔍 Suggested Actions Panel
Automatically detects scripts from your project's `package.json`, `composer.json`, and `Makefile` / `makefile` / `GNUmakefile`. Run any detected script with a single click, or promote it to your curated list with the **Add** button.

When a `Makefile` declares `.PHONY` targets, only those are surfaced (intentional commands). Without `.PHONY`, all top-level targets are listed.

**Grouped by Source**: Suggestions are organized into collapsible sections by source file.

### 🚀 Quick Access (v0.2)
Run your actions from anywhere in VS Code:

- **Status Bar**: Click the play icon (Actions) in the bottom-right corner
- **Editor Title Bar**: Click the play icon in any open editor's title bar
- **Explorer Context**: Right-click a folder and select **Run Action...**
- **Command Palette**: Search for "Project Actions: Run Action..."

All surfaces open the same action picker with all your curated actions.

### 🔒 Safety First
Commands matching destructive patterns (e.g. `rm -rf`, `git reset --hard`, `DROP TABLE`) trigger a confirmation prompt before execution.

### ♻️ Terminal Reuse
All commands run in a single named **Project Actions** terminal — no terminal clutter.

### 📋 JSON Schema Support
Config files get intelligent autocomplete and validation via JSON Schema — no more guessing required fields.

---

## Getting Started

1. Open a workspace in VS Code
2. Click the **Project Actions** icon in the Activity Bar (▶)
3. If you have `package.json` or `composer.json`, your scripts appear automatically in **Suggested Actions**
4. Click **Add** (＋) next to any suggestion to add it to your curated list

---

## Configuration

Create `.vscode/project-actions.json` in your workspace root (or let the extension create it when you add a suggestion):

```json
{
  "groups": [
    {
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
|---|---|---|---|
| `groups` | array | ✅ | Top-level list of action groups |
| `groups[].label` | string | ✅ | Display name for the group |
| `groups[].actions` | array | ✅ | List of actions in the group |
| `actions[].id` | string | ✅ | Unique identifier (used for deduplication) |
| `actions[].label` | string | ✅ | Button label shown in the sidebar |
| `actions[].command` | string | ✅ | Shell command to run in the terminal |

---

## Commands

| Command | Description |
|---|---|
| `Project Actions: Refresh` | Reload the sidebar from the config file |
| `Project Actions: Run Action...` | Open the action picker from anywhere |
| `Project Actions: Create Config File` | Create a starter `.vscode/project-actions.json` |

---

## Requirements

- VS Code **1.85.0** or later
- Workspace Trust must be granted (the extension requires it to run terminal commands safely)

---

## Extension Settings

This extension does not contribute any VS Code settings. All configuration is done via `.vscode/project-actions.json`.

---

## Known Issues

- Detectors for Taskfile, shell scripts, and other formats are planned for future versions.

---

## Contributing

Issues and pull requests are welcome at [github.com/your-publisher-id/project-actions](https://github.com/your-publisher-id/project-actions).

---

## License

MIT
