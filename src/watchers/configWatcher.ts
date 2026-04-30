import * as vscode from "vscode";
import { detectIde } from "../ideDetector";

export interface RefreshTargets {
  projectActions: { refresh(): void };
  suggested: { refresh(): void };
  statusBar: { refresh(): void };
  editorTitle: { refresh(): void };
}

export function setupConfigFileWatcher(refreshTargets: RefreshTargets): vscode.Disposable {
  const ide = detectIde();
  const { projectActions, suggested, statusBar, editorTitle } = refreshTargets;

  const watcher = vscode.workspace.createFileSystemWatcher(`**/${ide.configFile}`);

  const refresh = () => {
    projectActions.refresh();
    suggested.refresh();
    statusBar.refresh();
    editorTitle.refresh();
  };

  watcher.onDidChange(refresh);
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);

  return watcher;
}
