import * as vscode from 'vscode';
import { ProjectActionsProvider, ActionTreeItem } from './projectActionsProvider';
import { SuggestedActionsProvider } from './suggestedActionsProvider';
import { runInTerminal } from './terminalRunner';
import { addSuggestionToConfig, createConfigFile, removeActionFromConfig } from './configWriter';
import { openActionPicker } from './actionPicker';
import { SuggestedTreeItem } from './suggestedActionsProvider';
import { detectIde } from './ideDetector';

function getItemLabel(label: string | vscode.TreeItemLabel | undefined): string | undefined {
  return typeof label === 'string' ? label : label?.label;
}

export function activate(context: vscode.ExtensionContext) {
  const projectActionsProvider = new ProjectActionsProvider();
  const suggestedProvider = new SuggestedActionsProvider();

  vscode.window.registerTreeDataProvider('projectActionsView', projectActionsProvider);
  vscode.window.registerTreeDataProvider('suggestedActionsView', suggestedProvider);

  const ide = detectIde();
  const watcher = vscode.workspace.createFileSystemWatcher(`**/${ide.configFile}`);
  watcher.onDidChange(() => projectActionsProvider.refresh());
  watcher.onDidCreate(() => projectActionsProvider.refresh());
  watcher.onDidDelete(() => projectActionsProvider.refresh());
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.commands.registerCommand('projectActions.runAction', (command: string) => {
      runInTerminal(command);
    }),
    vscode.commands.registerCommand('projectActions.runCuratedAction', (item: ActionTreeItem) => {
      if (item.actionCommand) {
        runInTerminal(item.actionCommand, {
          label: getItemLabel(item.label),
          source: item.actionSource,
        });
      }
    }),
    vscode.commands.registerCommand('projectActions.refresh', () => {
      projectActionsProvider.refresh();
    }),
    vscode.commands.registerCommand('projectActions.runSuggestion', (item: SuggestedTreeItem) => {
      runInTerminal(item.suggestion.command, {
        label: item.suggestion.label,
        source: item.suggestion.source,
      });
    }),
    vscode.commands.registerCommand('projectActions.addSuggestion', (item: SuggestedTreeItem) => {
      addSuggestionToConfig(item.suggestion, () => {
        projectActionsProvider.refresh();
        suggestedProvider.refresh();
      });
    }),
    vscode.commands.registerCommand('projectActions.removeAction', (item: ActionTreeItem) => {
      if (item.actionId) {
        removeActionFromConfig(item.actionId, () => {
          projectActionsProvider.refresh();
        });
      }
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
