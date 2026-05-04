import * as vscode from "vscode";
import { ProjectActionsProvider } from "./projectActionsProvider";
import { SuggestedActionsProvider } from "./suggestedActionsProvider";
import { CuratedTreeDragAndDropController } from "./curatedTreeDragAndDrop";
import { StatusBarManager } from "./statusBarManager";
import { EditorTitleManager } from "./editorTitleManager";
import {
  registerRunCommands,
  registerSuggestionCommands,
  registerConfigCommands,
  registerRefreshCommands,
  registerPickerCommands,
  registerPlacementCommands,
} from "./commands";
import { setupConfigFileWatcher } from "./watchers/configWatcher";
import { createSuggestedFilesWatcher } from "./watchers/suggestedFilesWatcher";
import { moveActionInWorkspaceConfig } from "./configWriter";

export function activate(context: vscode.ExtensionContext) {
  const projectActionsProvider = new ProjectActionsProvider();
  const suggestedProvider = new SuggestedActionsProvider();
  const statusBarManager = new StatusBarManager();
  const editorTitleManager = new EditorTitleManager();

  const projectActionsView = vscode.window.createTreeView("projectActionsView", {
    treeDataProvider: projectActionsProvider,
    dragAndDropController: new CuratedTreeDragAndDropController(async (actionId, target) => {
      await moveActionInWorkspaceConfig(actionId, target, () => {
        projectActionsProvider.refresh();
        suggestedProvider.refresh();
        statusBarManager.refresh();
        editorTitleManager.refresh();
      });
    }),
    showCollapseAll: true,
  });

  vscode.window.registerTreeDataProvider("suggestedActionsView", suggestedProvider);

  const suggestedFilesWatcher = createSuggestedFilesWatcher(suggestedProvider);

  const watcher = setupConfigFileWatcher({
    projectActions: projectActionsProvider,
    suggested: suggestedProvider,
    statusBar: statusBarManager,
    editorTitle: editorTitleManager,
  });

  context.subscriptions.push(
    projectActionsView,
    watcher,
    suggestedFilesWatcher,
    statusBarManager,
    editorTitleManager,
  );

  setTimeout(() => statusBarManager.refresh(), 0);
  setTimeout(() => editorTitleManager.refresh(), 0);

  const refreshTargets = {
    projectActions: projectActionsProvider,
    suggested: suggestedProvider,
    statusBar: statusBarManager,
    editorTitle: editorTitleManager,
  };

  const commands = [
    ...registerRunCommands(context, { projectActions: projectActionsProvider }),
    ...registerSuggestionCommands(context),
    ...registerConfigCommands(context, refreshTargets),
    ...registerRefreshCommands(context, {
      projectActions: projectActionsProvider,
      suggested: suggestedProvider,
      statusBar: statusBarManager,
      editorTitle: editorTitleManager,
    }),
    ...registerPickerCommands(context),
    ...registerPlacementCommands(context, {
      statusBar: statusBarManager,
      editorTitle: editorTitleManager,
    }),
  ];

  context.subscriptions.push(...commands);
}

export function deactivate() {}
