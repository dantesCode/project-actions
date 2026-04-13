export interface Action {
  id: string;
  label: string;
  command: string;
  icon?: string;
}

export interface Group {
  id: string;
  label: string;
  actions: Action[];
}

export interface ProjectActionsConfig {
  groups: Group[];
}
