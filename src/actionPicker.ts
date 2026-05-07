import * as vscode from "vscode";
import { loadConfigAsync } from "./configLoader";
import { runInTerminal } from "./terminalRunner";
import { hasPlacement } from "./placement";
import { Action, ActionPlacement } from "./types";

export async function openActionPicker(placement: ActionPlacement): Promise<void> {
  const result = await loadConfigAsync();
  if (!result.valid || result.config.groups.length === 0) {
    vscode.window.showInformationMessage("No actions defined.");
    return;
  }

  const allActions = result.config.groups.flatMap((g) => g.actions);
  const actionsWithPlacement = allActions.filter((a) => hasPlacement(a, placement));
  if (actionsWithPlacement.length === 0) {
    vscode.window.showInformationMessage(`No actions with ${placement} placement defined.`);
    return;
  }

  const items: (vscode.QuickPickItem & { action?: Action })[] = [];
  for (const group of result.config.groups) {
    const groupActions = group.actions.filter((a) => hasPlacement(a, placement));
    if (groupActions.length === 0) {
      continue;
    }

    items.push({
      label: group.label,
      kind: vscode.QuickPickItemKind.Separator,
    });

    for (const action of groupActions) {
      items.push({
        label: action.label,
        description: action.command,
        action,
      });
    }
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select an action to run...",
    matchOnDescription: true,
  });

  if (selected && selected.action) {
    runInTerminal(selected.action.command, {
      label: selected.action.label,
      source: placement,
      terminalMode: selected.action.terminalMode,
    });
  }
}
