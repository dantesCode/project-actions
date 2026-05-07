import { Action, Group, ProjectActionsConfig } from "./types";

export interface MoveActionTarget {
  targetGroupId: string;
  beforeActionId?: string;
}

export type CreateGroupResult =
  | { ok: true; config: ProjectActionsConfig; group: Group }
  | { ok: false; error: string };

export type MoveActionResult =
  | { ok: true; config: ProjectActionsConfig; action: Action; changed: boolean }
  | { ok: false; error: string };

export type RemoveActionResult =
  | { ok: true; config: ProjectActionsConfig; action: Action }
  | { ok: false; error: string };

export type RemoveGroupResult =
  | { ok: true; config: ProjectActionsConfig; group: Group }
  | { ok: false; error: string };

function cloneConfig(config: ProjectActionsConfig): ProjectActionsConfig {
  return {
    groups: config.groups.map((group) => ({
      ...group,
      actions: group.actions.map((action) => ({ ...action })),
    })),
  };
}

function toGroupIdBase(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "category";
}

function getUniqueGroupId(config: ProjectActionsConfig, label: string): string {
  const base = toGroupIdBase(label);
  const existingIds = new Set(config.groups.map((group) => group.id));

  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function getAmbiguousActionIdError(actionId: string): string {
  return `Action id "${actionId}" is duplicated and ambiguous. Make action ids unique before editing.`;
}

function findActionMatches(
  config: ProjectActionsConfig,
  actionId: string,
  groupId?: string,
): Array<{ group: Group; actionIndex: number }> {
  const matches: Array<{ group: Group; actionIndex: number }> = [];

  for (const group of config.groups) {
    if (groupId && group.id !== groupId) {
      continue;
    }

    group.actions.forEach((action, index) => {
      if (action.id === actionId) {
        matches.push({ group, actionIndex: index });
      }
    });
  }

  return matches;
}

function getUniqueActionMatch(
  config: ProjectActionsConfig,
  actionId: string,
  options: { groupId?: string; missingError: string },
): { ok: true; group: Group; actionIndex: number } | { ok: false; error: string } {
  const matches = findActionMatches(config, actionId, options.groupId);

  if (matches.length === 0) {
    return { ok: false, error: options.missingError };
  }

  if (matches.length > 1) {
    return { ok: false, error: getAmbiguousActionIdError(actionId) };
  }

  return { ok: true, ...matches[0] };
}

export function createGroupInConfig(
  config: ProjectActionsConfig,
  label: string,
): CreateGroupResult {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return { ok: false, error: "Category name cannot be empty." };
  }

  if (config.groups.some((group) => group.label.toLowerCase() === trimmedLabel.toLowerCase())) {
    return { ok: false, error: "A category with this name already exists." };
  }

  const nextConfig = cloneConfig(config);
  const id = getUniqueGroupId(nextConfig, trimmedLabel);

  if (nextConfig.groups.some((group) => group.id === id)) {
    return { ok: false, error: "A category with this ID already exists." };
  }

  const group: Group = {
    id,
    label: trimmedLabel,
    actions: [],
  };

  nextConfig.groups.push(group);

  return { ok: true, config: nextConfig, group };
}

export function moveActionInConfig(
  config: ProjectActionsConfig,
  actionId: string,
  target: MoveActionTarget,
): MoveActionResult {
  const nextConfig = cloneConfig(config);
  const sourceMatch = getUniqueActionMatch(nextConfig, actionId, {
    missingError: "Action not found in config.",
  });

  if (!sourceMatch.ok) {
    return sourceMatch;
  }

  const sourceGroup = sourceMatch.group;
  const sourceIndex = sourceMatch.actionIndex;
  const action = sourceGroup.actions[sourceIndex];

  const targetGroup = nextConfig.groups.find((group) => group.id === target.targetGroupId);
  if (!targetGroup) {
    return { ok: false, error: "Target category not found." };
  }

  if (target.beforeActionId === action.id) {
    return { ok: true, config: nextConfig, action, changed: false };
  }

  if (!target.beforeActionId) {
    if (targetGroup.id === sourceGroup.id) {
      return { ok: true, config: nextConfig, action, changed: false };
    }

    sourceGroup.actions.splice(sourceIndex, 1);
    targetGroup.actions.push(action);
    return { ok: true, config: nextConfig, action, changed: true };
  }

  const targetMatch = getUniqueActionMatch(nextConfig, target.beforeActionId, {
    groupId: targetGroup.id,
    missingError: "Target action not found.",
  });

  if (!targetMatch.ok) {
    return targetMatch;
  }

  const targetIndex = targetMatch.actionIndex;

  if (targetGroup.id === sourceGroup.id && targetIndex === sourceIndex + 1) {
    return { ok: true, config: nextConfig, action, changed: false };
  }

  sourceGroup.actions.splice(sourceIndex, 1);

  const insertionIndex =
    targetGroup.id === sourceGroup.id && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;

  targetGroup.actions.splice(insertionIndex, 0, action);

  return { ok: true, config: nextConfig, action, changed: true };
}

export function removeActionInConfig(
  config: ProjectActionsConfig,
  actionId: string,
): RemoveActionResult {
  const nextConfig = cloneConfig(config);
  const match = getUniqueActionMatch(nextConfig, actionId, {
    missingError: "Action not found in config.",
  });

  if (!match.ok) {
    return match;
  }

  const action = match.group.actions[match.actionIndex];

  match.group.actions.splice(match.actionIndex, 1);

  return { ok: true, config: nextConfig, action };
}

export function removeGroupInConfig(
  config: ProjectActionsConfig,
  groupId: string,
): RemoveGroupResult {
  const nextConfig = cloneConfig(config);
  const groupIndex = nextConfig.groups.findIndex((group) => group.id === groupId);

  if (groupIndex === -1) {
    return { ok: false, error: "Category not found in config." };
  }

  if (nextConfig.groups.length === 1) {
    return { ok: false, error: "Cannot remove the last category." };
  }

  const group = nextConfig.groups[groupIndex];
  nextConfig.groups.splice(groupIndex, 1);

  return { ok: true, config: nextConfig, group };
}
