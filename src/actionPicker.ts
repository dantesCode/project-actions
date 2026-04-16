import * as vscode from "vscode";
import { loadConfig } from "./configLoader";
import { runInTerminal } from "./terminalRunner";
import { detectIde } from "./ideDetector";
import { TerminalMode } from "./types";

interface QuickPickAction extends vscode.QuickPickItem {
  command: string;
  source: string;
  terminalMode?: TerminalMode;
}

export async function openActionPicker(): Promise<void> {
  const result = loadConfig();

  if (!result.valid && result.error !== "NO_CONFIG") {
    vscode.window.showErrorMessage(result.error);
    return;
  }

  if (!result.valid) {
    const ide = detectIde();
    vscode.window.showInformationMessage(`No actions defined. Add actions to ${ide.configFile}`);
    return;
  }

  if (result.config.groups.length === 0) {
    const ide = detectIde();
    vscode.window.showInformationMessage(`No actions defined. Add actions to ${ide.configFile}`);
    return;
  }

  const items: QuickPickAction[] = [];
  const ide = detectIde();

  for (const group of result.config.groups) {
    for (const action of group.actions) {
      items.push({
        label: action.label,
        description: action.command,
        detail: group.label,
        command: action.command,
        source: `${ide.configFile} (${group.label})`,
        terminalMode: action.terminalMode,
      });
    }
  }

  if (items.length === 0) {
    vscode.window.showInformationMessage(`No actions defined. Add actions to ${ide.configFile}`);
    return;
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select an action to run...",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selected) {
    runInTerminal(selected.command, {
      label: selected.label,
      source: selected.source,
      terminalMode: selected.terminalMode,
    });
  }
}
