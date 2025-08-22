export type BoardIssue = {
  id: string;
  key: string;
  type: "epic" | "story" | "task" | "bug" | "subtask";
  status: string;
  rank: string; // lexorank-style string for ordering
  summary: string;
  assignee?: { id: string; name: string; avatar?: string };
  storyPoints?: number;
  epic?: { id: string; name: string; color?: string } | null;
  parent?: { id: string; key: string; summary: string } | null; // present when type==='subtask'
  counts?: {
    subtasksDone: number;
    subtasksTotal: number;
    openBugs: number;
  }; // for parent issues
  priority: string;
  labels: string[];
  dueDate?: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  color?: string;
};

export type SwimlaneType = "none" | "epic" | "parent" | "assignee";

export type BoardGroup = {
  key: string;
  type: SwimlaneType;
  title: string;
  issueIds: string[];
  color?: string; // for epic groups
};

export type BoardPayload = {
  columns: BoardColumn[];
  swimlane: SwimlaneType;
  issues: BoardIssue[];
  groups?: BoardGroup[];
};

// Client-side derived state for rendering
export interface ColumnState {
  id: string;
  name: string;
  color?: string;
  items: Array<
    | { kind: "groupHeader"; groupKey: string; title: string; color?: string }
    | { kind: "issue"; issue: BoardIssue }
  >;
}

// DnD operation types
export interface ReorderOperation {
  issueId: string;
  column: string;
  afterId: string | null;
  beforeId: string | null;
}

export interface MoveOperation {
  issueId: string;
  toColumn: string;
  position: { afterId?: string; beforeId?: string };
}

export interface ReparentOperation {
  issueId: string;
  newParentId: string | null; // null to make it a top-level issue
}

// LexoRank utilities
export interface RankPosition {
  afterId?: string;
  beforeId?: string;
}

// Filter and search options for board data
export interface BoardFilters {
  assigneeIds?: string[];
  labels?: string[];
  epicIds?: string[];
  search?: string;
  types?: string[];
  swimlane?: SwimlaneType;
}
