import * as vscode from "vscode";

export interface PlacementManagers {
  statusBar: { openPicker(): void };
  editorTitle: { openPicker(): void };
}

export function registerPlacementCommands(
  context: vscode.ExtensionContext,
  managers: PlacementManagers,
): vscode.Disposable[] {
  const { statusBar, editorTitle } = managers;

  return [
    vscode.commands.registerCommand("projectActions.openStatusBarPicker", () => {
      statusBar.openPicker();
    }),
    vscode.commands.registerCommand("projectActions.openEditorTitlePicker", () => {
      editorTitle.openPicker();
    }),
  ];
}
