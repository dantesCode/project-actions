# Project Actions

Run your project scripts from a clean VS Code sidebar — no more hunting through `package.json` or remembering terminal commands.

![Project Actions sidebar showing curated actions and suggested scripts](https://raw.githubusercontent.com/your-publisher-id/project-actions/main/resources/screenshot.png)

## Features

### ▶ Project Actions Panel
A curated list of one-click buttons defined in `.vscode/project-actions.json`. Organise your most-used commands into named groups and run them instantly from the sidebar.

### 🔍 Suggested Actions Panel
Automatically detects scripts from your project's `package.json` and `composer.json`. Run any detected script with a single click, or promote it to your curated list with the **Add** button.

### 🔒 Safety First
Commands matching destructive patterns (e.g. `rm -rf`, `git reset --hard`, `DROP TABLE`) trigger a confirmation prompt before execution.

### ♻️ Terminal Reuse
All commands run in a single named **Project Actions** terminal — no terminal clutter.

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

---

## Requirements

- VS Code **1.85.0** or later
- Workspace Trust must be granted (the extension requires it to run terminal commands safely)

---

## Extension Settings

This extension does not contribute any VS Code settings. All configuration is done via `.vscode/project-actions.json`.

---

## Known Issues

- Only `package.json` and `composer.json` are auto-detected in v0.1. More detectors (Makefile, Taskfile, etc.) are planned.

---

## Contributing

Issues and pull requests are welcome at [github.com/your-publisher-id/project-actions](https://github.com/your-publisher-id/project-actions).

---

## License

MIT
