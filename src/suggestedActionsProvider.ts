import * as vscode from 'vscode';
import { detectPackageJsonScripts, SuggestedAction } from './detectors/packageJsonDetector';
import { detectComposerJsonScripts } from './detectors/composerJsonDetector';

export class SuggestedActionsProvider implements vscode.TreeDataProvider<SuggestedTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SuggestedTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SuggestedTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): SuggestedTreeItem[] {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return [];
    }

    const root = folders[0].uri.fsPath;
    const suggestions: SuggestedAction[] = [
      ...detectPackageJsonScripts(root),
      ...detectComposerJsonScripts(root),
    ];

    if (suggestions.length === 0) {
      const item = new SuggestedTreeItem({
        id: 'empty',
        label: 'No suggestions found',
        command: '',
        source: '',
      });
      return [item];
    }

    return suggestions.map(s => new SuggestedTreeItem(s));
  }
}

export class SuggestedTreeItem extends vscode.TreeItem {
  constructor(public readonly suggestion: SuggestedAction) {
    super(suggestion.label);
    if (suggestion.command) {
      this.description = suggestion.command;
      this.tooltip = `${suggestion.source}: ${suggestion.command}`;
      this.contextValue = 'suggestion';
      this.iconPath = new vscode.ThemeIcon('lightbulb');
    } else {
      this.contextValue = 'info';
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}
