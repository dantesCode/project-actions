import * as vscode from "vscode";
import { TerminalMode } from "./types";

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf/i,
  /git\s+reset\s+--hard/i,
  /git\s+clean\s+-f/i,
  /drop\s+(database|table|schema)/i,
  /truncate\s+table/i,
  /format\s+[a-z]:/i,
  /mkfs/i,
];

const HIGH_RISK_PATTERNS = [
  ...DESTRUCTIVE_PATTERNS,
  /curl\b[^\n|]*\|/i,
  /wget\b[^\n|]*\|/i,
  /\bsudo\b/i,
  /\bdd\s+if=/i,
  /remove-item\b.*-recurse\b.*-force/i,
  /\brd\s+\/s\s+\/q\b/i,
  /\bdel\s+\/f\b/i,
];

export interface RunCommandOptions {
  label?: string;
  source?: string;
  terminalMode?: TerminalMode;
}

let terminal: vscode.Terminal | undefined;

export function getOrCreateTerminal(): vscode.Terminal | undefined {
  if (!terminal || terminal.exitStatus !== undefined) {
    terminal = vscode.window.createTerminal("Project Scripts");
    if (!terminal) {
      return undefined;
    }
  }
  return terminal;
}

export function createNewTerminal(): vscode.Terminal | undefined {
  const t = vscode.window.createTerminal("Project Scripts");
  if (!t) {
    return undefined;
  }
  return t;
}

function resolveTerminal(mode?: TerminalMode): vscode.Terminal | undefined {
  if (mode === "new") {
    return createNewTerminal();
  }
  return getOrCreateTerminal();
}

export function isDestructive(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(command));
}

export function isHighRisk(command: string): boolean {
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(command));
}

export function buildExecutionMessage(command: string, options: RunCommandOptions = {}): string {
  const details = [];

  if (options.label) {
    details.push(`Action: ${options.label}`);
  }

  if (options.source) {
    details.push(`Source: ${options.source}`);
  }

  details.push(`Command: ${command}`);

  return details.join("\n");
}

export async function runInTerminal(
  command: string,
  options: RunCommandOptions = {},
): Promise<void> {
  try {
    if (vscode.workspace.isTrusted === false) {
      vscode.window.showWarningMessage("Project Scripts is disabled in untrusted workspaces.");
      return;
    }

    const message = buildExecutionMessage(command, options);
    const highRisk = isHighRisk(command);
    const prompt = highRisk
      ? `This command looks high-risk and requires explicit confirmation.\n\n${message}`
      : `Review this command before execution.\n\n${message}`;

    const choice = await vscode.window.showWarningMessage(
      prompt,
      { modal: true },
      highRisk ? "Run high-risk command" : "Run command",
    );

    if (!choice) {
      return;
    }

    const t = resolveTerminal(options.terminalMode);
    if (!t) {
      vscode.window.showErrorMessage("Failed to create terminal for command execution.");
      return;
    }
    t.show();
    t.sendText(command);
  } catch (err) {
    console.error("Error executing command in terminal:", err);
    vscode.window.showErrorMessage(`Failed to execute command: ${(err as Error).message}`);
  }
}
