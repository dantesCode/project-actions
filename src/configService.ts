import * as vscode from "vscode";
import * as fs from "fs";
import { validateConfig } from "./configSchema";
import {
  createGroupInConfig,
  MoveActionTarget,
  moveActionInConfig,
  removeActionInConfig,
  removeGroupInConfig,
} from "./configMutations";
import { SuggestedAction, ProjectActionsConfig, Action } from "./types";
import { detectIde, getConfigPath, getConfigDir } from "./ideDetector";

export interface ConfigServiceResult {
  ok: boolean;
  message: string;
}

export interface WorkspaceConfigState {
  config: ProjectActionsConfig;
  configDir: string;
  configFilePath: string;
}

function createConfigWithNoGroups(): ProjectActionsConfig {
  return { groups: [] };
}

function resolveWorkspacePaths(): { configDir: string; configFilePath: string } | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }

  const root = folders[0].uri.fsPath;
  const ide = detectIde();
  return {
    configDir: getConfigDir(root, ide),
    configFilePath: getConfigPath(root, ide),
  };
}

export function readWorkspaceConfig(options: {
  createIfMissing: boolean;
}): WorkspaceConfigState | null {
  const paths = resolveWorkspacePaths();
  if (!paths) {
    return null;
  }

  if (!fs.existsSync(paths.configFilePath)) {
    if (!options.createIfMissing) {
      return null;
    }

    return {
      config: createConfigWithNoGroups(),
      configDir: paths.configDir,
      configFilePath: paths.configFilePath,
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(paths.configFilePath, "utf-8"));
    const result = validateConfig(raw);

    if (!result.valid) {
      return null;
    }

    return {
      config: result.config,
      configDir: paths.configDir,
      configFilePath: paths.configFilePath,
    };
  } catch {
    return null;
  }
}

export function writeWorkspaceConfig(state: WorkspaceConfigState, config: ProjectActionsConfig): void {
  if (!fs.existsSync(state.configDir)) {
    fs.mkdirSync(state.configDir, { recursive: true });
  }

  fs.writeFileSync(state.configFilePath, JSON.stringify(config, null, 2), "utf-8");
}

export function createEmptyConfig(): ProjectActionsConfig {
  return { groups: [{ id: "general", label: "General", actions: [] }] };
}

export function createConfigFile(): { ok: boolean; message: string } {
  const paths = resolveWorkspacePaths();
  if (!paths) {
    return { ok: false, message: "No workspace folder open." };
  }

  if (fs.existsSync(paths.configFilePath)) {
    return { ok: false, message: "Config file already exists." };
  }

  if (!fs.existsSync(paths.configDir)) {
    fs.mkdirSync(paths.configDir, { recursive: true });
  }

  const config = createEmptyConfig();
  fs.writeFileSync(paths.configFilePath, JSON.stringify(config, null, 2), "utf-8");
  const ide = detectIde();
  return { ok: true, message: `Created ${ide.configFile}` };
}

export async function addSuggestionToConfig(
  suggestion: SuggestedAction,
): Promise<ConfigServiceResult> {
  const state = readWorkspaceConfig({ createIfMissing: true });
  if (!state) {
    return { ok: false, message: "Could not read or create workspace config." };
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
      return { ok: false, message: `"${suggestion.label}" is already in Project Scripts.` };
    }
    config.groups[0].actions.push(newAction);
  }

  writeWorkspaceConfig(state, config);
  return { ok: true, message: `"${suggestion.label}" added to Project Scripts.` };
}

export async function removeActionFromConfig(actionId: string): Promise<ConfigServiceResult> {
  const state = readWorkspaceConfig({ createIfMissing: false });
  if (!state) {
    return { ok: false, message: "Config file not found." };
  }

  const result = removeActionInConfig(state.config, actionId);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  writeWorkspaceConfig(state, result.config);
  return { ok: true, message: `"${result.action.label}" removed from Project Scripts.` };
}

export async function createGroupInWorkspaceConfig(label: string): Promise<ConfigServiceResult> {
  const state = readWorkspaceConfig({ createIfMissing: true });
  if (!state) {
    return { ok: false, message: "Could not read or create workspace config." };
  }

  const result = createGroupInConfig(state.config, label);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  writeWorkspaceConfig(state, result.config);
  return { ok: true, message: `Category "${result.group.label}" created.` };
}

export async function moveActionInWorkspaceConfig(
  actionId: string,
  target: MoveActionTarget,
): Promise<ConfigServiceResult & { changed: boolean }> {
  const state = readWorkspaceConfig({ createIfMissing: false });
  if (!state) {
    return { ok: false, message: "Config file not found.", changed: false };
  }

  const result = moveActionInConfig(state.config, actionId, target);
  if (!result.ok) {
    return { ok: false, message: result.error, changed: false };
  }

  if (!result.changed) {
    return { ok: true, message: "", changed: false };
  }

  writeWorkspaceConfig(state, result.config);
  return { ok: true, message: "", changed: true };
}

export async function removeGroupFromWorkspaceConfig(groupId: string): Promise<ConfigServiceResult> {
  const state = readWorkspaceConfig({ createIfMissing: false });
  if (!state) {
    return { ok: false, message: "Config file not found." };
  }

  const result = removeGroupInConfig(state.config, groupId);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  writeWorkspaceConfig(state, result.config);
  return { ok: true, message: `Category "${result.group.label}" removed.` };
}
