import * as vscode from "vscode";
import { ActionTreeItem, ProjectActionsProvider } from "../projectActionsProvider";
import { SuggestedTreeItem } from "../suggestedActionsProvider";
import {
  addSuggestionToConfig,
  createConfigFile,
  createGroupInWorkspaceConfig,
  moveActionInWorkspaceConfig,
  removeActionFromConfig,
  removeGroupFromConfig,
} from "../configWriter";
import { loadConfig } from "../configLoader";

export interface RefreshTargets {
  projectActions: ProjectActionsProvider;
  suggested: { refresh(): void };
  statusBar: { refresh(): void };
  editorTitle: { refresh(): void };
}

interface CategoryQuickPickItem extends vscode.QuickPickItem {
  groupId: string;
}

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  refreshTargets: RefreshTargets,
): vscode.Disposable[] {
  const { projectActions, suggested, statusBar, editorTitle } = refreshTargets;

  return [
    vscode.commands.registerCommand("projectActions.addSuggestion", (item: SuggestedTreeItem) => {
      addSuggestionToConfig(item.suggestion, () => {
        projectActions.refresh();
        suggested.refresh();
        statusBar.refresh();
        editorTitle.refresh();
      });
    }),
    vscode.commands.registerCommand("projectActions.removeAction", (item: ActionTreeItem) => {
      if (item.actionId) {
        removeActionFromConfig(item.actionId, () => {
          projectActions.refresh();
          statusBar.refresh();
          editorTitle.refresh();
        });
      }
    }),
    vscode.commands.registerCommand("projectActions.createConfig", async () => {
      const created = await createConfigFile();
      if (created) {
        projectActions.refresh();
        statusBar.refresh();
        editorTitle.refresh();
      }
    }),
    vscode.commands.registerCommand("projectActions.newCategory", async () => {
      const label = await vscode.window.showInputBox({
        prompt: "Enter a category name",
        placeHolder: "Deploy",
        ignoreFocusOut: true,
      });

      if (label === undefined) {
        return;
      }

      await createGroupInWorkspaceConfig(label, () => {
        projectActions.refresh();
        statusBar.refresh();
        editorTitle.refresh();
      });
    }),
    vscode.commands.registerCommand(
      "projectActions.moveActionToCategory",
      async (item: ActionTreeItem) => {
        if (!item.actionId) {
          return;
        }

        const result = loadConfig();
        if (!result.valid) {
          if (result.error !== "NO_CONFIG") {
            vscode.window.showErrorMessage(result.error);
          }
          return;
        }

        const quickPickItems: CategoryQuickPickItem[] = result.config.groups.map((group) => ({
          label: group.label,
          description: group.id === item.groupId ? "Current category" : undefined,
          groupId: group.id,
        }));

        if (quickPickItems.length === 0) {
          vscode.window.showInformationMessage("No categories available.");
          return;
        }

        const selected = await vscode.window.showQuickPick(quickPickItems, {
          placeHolder: "Select a category",
          matchOnDescription: true,
        });

        if (!selected) {
          return;
        }

        await moveActionInWorkspaceConfig(
          item.actionId,
          { targetGroupId: selected.groupId },
          () => {
            projectActions.refresh();
            statusBar.refresh();
            editorTitle.refresh();
          },
        );
      },
    ),
    vscode.commands.registerCommand("projectActions.removeCategory", (item: ActionTreeItem) => {
      if (item.groupId) {
        removeGroupFromConfig(item.groupId, () => {
          projectActions.refresh();
          statusBar.refresh();
          editorTitle.refresh();
        });
      }
    }),
  ];
}
