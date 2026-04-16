import * as vscode from "vscode";
import { MoveActionTarget } from "./configMutations";
import { ActionTreeItem } from "./projectActionsProvider";

export const CURATED_ACTIONS_MIME_TYPE = "application/vnd.code.tree.projectActionsView";

interface DragPayload {
  actionId: string;
}

export interface CuratedDropTargetItem {
  contextValue: string;
  groupId?: string;
  actionId?: string;
}

export function resolveCuratedDropTarget(
  target: CuratedDropTargetItem | undefined,
): MoveActionTarget | null {
  if (!target?.groupId) {
    return null;
  }

  if (target.contextValue === "group") {
    return { targetGroupId: target.groupId };
  }

  if (target.contextValue === "curatedAction" && target.actionId) {
    return {
      targetGroupId: target.groupId,
      beforeActionId: target.actionId,
    };
  }

  return null;
}

export function parseDraggedActionId(rawPayload: string): string | null {
  try {
    const payload = JSON.parse(rawPayload) as Partial<DragPayload>;
    return typeof payload.actionId === "string" && payload.actionId.length > 0
      ? payload.actionId
      : null;
  } catch {
    return null;
  }
}

export class CuratedTreeDragAndDropController implements vscode.TreeDragAndDropController<ActionTreeItem> {
  readonly dragMimeTypes = [CURATED_ACTIONS_MIME_TYPE];
  readonly dropMimeTypes = [CURATED_ACTIONS_MIME_TYPE];

  constructor(
    private readonly onDropAction: (actionId: string, target: MoveActionTarget) => Promise<void>,
  ) {}

  handleDrag(source: readonly ActionTreeItem[], dataTransfer: vscode.DataTransfer): void {
    const draggedAction = source.find(
      (item) => item.contextValue === "curatedAction" && item.actionId,
    );

    if (!draggedAction?.actionId) {
      return;
    }

    const payload: DragPayload = { actionId: draggedAction.actionId };
    dataTransfer.set(
      CURATED_ACTIONS_MIME_TYPE,
      new vscode.DataTransferItem(JSON.stringify(payload)),
    );
  }

  async handleDrop(
    target: ActionTreeItem | undefined,
    dataTransfer: vscode.DataTransfer,
  ): Promise<void> {
    const targetLocation = resolveCuratedDropTarget(target);
    if (!targetLocation) {
      return;
    }

    const transferItem = dataTransfer.get(CURATED_ACTIONS_MIME_TYPE);
    if (!transferItem) {
      return;
    }

    const rawPayload = await transferItem.asString();
    const actionId = parseDraggedActionId(rawPayload);
    if (!actionId) {
      return;
    }

    await this.onDropAction(actionId, targetLocation);
  }
}
