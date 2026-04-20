import * as vscode from "vscode";
import { loadConfigAsync } from "./configLoader";
import { detectIde } from "./ideDetector";
import { Action, TerminalMode } from "./types";
import { hasPlacement } from "./placement";

export class ProjectActionsProvider implements vscode.TreeDataProvider<ActionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ActionTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ActionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ActionTreeItem): Promise<ActionTreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    if (element.contextValue === "group") {
      return element.children ?? [];
    }
    return [];
  }

  private async getRootItems(): Promise<ActionTreeItem[]> {
    const result = await loadConfigAsync();

    if (!result.valid) {
      if (result.error === "NO_CONFIG") {
        const item = new ActionTreeItem("Create Config File", "createConfig");
        item.command = {
          command: "projectActions.createConfig",
          title: "Create Config",
        };
        item.iconPath = new vscode.ThemeIcon("add");
        return [item];
      }
      if (result.error === "No workspace folder is open.") {
        const item = new ActionTreeItem("Open a workspace folder to get started", "info");
        item.iconPath = new vscode.ThemeIcon("info");
        return [item];
      }
      const item = new ActionTreeItem(`Error loading config: ${result.error}`, "error");
      item.iconPath = new vscode.ThemeIcon("error");
      return [item];
    }

    if (result.config.groups.length === 0) {
      const item = new ActionTreeItem("No actions defined yet", "info");
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    const ide = detectIde();
    return result.config.groups.map((group) => {
      const groupItem = new ActionTreeItem(group.label, "group");
      groupItem.groupId = group.id;
      groupItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      groupItem.iconPath = new vscode.ThemeIcon("folder");
      groupItem.children = group.actions
        .filter((action) => hasPlacement(action, "sidebar"))
        .map((action) => {
          const item = new ActionTreeItem(action.label, "curatedAction");
          item.actionId = action.id;
          item.groupId = group.id;
          item.actionCommand = action.command;
          item.actionSource = `${ide.configFile} (${group.label})`;
          item.actionTerminalMode = action.terminalMode;
          item.description = action.command;
          item.tooltip = action.command;
          item.iconPath = new vscode.ThemeIcon(action.icon ?? "terminal");
          return item;
        });
      return groupItem;
    });
  }
}

export class ActionTreeItem extends vscode.TreeItem {
  children?: ActionTreeItem[];
  actionId?: string;
  actionCommand?: string;
  actionSource?: string;
  actionTerminalMode?: TerminalMode;
  groupId?: string;

  constructor(
    label: string,
    public contextValue: string,
  ) {
    super(label);
  }
}
