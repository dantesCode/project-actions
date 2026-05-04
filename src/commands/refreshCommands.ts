import * as vscode from "vscode";
import { ProjectActionsProvider } from "../projectActionsProvider";

export interface RefreshTargets {
  projectActions: ProjectActionsProvider;
  suggested: { refresh(): void };
  statusBar: { refresh(): void };
  editorTitle: { refresh(): void };
}

export function registerRefreshCommands(
  context: vscode.ExtensionContext,
  refreshTargets: RefreshTargets,
): vscode.Disposable[] {
  const { projectActions, suggested, statusBar, editorTitle } = refreshTargets;

  return [
    vscode.commands.registerCommand("projectActions.refresh", () => {
      projectActions.refresh();
      suggested.refresh();
      statusBar.refresh();
      editorTitle.refresh();
    }),
  ];
}
