import * as vscode from "vscode";
import { runInTerminal } from "../terminalRunner";
import { ActionTreeItem, ProjectActionsProvider } from "../projectActionsProvider";
import { SuggestedTreeItem } from "../suggestedActionsProvider";

export function registerRunCommands(
  _context: vscode.ExtensionContext,
  _providers: { projectActions: ProjectActionsProvider },
): vscode.Disposable[] {
  return [
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
  ];
}

export function registerSuggestionCommands(_context: vscode.ExtensionContext): vscode.Disposable[] {
  return [
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
  ];
}

function getItemLabel(label: string | vscode.TreeItemLabel | undefined): string | undefined {
  return typeof label === "string" ? label : label?.label;
}
