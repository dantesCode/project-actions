import * as vscode from "vscode";
import { loadConfigAsync } from "./configLoader";
import { runInTerminal } from "./terminalRunner";
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
    const result = await loadConfigAsync();
    if (!result.valid || result.config.groups.length === 0) {
      vscode.window.showInformationMessage("No actions defined.");
      return;
    }

    const actions = this.getActionsWithPlacement(result.config.groups.flatMap((g) => g.actions));
    if (actions.length === 0) {
      vscode.window.showInformationMessage("No actions with editor title placement defined.");
      return;
    }

    const items = actions.map((action) => ({
      label: action.label,
      description: action.command,
      action,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select an action to run...",
      matchOnDescription: true,
    });

    if (selected) {
      runInTerminal(selected.action.command, {
        label: selected.action.label,
        source: "editorTitle",
        terminalMode: selected.action.terminalMode,
      });
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
