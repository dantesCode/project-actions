import * as vscode from "vscode";

export interface PlacementManagers {
  statusBar: { openPicker(): void };
}

export function registerPlacementCommands(
  context: vscode.ExtensionContext,
  managers: PlacementManagers,
): vscode.Disposable[] {
  const { statusBar } = managers;

  return [
    vscode.commands.registerCommand("projectActions.openStatusBarPicker", () => {
      statusBar.openPicker();
    }),
  ];
}
