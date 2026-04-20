import * as vscode from "vscode";
import { ProjectActionsProvider } from "../projectActionsProvider";

export interface RefreshTargets {
  projectActions: ProjectActionsProvider;
  statusBar: { refresh(): void };
  editorTitle: { refresh(): void };
}

export function registerRefreshCommands(
  context: vscode.ExtensionContext,
  refreshTargets: RefreshTargets,
): vscode.Disposable[] {
  const { projectActions, statusBar, editorTitle } = refreshTargets;

  return [
    vscode.commands.registerCommand("projectActions.refresh", () => {
      projectActions.refresh();
      statusBar.refresh();
      editorTitle.refresh();
    }),
  ];
}
