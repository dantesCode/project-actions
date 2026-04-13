import * as vscode from 'vscode';
import { detectPackageJsonScripts } from './detectors/packageJsonDetector';
import { detectComposerJsonScripts } from './detectors/composerJsonDetector';
import { detectMakefileTargets } from './detectors/makefileDetector';

export interface SuggestedAction {
  id: string;
  label: string;
  command: string;
  source: string;
}

export function groupSuggestionsBySource(suggestions: SuggestedAction[]): SuggestedTreeItem[] {
  if (suggestions.length === 0) {
    const item = new SuggestedTreeItem({
      id: 'empty',
      label: 'No suggestions found',
      command: '',
      source: '',
    });
    return [item];
  }

  // Group by source
  const bySource = new Map<string, SuggestedAction[]>();
  for (const s of suggestions) {
    const existing = bySource.get(s.source) || [];
    existing.push(s);
    bySource.set(s.source, existing);
  }

  // Sort sources alphabetically
  const sortedSources = Array.from(bySource.keys()).sort();

  const result: SuggestedTreeItem[] = [];
  for (const source of sortedSources) {
    // Add group header
    const header = new SuggestedTreeItem({
      id: `header-${source}`,
      label: source,
      command: '',
      source: source,
    });
    header.contextValue = 'group';
    result.push(header);

    // Add items in this group
    const items = bySource.get(source)!;
    for (const s of items) {
      result.push(new SuggestedTreeItem(s));
    }
  }

  return result;
}

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
      ...detectMakefileTargets(root),
    ];

    return groupSuggestionsBySource(suggestions);
  }
}

export class SuggestedTreeItem extends vscode.TreeItem {
  constructor(public readonly suggestion: SuggestedAction) {
    super(suggestion.label);
    // Group headers have contextValue set directly after construction
    if (suggestion.command) {
      this.description = suggestion.command;
      this.tooltip = `${suggestion.source}: ${suggestion.command}`;
      this.contextValue = 'suggestion';
      this.iconPath = new vscode.ThemeIcon('lightbulb');
    }
  }
}
