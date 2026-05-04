import * as vscode from "vscode";
import { openActionPicker } from "../actionPicker";
import { ActionPlacement } from "../types";

export function registerPickerCommands(_context: vscode.ExtensionContext): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand("projectActions.openActionPicker", (...args: unknown[]) => {
      const placement = args.find(
        (a): a is ActionPlacement =>
          typeof a === "string" &&
          ["sidebar", "statusBar", "editorTitle", "explorerContext"].includes(a),
      );
      openActionPicker(placement);
    }),
  ];
}
