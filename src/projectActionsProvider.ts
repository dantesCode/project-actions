import * as vscode from 'vscode';
import { loadConfig } from './configLoader';

export class ProjectActionsProvider implements vscode.TreeDataProvider<ActionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ActionTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ActionTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ActionTreeItem): ActionTreeItem[] {
    if (!element) {
      return this.getRootItems();
    }
    if (element.contextValue === 'group') {
      return element.children ?? [];
    }
    return [];
  }

  private getRootItems(): ActionTreeItem[] {
    const result = loadConfig();

    if (!result.valid) {
      if (result.error === 'NO_CONFIG') {
        const item = new ActionTreeItem(
          'No config found — add .vscode/project-actions.json',
          'info'
        );
        item.iconPath = new vscode.ThemeIcon('info');
        return [item];
      }
      if (result.error === 'No workspace folder is open.') {
        const item = new ActionTreeItem('Open a workspace folder to get started', 'info');
        item.iconPath = new vscode.ThemeIcon('info');
        return [item];
      }
      const item = new ActionTreeItem(`Error loading config: ${result.error}`, 'error');
      item.iconPath = new vscode.ThemeIcon('error');
      return [item];
    }

    if (result.config.groups.length === 0) {
      const item = new ActionTreeItem('No actions defined yet', 'info');
      item.iconPath = new vscode.ThemeIcon('info');
      return [item];
    }

    return result.config.groups.map(group => {
      const groupItem = new ActionTreeItem(group.label, 'group');
      groupItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      groupItem.iconPath = new vscode.ThemeIcon('folder');
      groupItem.children = group.actions.map(action => {
        const item = new ActionTreeItem(action.label, 'action');
        item.command = {
          command: 'projectActions.runAction',
          title: 'Run',
          arguments: [action.command],
        };
        item.description = action.command;
        item.iconPath = new vscode.ThemeIcon(action.icon ?? 'play');
        item.tooltip = action.command;
        return item;
      });
      return groupItem;
    });
  }
}

export class ActionTreeItem extends vscode.TreeItem {
  children?: ActionTreeItem[];

  constructor(label: string, public contextValue: string) {
    super(label);
  }
}
