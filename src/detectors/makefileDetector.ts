import * as fs from 'fs';
import * as path from 'path';
import { SuggestedAction } from './packageJsonDetector';

/**
 * Parses a Makefile and returns all public targets as SuggestedActions.
 *
 * A target is considered public if:
 * - It is defined at the start of a line as `target-name:`
 * - Its name does not start with `.` (special/phony internals like .PHONY, .DEFAULT)
 * - It is not a variable assignment (no `=` or `:=` before the `:`)
 * - It is not a pattern rule (no `%` in the name)
 *
 * If the Makefile declares a `.PHONY` list, those names are used as an
 * allow-list to surface only intentional command targets. When no `.PHONY`
 * directive is found, all qualifying targets are returned.
 */
export function detectMakefileTargets(workspaceRoot: string): SuggestedAction[] {
  const candidates = ['Makefile', 'makefile', 'GNUmakefile'];
  let content: string | undefined;

  for (const name of candidates) {
    const filePath = path.join(workspaceRoot, name);
    if (fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        return [];
      }
      break;
    }
  }

  if (content === undefined) {
    return [];
  }

  const lines = content.split('\n');

  // Collect .PHONY targets (may span multiple .PHONY lines)
  const phonyTargets = new Set<string>();
  for (const line of lines) {
    const phonyMatch = line.match(/^\.PHONY\s*:\s*(.+)/);
    if (phonyMatch) {
      phonyMatch[1].trim().split(/\s+/).forEach(t => phonyTargets.add(t));
    }
  }

  // Collect all valid targets from rule lines (target: [deps])
  const TARGET_RE = /^([a-zA-Z0-9][a-zA-Z0-9_\-./]*)(\s*:[^=]|:$)/;
  const allTargets: string[] = [];

  for (const line of lines) {
    // Skip comments and blank lines
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }
    const match = line.match(TARGET_RE);
    if (match) {
      const name = match[1].trim();
      // Skip pattern rules and special targets
      if (!name.includes('%') && !name.startsWith('.')) {
        allTargets.push(name);
      }
    }
  }

  // De-duplicate while preserving order
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const t of allTargets) {
    if (!seen.has(t)) {
      seen.add(t);
      targets.push(t);
    }
  }

  // If .PHONY was declared, restrict to those targets only
  const finalTargets = phonyTargets.size > 0
    ? targets.filter(t => phonyTargets.has(t))
    : targets;

  return finalTargets.map(name => ({
    id: `makefile-${name}`,
    label: name,
    command: `make ${name}`,
    source: 'Makefile',
  }));
}
