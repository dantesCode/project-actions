import * as vscode from "vscode";
import * as fs from "fs";
import { validateConfig, ValidationResult } from "./configSchema";
import { detectIde, getConfigPath } from "./ideDetector";

export function loadConfig(): ValidationResult {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return { valid: false, error: "No workspace folder is open." };
  }

  const ide = detectIde();
  const configFilePath = getConfigPath(workspaceFolders[0].uri.fsPath, ide);

  if (!fs.existsSync(configFilePath)) {
    return { valid: false, error: "NO_CONFIG" };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    return validateConfig(raw);
  } catch (e) {
    return { valid: false, error: `Could not parse project-actions.json: ${(e as Error).message}` };
  }
}

export function getConfigPathForWorkspace(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }
  const ide = detectIde();
  return getConfigPath(workspaceFolders[0].uri.fsPath, ide);
}

export function getConfigDirForWorkspace(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }
  const ide = detectIde();
  return `${workspaceFolders[0].uri.fsPath}/${ide.configDir}`;
}
