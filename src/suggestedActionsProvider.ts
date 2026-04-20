import * as vscode from "vscode";
import { detectPackageJsonScripts } from "./detectors/packageJsonDetector";
import { detectComposerJsonScripts } from "./detectors/composerJsonDetector";
import { detectMakefileTargets } from "./detectors/makefileDetector";
import { SuggestedAction } from "./types";

export function groupSuggestionsBySource(suggestions: SuggestedAction[]): SuggestedTreeItem[] {
  if (suggestions.length === 0) {
    const item = new SuggestedTreeItem({
      id: "empty",
      label: "No scripts detected",
      command: "",
      source: "",
    });
    return [item];
  }

  const bySource = new Map<string, SuggestedAction[]>();
  for (const s of suggestions) {
    const existing = bySource.get(s.source) || [];
    existing.push(s);
    bySource.set(s.source, existing);
  }

  const sortedSources = Array.from(bySource.keys()).sort();

  const result: SuggestedTreeItem[] = [];
  for (const source of sortedSources) {
    const headerItem = new SuggestedTreeItem({
      id: `header-${source}`,
      label: source,
      command: "",
      source: source,
    });
    headerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    headerItem.contextValue = "sourceGroup";
    headerItem.iconPath = new vscode.ThemeIcon("symbol-property");

    const children = bySource.get(source)!.map((s) => new SuggestedTreeItem(s));
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

  getChildren(element?: SuggestedTreeItem): SuggestedTreeItem[] {
    if (element) {
      return element.children ?? [];
    }

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

    if (suggestion.id.startsWith("header-")) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else if (suggestion.command) {
      this.description = suggestion.command;
      this.tooltip = `${suggestion.source}: ${suggestion.command}`;
      this.contextValue = "suggestion";
      this.iconPath = new vscode.ThemeIcon("script");
    }
  }
}
