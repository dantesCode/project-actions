# v1.0.0 Stability & Polish — Design

## Goal

Release 1.0.0 as a stability and polish release. No new user-facing features. Four bug fixes and documentation updates.

---

## Scope

| # | Item | Description |
|---|------|-------------|
| 1 | Suggestions auto-refresh | Suggested actions panel refreshes when `package.json`, `composer.json`, or Makefiles change |
| 2 | Duplicate ID validation on load | Config schema rejects configs with duplicate action IDs across groups |
| 3 | Makefile source label accuracy | Detector reports actual filename (`Makefile` vs `makefile` vs `GNUmakefile`) as source |
| 4 | Editor title picker registration | Missing `projectActions.openEditorTitlePicker` command declared in `package.json` |
| 5 | CHANGELOG.md | New file documenting 0.6.0 → 1.0.0 changes |
| 6 | Doc updates | README reflects auto-refresh behavior, notes duplicate ID validation |

---

## 1. Suggestions Auto-Refresh

### Problem
Changes to `package.json`, `composer.json`, or Makefiles do not trigger a refresh of the Suggested Actions panel. Users must manually run the refresh command or reopen the workspace to see new scripts.

### Solution
Add a `FileSystemWatcher` for all detected source files. On any change/create/delete event, call `refresh()` on `SuggestedActionsProvider`.

### Files
- **New:** `src/watchers/suggestedFilesWatcher.ts`
- **Modified:** `src/extension.ts`

### Implementation

#### `src/watchers/suggestedFilesWatcher.ts`
```typescript
import * as vscode from 'vscode';
import { SuggestedActionsProvider } from '../suggestedActionsProvider';

export function createSuggestedFilesWatcher(
  provider: SuggestedActionsProvider
): vscode.FileSystemWatcher {
  const patterns = [
    '**/package.json',
    '**/composer.json',
    '**/Makefile',
    '**/makefile',
    '**/GNUmakefile',
  ];

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern('{workspaceFolder,workspaceFolder/*}', '{package.json,composer.json,Makefile,makefile,GNUmakefile}')
  );

  watcher.onDidChange(() => provider.refresh());
  watcher.onDidCreate(() => provider.refresh());
  watcher.onDidDelete(() => provider.refresh());

  return watcher;
}
```

Note: `vscode.RelativePattern` can accept an array of glob patterns in modern VS Code API. If that overload is unavailable, create separate watchers per pattern or use a single glob like `**/{package.json,composer.json,Makefile,makefile,GNUmakefile}`.

#### `src/extension.ts` changes
- Import `createSuggestedFilesWatcher`
- In `activate()`, after `suggestedActionsProvider` is created, call `createSuggestedFilesWatcher(suggestedActionsProvider)` and store the returned watcher
- In `deactivate()`, call `.dispose()` on the watcher

---

## 2. Duplicate ID Validation on Load

### Problem
`configSchema.ts` validates individual actions and groups but does not check for duplicate action IDs across groups. A config with duplicate IDs loads successfully but causes ambiguous errors during mutations.

### Solution
Add a cross-group ID uniqueness check in `configSchema.ts` validation function.

### File
- **Modified:** `src/configSchema.ts`

### Implementation
In the `validateConfig` function (or equivalent), after parsing groups:
1. Collect all action IDs into a map of `id -> [groupName, ...]`
2. If any ID appears in more than one group, push a validation error
3. Error message: `"Duplicate action ID '{id}' found in groups: {group1}, {group2}"`

Add 2-3 test cases to `configSchema.test.ts` covering: no duplicates (pass), one duplicate (fail), multiple duplicates (fail).

---

## 3. Makefile Source Label Accuracy

### Problem
`makefileDetector.ts` always returns `source: 'Makefile'` regardless of the actual filename found.

### File
- **Modified:** `src/detectors/makefileDetector.ts`

### Implementation
In `findMakefiles()` (or equivalent), track which file each result came from. Return the actual filename as `source`:
```typescript
{
  name: target,
  source: path.basename(filePath), // 'Makefile', 'makefile', or 'GNUmakefile'
  command: `make ${target}`,
}
```

---

## 4. Editor Title Picker Registration

### Problem
`projectActions.openEditorTitlePicker` is registered in `src/commands/placementCommands.ts` but the `commands` contribution in `package.json` does not declare it.

### File
- **Modified:** `package.json`

### Implementation
Add to `contributes.commands`:
```json
{
  "command": "projectActions.openEditorTitlePicker",
  "title": "Project Scripts: Pick Action (Editor Title)"
}
```

---

## 5. CHANGELOG.md

### File
- **New:** `CHANGELOG.md`

### Content structure
```
# Changelog

## [1.0.0] — 2026-04-20

### Fixed
- Suggested actions now auto-refresh when package.json, composer.json, or Makefiles are modified
- Config schema now validates for duplicate action IDs across groups on load
- Makefile detector now reports the correct source filename (Makefile/makefile/GNUmakefile)
- Editor title picker command properly registered in VS Code

## [0.6.0] — (prior release)
[existing release notes if available]
```

---

## 6. Doc Updates

### File
- **Modified:** `README.md`

### Changes
- Add note that suggested actions auto-refresh on source file changes
- Add note about duplicate ID validation
- Ensure all feature descriptions are current

---

## Files Summary

| File | Change |
|------|--------|
| `src/watchers/suggestedFilesWatcher.ts` | New |
| `src/extension.ts` | Modify — register and dispose watcher |
| `src/configSchema.ts` | Modify — add duplicate ID validation |
| `src/detectors/makefileDetector.ts` | Modify — return actual filename as source |
| `package.json` | Modify — add editor title picker command |
| `CHANGELOG.md` | New |
| `README.md` | Modify — update descriptions |

---

## Testing

| Item | Tests to add |
|------|-------------|
| Duplicate ID validation | `configSchema.test.ts` — 2-3 new cases |
| Suggested files watcher | Manual verification; no unit test needed (integration with VS Code API) |

---

## Out of Scope

- Multi-root workspace support
- New detectors (Taskfile, shell scripts)
- Test coverage for statusBar/editorTitle/commands modules
