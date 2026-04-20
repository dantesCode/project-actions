import * as vscode from "vscode";
import { loadConfig } from "./configLoader";
import { runInTerminal } from "./terminalRunner";
import { hasPlacement } from "./placement";
import { Action } from "./types";

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "projectActions.openStatusBarPicker";
    this.statusBarItem.tooltip = "Project Scripts";
    this.disposables.push(this.statusBarItem);
  }

  refresh(): void {
    const result = loadConfig();
    if (!result.valid || result.config.groups.length === 0) {
      this.statusBarItem.hide();
      return;
    }

    const actions = this.getActionsWithPlacement(result.config.groups.flatMap((g) => g.actions));
    if (actions.length === 0) {
      this.statusBarItem.hide();
      return;
    }

    this.statusBarItem.text = "$(terminal) Actions";
    this.statusBarItem.show();
  }

  private getActionsWithPlacement(actions: Action[]): Action[] {
    return actions.filter((action) => hasPlacement(action, "statusBar"));
  }

  async openPicker(): Promise<void> {
    const result = loadConfig();
    if (!result.valid || result.config.groups.length === 0) {
      vscode.window.showInformationMessage("No actions defined.");
      return;
    }

    const actions = this.getActionsWithPlacement(result.config.groups.flatMap((g) => g.actions));
    if (actions.length === 0) {
      vscode.window.showInformationMessage("No actions with status bar placement defined.");
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
        source: "statusBar",
        terminalMode: selected.action.terminalMode,
      });
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
