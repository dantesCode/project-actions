import * as vscode from "vscode";
import { ProjectActionsProvider, ActionTreeItem } from "./projectActionsProvider";
import { SuggestedActionsProvider } from "./suggestedActionsProvider";
import { runInTerminal } from "./terminalRunner";
import {
  addSuggestionToConfig,
  createConfigFile,
  createGroupInWorkspaceConfig,
  moveActionInWorkspaceConfig,
  removeActionFromConfig,
} from "./configWriter";
import { openActionPicker } from "./actionPicker";
import { SuggestedTreeItem } from "./suggestedActionsProvider";
import { detectIde } from "./ideDetector";
import { loadConfig } from "./configLoader";
import { CuratedTreeDragAndDropController } from "./curatedTreeDragAndDrop";

interface CategoryQuickPickItem extends vscode.QuickPickItem {
  groupId: string;
}

function getItemLabel(label: string | vscode.TreeItemLabel | undefined): string | undefined {
  return typeof label === "string" ? label : label?.label;
}

export function activate(context: vscode.ExtensionContext) {
  const projectActionsProvider = new ProjectActionsProvider();
  const suggestedProvider = new SuggestedActionsProvider();

  const projectActionsView = vscode.window.createTreeView("projectActionsView", {
    treeDataProvider: projectActionsProvider,
    dragAndDropController: new CuratedTreeDragAndDropController(async (actionId, target) => {
      await moveActionInWorkspaceConfig(actionId, target, () => {
        projectActionsProvider.refresh();
      });
    }),
    showCollapseAll: true,
  });
  vscode.window.registerTreeDataProvider("suggestedActionsView", suggestedProvider);
  context.subscriptions.push(projectActionsView);

  const ide = detectIde();
  const watcher = vscode.workspace.createFileSystemWatcher(`**/${ide.configFile}`);
  watcher.onDidChange(() => projectActionsProvider.refresh());
  watcher.onDidCreate(() => projectActionsProvider.refresh());
  watcher.onDidDelete(() => projectActionsProvider.refresh());
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.commands.registerCommand("projectActions.runAction", (command: string) => {
      runInTerminal(command);
    }),
    vscode.commands.registerCommand("projectActions.runCuratedAction", (item: ActionTreeItem) => {
      if (item.actionCommand) {
        runInTerminal(item.actionCommand, {
          label: getItemLabel(item.label),
          source: item.actionSource,
          terminalMode: item.actionTerminalMode,
        });
      }
    }),
    vscode.commands.registerCommand(
      "projectActions.runCuratedActionInNewTerminal",
      (item: ActionTreeItem) => {
        if (item.actionCommand) {
          runInTerminal(item.actionCommand, {
            label: getItemLabel(item.label),
            source: item.actionSource,
            terminalMode: "new",
          });
        }
      },
    ),
    vscode.commands.registerCommand("projectActions.refresh", () => {
      projectActionsProvider.refresh();
    }),
    vscode.commands.registerCommand("projectActions.runSuggestion", (item: SuggestedTreeItem) => {
      runInTerminal(item.suggestion.command, {
        label: item.suggestion.label,
        source: item.suggestion.source,
      });
    }),
    vscode.commands.registerCommand(
      "projectActions.runSuggestionInNewTerminal",
      (item: SuggestedTreeItem) => {
        runInTerminal(item.suggestion.command, {
          label: item.suggestion.label,
          source: item.suggestion.source,
          terminalMode: "new",
        });
      },
    ),
    vscode.commands.registerCommand("projectActions.addSuggestion", (item: SuggestedTreeItem) => {
      addSuggestionToConfig(item.suggestion, () => {
        projectActionsProvider.refresh();
        suggestedProvider.refresh();
      });
    }),
    vscode.commands.registerCommand("projectActions.removeAction", (item: ActionTreeItem) => {
      if (item.actionId) {
        removeActionFromConfig(item.actionId, () => {
          projectActionsProvider.refresh();
        });
      }
    }),
    vscode.commands.registerCommand("projectActions.createConfig", async () => {
      const created = await createConfigFile();
      if (created) {
        projectActionsProvider.refresh();
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
        projectActionsProvider.refresh();
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
            projectActionsProvider.refresh();
          },
        );
      },
    ),
    vscode.commands.registerCommand("projectActions.openActionPicker", () => {
      openActionPicker();
    }),
  );
}

export function deactivate() {}
