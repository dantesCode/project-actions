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
}

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

export function isHighRisk(command: string): boolean {
  return HIGH_RISK_PATTERNS.some(pattern => pattern.test(command));
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

  return details.join('\n');
}

export async function runInTerminal(command: string, options: RunCommandOptions = {}): Promise<void> {
  if (vscode.workspace.isTrusted === false) {
    vscode.window.showWarningMessage(
      'Project Actions is disabled in untrusted workspaces.'
    );
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
    highRisk ? 'Run high-risk command' : 'Run command'
  );

  if (!choice) {
    return;
  }

  const t = getOrCreateTerminal();
  t.show();
  t.sendText(command);
}
