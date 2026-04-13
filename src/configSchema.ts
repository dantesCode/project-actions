import { ProjectActionsConfig } from './types';

export type ValidationResult =
  | { valid: true; config: ProjectActionsConfig }
  | { valid: false; error: string };

export function validateConfig(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null || !('groups' in raw)) {
    return { valid: false, error: 'Config must have a "groups" array at the top level.' };
  }
  const config = raw as ProjectActionsConfig;
  if (!Array.isArray(config.groups)) {
    return { valid: false, error: '"groups" must be an array.' };
  }
  for (const group of config.groups) {
    if (!group.id || !group.label || !Array.isArray(group.actions)) {
      return { valid: false, error: `Group "${group.id ?? '?'}" must have id, label, and actions.` };
    }
    for (const action of group.actions) {
      if (!action.id || !action.label || !action.command) {
        return { valid: false, error: `Action "${action.id ?? '?'}" in group "${group.id}" must have id, label, and command.` };
      }
    }
  }
  return { valid: true, config };
}
