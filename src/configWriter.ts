import * as vscode from "vscode";
import * as fs from "fs";
import { validateConfig } from "./configSchema";
import {
  createGroupInConfig,
  MoveActionTarget,
  moveActionInConfig,
  removeActionInConfig,
} from "./configMutations";
import { SuggestedAction } from "./suggestedActionsProvider";
import { ProjectActionsConfig, Action } from "./types";
import { detectIde, getConfigPath, getConfigDir } from "./ideDetector";

export function createEmptyConfig(): ProjectActionsConfig {
  return { groups: [{ id: "general", label: "General", actions: [] }] };
}

function createConfigWithNoGroups(): ProjectActionsConfig {
  return { groups: [] };
}

interface WorkspaceConfigState {
  config: ProjectActionsConfig;
  configDir: string;
  configFilePath: string;
}

function readWorkspaceConfig(options: { createIfMissing: boolean }): WorkspaceConfigState | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return null;
  }

  const root = folders[0].uri.fsPath;
  const ide = detectIde();
  const configDir = getConfigDir(root, ide);
  const configFilePath = getConfigPath(root, ide);

  if (!fs.existsSync(configFilePath)) {
    if (!options.createIfMissing) {
      vscode.window.showErrorMessage("Config file not found.");
      return null;
    }

    return {
      config: createConfigWithNoGroups(),
      configDir,
      configFilePath,
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    const result = validateConfig(raw);

    if (!result.valid) {
      vscode.window.showErrorMessage(result.error);
      return null;
    }

    return {
      config: result.config,
      configDir,
      configFilePath,
    };
  } catch {
    vscode.window.showErrorMessage(
      "Could not read project-actions.json. Fix the file and try again.",
    );
    return null;
  }
}

function writeWorkspaceConfig(state: WorkspaceConfigState, config: ProjectActionsConfig): void {
  if (!fs.existsSync(state.configDir)) {
    fs.mkdirSync(state.configDir, { recursive: true });
  }

  fs.writeFileSync(state.configFilePath, JSON.stringify(config, null, 2), "utf-8");
}

export async function createConfigFile(): Promise<boolean> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return false;
  }

  const root = folders[0].uri.fsPath;
  const ide = detectIde();
  const configDir = getConfigDir(root, ide);
  const configFilePath = getConfigPath(root, ide);

  if (fs.existsSync(configFilePath)) {
    vscode.window.showInformationMessage("Config file already exists.");
    return false;
  }

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = createEmptyConfig();
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf-8");
  vscode.window.showInformationMessage(`Created ${ide.configFile}`);
  return true;
}

export async function addSuggestionToConfig(
  suggestion: SuggestedAction,
  onRefresh: () => void,
): Promise<void> {
  const state = readWorkspaceConfig({ createIfMissing: true });
  if (!state) {
    return;
  }

  const config = state.config;

  const newAction: Action = {
    id: suggestion.id,
    label: suggestion.label,
    command: suggestion.command,
  };

  if (config.groups.length === 0) {
    config.groups.push({ id: "general", label: "General", actions: [newAction] });
  } else {
    const alreadyExists = config.groups.some((g) => g.actions.some((a) => a.id === newAction.id));
    if (alreadyExists) {
      vscode.window.showInformationMessage(`"${suggestion.label}" is already in Project Scripts.`);
      return;
    }
    config.groups[0].actions.push(newAction);
  }

  writeWorkspaceConfig(state, config);
  vscode.window.showInformationMessage(`"${suggestion.label}" added to Project Scripts.`);
  onRefresh();
}

export async function removeActionFromConfig(
  actionId: string,
  onRefresh: () => void,
): Promise<void> {
  const state = readWorkspaceConfig({ createIfMissing: false });
  if (!state) {
    return;
  }

  const result = removeActionInConfig(state.config, actionId);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.error);
    return;
  }

  writeWorkspaceConfig(state, result.config);
  vscode.window.showInformationMessage(`"${result.action.label}" removed from Project Scripts.`);
  onRefresh();
}

export async function createGroupInWorkspaceConfig(
  label: string,
  onRefresh: () => void,
): Promise<void> {
  const state = readWorkspaceConfig({ createIfMissing: true });
  if (!state) {
    return;
  }

  const result = createGroupInConfig(state.config, label);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.error);
    return;
  }

  writeWorkspaceConfig(state, result.config);
  vscode.window.showInformationMessage(`Category "${result.group.label}" created.`);
  onRefresh();
}

export async function moveActionInWorkspaceConfig(
  actionId: string,
  target: MoveActionTarget,
  onRefresh: () => void,
): Promise<void> {
  const state = readWorkspaceConfig({ createIfMissing: false });
  if (!state) {
    return;
  }

  const result = moveActionInConfig(state.config, actionId, target);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.error);
    return;
  }

  if (!result.changed) {
    return;
  }

  writeWorkspaceConfig(state, result.config);
  onRefresh();
}
