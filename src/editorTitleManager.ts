import * as vscode from "vscode";
import { loadConfigAsync } from "./configLoader";
import { openActionPicker } from "./actionPicker";
import { hasPlacement } from "./placement";
import { Action } from "./types";

export class EditorTitleManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private hasActions = false;

  async refresh(): Promise<void> {
    const result = await loadConfigAsync();
    const hasActions =
      result.valid &&
      result.config.groups.length > 0 &&
      this.getActionsWithPlacement(result.config.groups.flatMap((g) => g.actions)).length > 0;

    this.hasActions = hasActions;
    vscode.commands.executeCommand(
      "setContext",
      "projectActions.hasEditorTitleActions",
      hasActions,
    );
  }

  private getActionsWithPlacement(actions: Action[]): Action[] {
    return actions.filter((action) => hasPlacement(action, "editorTitle"));
  }

  async openPicker(): Promise<void> {
    await openActionPicker("editorTitle");
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
