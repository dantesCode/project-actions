import { ActionPlacement, ProjectActionsConfig, TerminalMode } from "./types";

const VALID_PLACEMENTS: ActionPlacement[] = [
  "sidebar",
  "statusBar",
  "editorTitle",
  "explorerContext",
];
const VALID_TERMINAL_MODES: TerminalMode[] = ["shared", "new"];

function isValidTerminalMode(value: unknown): value is TerminalMode {
  return typeof value === "string" && VALID_TERMINAL_MODES.includes(value as TerminalMode);
}

export type ValidationResult =
  | { valid: true; config: ProjectActionsConfig }
  | { valid: false; error: string };

function isValidPlacement(value: string): value is ActionPlacement {
  return VALID_PLACEMENTS.includes(value as ActionPlacement);
}

export function validateConfig(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || !("groups" in raw)) {
    return { valid: false, error: 'Config must have a "groups" array at the top level.' };
  }
  const config = raw as ProjectActionsConfig;
  if (!Array.isArray(config.groups)) {
    return { valid: false, error: '"groups" must be an array.' };
  }
  for (const group of config.groups) {
    if (!group.id || !group.label || !Array.isArray(group.actions)) {
      return {
        valid: false,
        error: `Group "${group.id ?? "?"}" must have id, label, and actions.`,
      };
    }
    for (const action of group.actions) {
      if (!action.id || !action.label || !action.command) {
        return {
          valid: false,
          error: `Action "${action.id ?? "?"}" in group "${group.id}" must have id, label, and command.`,
        };
      }
      if (action.placements !== undefined) {
        if (!Array.isArray(action.placements)) {
          return { valid: false, error: `Action "${action.id}" placements must be an array.` };
        }
        for (const placement of action.placements) {
          if (typeof placement !== "string" || !isValidPlacement(placement)) {
            return {
              valid: false,
              error: `Action "${action.id}" has invalid placement "${placement}". Valid values: ${VALID_PLACEMENTS.join(", ")}`,
            };
          }
        }
      }
      if (action.terminalMode !== undefined) {
        if (!isValidTerminalMode(action.terminalMode)) {
          return {
            valid: false,
            error: `Action "${action.id}" has invalid terminalMode "${action.terminalMode}". Valid values: ${VALID_TERMINAL_MODES.join(", ")}`,
          };
        }
      }
    }
  }
  // Check for duplicate action IDs across groups
  const idToGroups = new Map<string, string[]>();
  for (const group of config.groups) {
    for (const action of group.actions) {
      const existing = idToGroups.get(action.id) || [];
      existing.push(group.id);
      idToGroups.set(action.id, existing);
    }
  }
  for (const [id, groups] of idToGroups) {
    if (groups.length > 1) {
      return {
        valid: false,
        error: `Duplicate action ID '${id}' found in groups: ${groups.join(", ")}`,
      };
    }
  }
  return { valid: true, config };
}
