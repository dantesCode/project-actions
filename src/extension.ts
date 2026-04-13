import * as vscode from 'vscode';
import { ProjectActionsProvider } from './projectActionsProvider';
import { SuggestedActionsProvider } from './suggestedActionsProvider';
import { runInTerminal } from './terminalRunner';
import { addSuggestionToConfig, createConfigFile } from './configWriter';
import { openActionPicker } from './actionPicker';
import { SuggestedTreeItem } from './suggestedActionsProvider';

export function activate(context: vscode.ExtensionContext) {
  const projectActionsProvider = new ProjectActionsProvider();
  const suggestedProvider = new SuggestedActionsProvider();

  vscode.window.registerTreeDataProvider('projectActionsView', projectActionsProvider);
  vscode.window.registerTreeDataProvider('suggestedActionsView', suggestedProvider);

  // Watch config file for changes and auto-refresh
  const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/project-actions.json');
  watcher.onDidChange(() => projectActionsProvider.refresh());
  watcher.onDidCreate(() => projectActionsProvider.refresh());
  watcher.onDidDelete(() => projectActionsProvider.refresh());
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.commands.registerCommand('projectActions.runAction', (command: string) => {
      runInTerminal(command);
    }),
    vscode.commands.registerCommand('projectActions.refresh', () => {
      projectActionsProvider.refresh();
    }),
    vscode.commands.registerCommand('projectActions.runSuggestion', (item: SuggestedTreeItem) => {
      runInTerminal(item.suggestion.command);
    }),
    vscode.commands.registerCommand('projectActions.addSuggestion', (item: SuggestedTreeItem) => {
      addSuggestionToConfig(item.suggestion, () => {
        projectActionsProvider.refresh();
        suggestedProvider.refresh();
      });
    }),
    vscode.commands.registerCommand('projectActions.createConfig', async () => {
      const created = await createConfigFile();
      if (created) {
        projectActionsProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('projectActions.openActionPicker', () => {
      openActionPicker();
    })
  );
}

export function deactivate() {}
