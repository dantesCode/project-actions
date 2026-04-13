import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SuggestedAction } from './suggestedActionsProvider';
import { ProjectActionsConfig, Action } from './types';
import { CONFIG_PATH } from './configLoader';

export async function addSuggestionToConfig(
  suggestion: SuggestedAction,
  onRefresh: () => void
): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const root = folders[0].uri.fsPath;
  const configFilePath = path.join(root, CONFIG_PATH);

  let config: ProjectActionsConfig;

  if (fs.existsSync(configFilePath)) {
    try {
      config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
    } catch {
      vscode.window.showErrorMessage(
        'Could not read project-actions.json. Fix the file and try again.'
      );
      return;
    }
  } else {
    // Create a starter config
    config = { groups: [{ id: 'general', label: 'General', actions: [] }] };
  }

  const newAction: Action = {
    id: suggestion.id,
    label: suggestion.label,
    command: suggestion.command,
  };

  if (config.groups.length === 0) {
    config.groups.push({ id: 'general', label: 'General', actions: [newAction] });
  } else {
    const alreadyExists = config.groups.some(g =>
      g.actions.some(a => a.id === newAction.id)
    );
    if (alreadyExists) {
      vscode.window.showInformationMessage(
        `"${suggestion.label}" is already in Project Actions.`
      );
      return;
    }
    config.groups[0].actions.push(newAction);
  }

  // Ensure .vscode directory exists
  const vscodePath = path.join(root, '.vscode');
  if (!fs.existsSync(vscodePath)) {
    fs.mkdirSync(vscodePath, { recursive: true });
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  vscode.window.showInformationMessage(`"${suggestion.label}" added to Project Actions.`);
  onRefresh();
}
