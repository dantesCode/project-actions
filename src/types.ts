export type ActionPlacement = "sidebar" | "statusBar" | "editorTitle" | "explorerContext";

export type TerminalMode = "shared" | "new";

export interface SuggestedAction {
  id: string;
  label: string;
  command: string;
  source: string;
}

export interface Detector {
  /** Unique identifier for this detector (e.g. "package-json", "makefile") */
  id: string;
  /** Glob patterns for files this detector watches */
  fileGlobs: string[];
  /** Detect suggested actions from the workspace root. Returns [] if no relevant files found. */
  detect(workspaceRoot: string): Promise<SuggestedAction[]>;
}

export interface Action {
  id: string;
  label: string;
  command: string;
  icon?: string;
  placements?: ActionPlacement[];
  terminalMode?: TerminalMode;
}

export interface Group {
  id: string;
  label: string;
  actions: Action[];
}

export interface ProjectActionsConfig {
  groups: Group[];
}
