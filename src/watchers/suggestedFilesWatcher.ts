import * as vscode from "vscode";
import { SuggestedActionsProvider } from "../suggestedActionsProvider";
import { detectors } from "../detectors";

export function createSuggestedFilesWatcher(
  provider: SuggestedActionsProvider,
): vscode.Disposable {
  const globs = detectors.flatMap((d) => d.fileGlobs);
  const pattern = globs.length > 0 ? `{${globs.join(",")}}` : "**/*";

  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  const refresh = () => provider.refresh();

  watcher.onDidChange(refresh);
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);

  return watcher;
}
