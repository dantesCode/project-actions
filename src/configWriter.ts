import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SuggestedAction } from './suggestedActionsProvider';
import { ProjectActionsConfig, Action } from './types';
import { detectIde, getConfigPath, getConfigDir } from './ideDetector';

export function createEmptyConfig(): ProjectActionsConfig {
  return { groups: [{ id: 'general', label: 'General', actions: [] }] };
}

export async function createConfigFile(): Promise<boolean> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return false;
  }

  const root = folders[0].uri.fsPath;
  const ide = detectIde();
  const configDir = getConfigDir(root, ide);
  const configFilePath = getConfigPath(root, ide);

  if (fs.existsSync(configFilePath)) {
    vscode.window.showInformationMessage('Config file already exists.');
    return false;
  }

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = createEmptyConfig();
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  vscode.window.showInformationMessage(`Created ${ide.configFile}`);
  return true;
}

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
  const ide = detectIde();
  const configDir = getConfigDir(root, ide);
  const configFilePath = getConfigPath(root, ide);

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
    config = createEmptyConfig();
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

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  vscode.window.showInformationMessage(`"${suggestion.label}" added to Project Actions.`);
  onRefresh();
}

export async function removeActionFromConfig(
  actionId: string,
  onRefresh: () => void
): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const root = folders[0].uri.fsPath;
  const ide = detectIde();
  const configFilePath = getConfigPath(root, ide);

  if (!fs.existsSync(configFilePath)) {
    vscode.window.showErrorMessage('Config file not found.');
    return;
  }

  let config: ProjectActionsConfig;

  try {
    config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  } catch {
    vscode.window.showErrorMessage(
      'Could not read project-actions.json. Fix the file and try again.'
    );
    return;
  }

  let removed = false;
  for (const group of config.groups) {
    const index = group.actions.findIndex(a => a.id === actionId);
    if (index !== -1) {
      const removedAction = group.actions[index];
      group.actions.splice(index, 1);
      removed = true;
      vscode.window.showInformationMessage(`"${removedAction.label}" removed from Project Actions.`);
      break;
    }
  }

  if (!removed) {
    vscode.window.showWarningMessage('Action not found in config.');
    return;
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  onRefresh();
}
