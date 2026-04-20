import * as vscode from "vscode";
import { SuggestedAction } from "./types";
import { MoveActionTarget } from "./configMutations";
import {
  createConfigFile as createConfigFileService,
  addSuggestionToConfig as addSuggestionService,
  removeActionFromConfig as removeActionService,
  createGroupInWorkspaceConfig as createGroupService,
  removeGroupFromWorkspaceConfig as removeGroupService,
  moveActionInWorkspaceConfig as moveActionService,
} from "./configService";

export async function createConfigFile(): Promise<boolean> {
  const result = createConfigFileService();
  if (!result.ok) {
    vscode.window.showInformationMessage(result.message);
    return false;
  }
  vscode.window.showInformationMessage(result.message);
  return true;
}

export async function addSuggestionToConfig(
  suggestion: SuggestedAction,
  onRefresh: () => void,
): Promise<void> {
  const result = await addSuggestionService(suggestion);
  if (!result.ok) {
    vscode.window.showInformationMessage(result.message);
    return;
  }
  vscode.window.showInformationMessage(result.message);
  onRefresh();
}

export async function removeActionFromConfig(
  actionId: string,
  onRefresh: () => void,
): Promise<void> {
  const result = await removeActionService(actionId);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.message);
    return;
  }
  vscode.window.showInformationMessage(result.message);
  onRefresh();
}

export async function createGroupInWorkspaceConfig(
  label: string,
  onRefresh: () => void,
): Promise<void> {
  const result = await createGroupService(label);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.message);
    return;
  }
  vscode.window.showInformationMessage(result.message);
  onRefresh();
}

export async function moveActionInWorkspaceConfig(
  actionId: string,
  target: MoveActionTarget,
  onRefresh: () => void,
): Promise<void> {
  const result = await moveActionService(actionId, target);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.message);
    return;
  }
  if (!result.changed) {
    return;
  }
  onRefresh();
}

export async function removeGroupFromConfig(
  groupId: string,
  onRefresh: () => void,
): Promise<void> {
  const result = await removeGroupService(groupId);
  if (!result.ok) {
    vscode.window.showWarningMessage(result.message);
    return;
  }
  vscode.window.showInformationMessage(result.message);
  onRefresh();
}
