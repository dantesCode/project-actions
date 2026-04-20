import { Action, ActionPlacement } from "./types";

export function hasPlacement(action: Action, placement: ActionPlacement): boolean {
  return action.placements === undefined || action.placements.includes(placement);
}
