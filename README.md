<div align="center">
  <img src="resources/icon.png" width="96" alt="Project Scripts Runner icon" />
  <h1>Project Scripts Runner</h1>
  <p><strong>One sidebar. All your scripts. Auto-detected from 9+ languages.</strong></p>
  <br>
  <p>
    <a href="https://open-vsx.org/extension/renux918/renux-project-actions"><img src="https://img.shields.io/open-vsx/v/renux918/renux-project-actions?label=version&color=blue" alt="Version" /></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=renux918.renux-project-actions"><img src="https://img.shields.io/badge/marketplace-install-blue" alt="VS Code Marketplace" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /></a>
    <a href="#"><img src="https://img.shields.io/badge/VS%20Code-1.85%2B-blue" alt="VS Code 1.85+" /></a>
  </p>
</div>

---

## Screenshots

<!-- SCREENSHOT: sidebar-view-showing-curated-actions-and-suggested-scripts.png -->
<!-- SCREENSHOT: action-picker-quickpick-modal-with-search.png -->

---

## Features

<table>
  <tr>
    <td width="50%">
      <h3>Auto-Detect Scripts</h3>
      <p>Reads <code>package.json</code>, <code>Cargo.toml</code>, <code>Makefile</code>, <code>pyproject.toml</code>, <code>pom.xml</code>, <code>build.gradle</code>, <code>go.mod</code>, <code>composer.json</code>, <code>Rakefile</code> and surfaces their scripts automatically.</p>
    </td>
    <td width="50%">
      <h3>Live File Watching</h3>
      <p>Watches project files for changes. Suggested actions refresh instantly when you add scripts, rename targets, or create new project configs.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Multiple Access Points</h3>
      <p>Access your actions from the sidebar, command picker, status bar, editor title bar, or explorer context menu. Same picker, wherever you are.</p>
    </td>
    <td width="50%">
      <h3>Confirmation Before Execution</h3>
      <p>Every command shows a modal review dialog before running. High-risk commands (<code>rm -rf</code>, <code>DROP TABLE</code>, <code>sudo</code>, format commands) get an extra warning indicator.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Terminal Modes</h3>
      <p>Choose between a shared terminal (default, reuses one instance) or per-action fresh terminals. Long-running dev servers stay isolated.</p>
    </td>
    <td width="50%">
      <h3>JSON Schema Validation</h3>
      <p>Config files get autocomplete, inline validation, and hover documentation from the bundled JSON Schema in VS Code, Cursor, and VSCodium.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Drag &amp; Drop</h3>
      <p>Reorder actions and categories directly in the sidebar tree. Drag suggestions into curated groups to build your workflow.</p>
    </td>
    <td width="50%">
      <h3>Multi-IDE</h3>
      <p>Works identically in Visual Studio Code, Cursor, and VSCodium. Config file path and schema adapt automatically to each IDE.</p>
    </td>
  </tr>
</table>

---

## Quick Start

**1. Install** the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=renux918.renux-project-actions) or [Open VSX](https://open-vsx.org/extension/renux918/renux-project-actions).

**2. Open** a workspace that contains any supported project file. Scripts appear automatically in the **Suggested Actions** panel on the left.

**3. Curate** your workflow. Click **Add** next to any suggestion to pin it to your curated list, or run `Project Scripts: Run Action...` from the command palette to pick and run anything on the fly.

---

## Supported Detectors

The extension automatically identifies scripts from these project files:

| Language / Ecosystem | File(s)                                | Detected                                               |
| -------------------- | -------------------------------------- | ------------------------------------------------------ |
| **Node.js**          | `package.json`                         | npm, yarn, pnpm, and bun scripts (auto-detected)       |
| **PHP**              | `composer.json`                        | Composer scripts                                       |
| **Make**             | `Makefile`, `GNUmakefile`              | `.PHONY`-aware target listing, fallback to all targets |
| **Ruby**             | `Rakefile`                             | Rake tasks                                             |
| **Java / Kotlin**    | `pom.xml`, `build.gradle`, `build.gradle.kts` | Maven phases and profiles, Gradle tasks           |
| **Rust**             | `Cargo.toml`                           | Build, test, run, check, clippy, fmt, bins, examples   |
| **Go**               | `go.mod`                               | Build, test, run, mod tidy, vet, `cmd/` sub-packages   |
| **Python**           | `pyproject.toml`, `setup.py`, `setup.cfg` | Scripts, pytest, tox, nox, pip install               |

---

## Configuration

Create `.vscode/project-actions.json` in your workspace root:

```jsonc
{
  "groups": [
    {
      "id": "dev",
      "label": "Development",
      "actions": [
        {
          "id": "start-server",
          "label": "Start Dev Server",
          "command": "bun run dev",
          "terminalMode": "new"
        },
        {
          "id": "run-tests",
          "label": "Run Tests",
          "command": "bun test"
        }
      ]
    },
    {
      "id": "deploy",
      "label": "Deployment",
      "actions": [
        {
          "id": "build-image",
          "label": "Build Docker Image",
          "command": "docker build -t app .",
          "placements": ["sidebar", "statusBar"]
        }
      ]
    }
  ]
}
```

### Config Reference

| Field                    | Type   | Required | Description                                                                     |
| ------------------------ | ------ | -------- | ------------------------------------------------------------------------------- |
| `groups`                 | array  | Yes      | Top-level list of action groups. At least one group required.                    |
| `groups[].id`            | string | Yes      | Unique group identifier. Duplicates cause validation errors.                     |
| `groups[].label`         | string | Yes      | Display name shown in the sidebar tree.                                          |
| `groups[].actions`       | array  | Yes      | Actions belonging to this group.                                                 |
| `actions[].id`           | string | Yes      | Unique action identifier across all groups.                                      |
| `actions[].label`        | string | Yes      | Label shown on the button and in pickers.                                        |
| `actions[].command`      | string | Yes      | Shell command executed by the integrated terminal.                               |
| `actions[].placements`   | array  | No       | Where to show the action: `sidebar`, `statusBar`, `editorTitle`, `explorerContext`. Defaults to all. |
| `actions[].terminalMode` | string | No       | `"shared"` reuses the Project Scripts terminal. `"new"` opens a fresh one each run. |

---

## Where to Find Your Actions

| Location             | How to Access                                               |
| -------------------- | ----------------------------------------------------------- |
| Activity Bar         | Click the terminal icon in the left sidebar.                |
| Curated Actions      | Your pinned actions, organized in drag-and-drop groups.     |
| Suggested Actions    | Auto-detected scripts, grouped by source file.              |
| Editor Title Bar     | Terminal icon in the open editor's tab header.              |
| Explorer Context     | Right-click a folder, select **Run Action...**              |
| Status Bar           | Terminal icon in the bottom-right corner.                   |
| Command Palette      | `Ctrl+Shift+P` &rarr; **Project Scripts: Run Action...**    |

---

## Safety

Every command requires explicit confirmation before execution. A modal dialog shows the full command,
source file, and action label so you can review what will run before it hits the terminal.

Commands matching destructive patterns are flagged as **high-risk** and display an additional warning
in the confirmation dialog. High-risk patterns include `rm -rf`, `git reset --hard`, `git clean -f`,
`DROP TABLE`, `TRUNCATE`, `dd`, `sudo`, format commands (`format C:`, `mkfs`), PowerShell
`Remove-Item -Recurse -Force`, and curl/wget piping to shell.

---

## Commands

| Command                                   | Description                                             |
| ----------------------------------------- | ------------------------------------------------------- |
| `Project Scripts: Run Action...`          | Open the action picker to browse and run any action.    |
| `Project Scripts: Refresh`                | Reload the sidebar from the config file.                |
| `Project Scripts: Create Config File`     | Generate a starter `.vscode/project-actions.json`.      |
| `Project Scripts: Run in New Terminal`    | Run a selected action in a fresh terminal (context menu). |

---

## Requirements

- **VS Code** `1.85.0` or later (also compatible with Cursor and VSCodium)
- Workspace Trust enabled (required to execute terminal commands)

---

## Development

This project uses [Bun](https://bun.sh) as its runtime and build toolchain.

### Prerequisites

- Install [Bun](https://bun.sh/docs/installation) (v1.2.0 or later recommended)
- VS Code 1.85+ for testing the extension

### Setup

```bash
# Install dependencies
bun install

# Compile TypeScript
bun run compile

# Watch mode (recompile on changes)
bun run watch

# Run tests
bun run test

# Lint and format
bun run lint:fix
bun run format
```

### Project Structure

- `src/` — Extension source code
- `src/detectors/` — File-type-specific script detectors
- `src/test/suite/` — Test suite (Mocha)
- `resources/` — Icons and JSON schema

---

## License

[MIT](LICENSE)
