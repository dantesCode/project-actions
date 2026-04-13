export type ActionPlacement = 'sidebar' | 'statusBar' | 'editorTitle' | 'explorerContext';

export interface Action {
  id: string;
  label: string;
  command: string;
  icon?: string;
  placements?: ActionPlacement[];
}

export interface Group {
  id: string;
  label: string;
  actions: Action[];
}

export interface ProjectActionsConfig {
  groups: Group[];
}
