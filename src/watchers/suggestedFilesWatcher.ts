import * as vscode from "vscode";
import { SuggestedActionsProvider } from "../suggestedActionsProvider";

export function createSuggestedFilesWatcher(
  provider: SuggestedActionsProvider,
): vscode.Disposable {
  const watcher = vscode.workspace.createFileSystemWatcher(
    "{package.json,composer.json,Makefile,makefile,GNUmakefile}",
  );

  const refresh = () => provider.refresh();

  watcher.onDidChange(refresh);
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);

  return watcher;
}
