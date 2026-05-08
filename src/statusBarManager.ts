import * as vscode from "vscode";
import { loadConfigAsync } from "./configLoader";
import { openActionPicker } from "./actionPicker";
import { hasPlacement } from "./placement";
import { Action } from "./types";

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = "projectActions.openStatusBarPicker";
    this.statusBarItem.tooltip = "Project Scripts";
    this.disposables.push(this.statusBarItem);
  }

  async refresh(): Promise<void> {
    const result = await loadConfigAsync();
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
    await openActionPicker("statusBar");
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
