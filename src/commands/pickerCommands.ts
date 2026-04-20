import * as vscode from "vscode";
import { openActionPicker } from "../actionPicker";

export function registerPickerCommands(
  context: vscode.ExtensionContext,
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand("projectActions.openActionPicker", () => {
      openActionPicker();
    }),
  ];
}
