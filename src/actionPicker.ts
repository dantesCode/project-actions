import * as vscode from 'vscode';
import { loadConfig } from './configLoader';
import { runInTerminal } from './terminalRunner';

interface QuickPickAction extends vscode.QuickPickItem {
  command: string;
}

export async function openActionPicker(): Promise<void> {
  const result = loadConfig();

  if (!result.valid) {
    vscode.window.showErrorMessage(result.error);
    return;
  }

  if (result.config.groups.length === 0) {
    vscode.window.showInformationMessage('No actions defined. Add actions to .vscode/project-actions.json');
    return;
  }

  const items: QuickPickAction[] = [];
  
  for (const group of result.config.groups) {
    for (const action of group.actions) {
      items.push({
        label: action.label,
        description: action.command,
        detail: group.label,
        command: action.command,
      });
    }
  }

  if (items.length === 0) {
    vscode.window.showInformationMessage('No actions defined. Add actions to .vscode/project-actions.json');
    return;
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select an action to run...',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selected) {
    runInTerminal(selected.command);
  }
}