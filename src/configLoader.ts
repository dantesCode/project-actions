import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { validateConfig, ValidationResult } from './configSchema';

export const CONFIG_PATH = '.vscode/project-actions.json';

export function loadConfig(): ValidationResult {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return { valid: false, error: 'No workspace folder is open.' };
  }

  const configFilePath = path.join(workspaceFolders[0].uri.fsPath, CONFIG_PATH);

  if (!fs.existsSync(configFilePath)) {
    return { valid: false, error: 'NO_CONFIG' };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
    return validateConfig(raw);
  } catch (e) {
    return { valid: false, error: `Could not parse project-actions.json: ${(e as Error).message}` };
  }
}
