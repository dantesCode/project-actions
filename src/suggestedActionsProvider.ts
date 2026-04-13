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

/**
 * Groups suggestions by source file and returns proper tree hierarchy.
 * Source groups are returned as parent items with children.
 */
export function groupSuggestionsBySource(suggestions: SuggestedAction[]): SuggestedTreeItem[] {
  if (suggestions.length === 0) {
    const item = new SuggestedTreeItem({
      id: 'empty',
      label: 'No scripts detected',
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
    // Create parent item for this source
    const headerItem = new SuggestedTreeItem({
      id: `header-${source}`,
      label: source,
      command: '',
      source: source,
    });
    headerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    headerItem.contextValue = 'sourceGroup';
    headerItem.iconPath = new vscode.ThemeIcon('symbol-property');
    
    // Add children to the header
    const children = bySource.get(source)!.map(s => new SuggestedTreeItem(s));
    headerItem.children = children;
    
    result.push(headerItem);
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
  children?: SuggestedTreeItem[];

  constructor(public readonly suggestion: SuggestedAction) {
    super(suggestion.label);
    
    // Handle different item types based on contextValue
    if (suggestion.id.startsWith('header-')) {
      // Source group header - collapsible state set by groupSuggestionsBySource
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else if (suggestion.command) {
      // Regular suggestion item
      this.description = suggestion.command;
      this.tooltip = `${suggestion.source}: ${suggestion.command}`;
      this.contextValue = 'suggestion';
      this.iconPath = new vscode.ThemeIcon('script');
    }
  }
}
