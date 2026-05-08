import { Action, ActionPlacement } from "./types";

export function hasPlacement(action: Action, placement?: ActionPlacement): boolean {
  return placement === undefined || action.placements === undefined || action.placements.includes(placement);
}
