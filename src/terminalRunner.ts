import * as vscode from 'vscode';

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf/i,
  /git\s+reset\s+--hard/i,
  /git\s+clean\s+-f/i,
  /drop\s+(database|table|schema)/i,
  /truncate\s+table/i,
  /format\s+[a-z]:/i,
  /mkfs/i,
];

let terminal: vscode.Terminal | undefined;

export function getOrCreateTerminal(): vscode.Terminal {
  if (!terminal || terminal.exitStatus !== undefined) {
    terminal = vscode.window.createTerminal('Project Actions');
  }
  return terminal;
}

export function isDestructive(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some(pattern => pattern.test(command));
}

export async function runInTerminal(command: string): Promise<void> {
  if (vscode.workspace.isTrusted === false) {
    vscode.window.showWarningMessage(
      'Project Actions is disabled in untrusted workspaces.'
    );
    return;
  }

  if (isDestructive(command)) {
    const choice = await vscode.window.showWarningMessage(
      `This command may be destructive:\n\`${command}\`\n\nAre you sure you want to run it?`,
      { modal: true },
      'Run anyway',
      'Cancel'
    );
    if (choice !== 'Run anyway') {
      return;
    }
  }

  const t = getOrCreateTerminal();
  t.show();
  t.sendText(command);
}
