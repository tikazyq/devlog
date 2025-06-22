/**
 * Core types for the devlog system
 */

export type DevlogType = "feature" | "bugfix" | "task" | "refactor" | "docs";

export type DevlogStatus = "todo" | "in-progress" | "review" | "testing" | "done" | "archived";

export type DevlogPriority = "low" | "medium" | "high" | "critical";

export type NoteCategory = "progress" | "issue" | "solution" | "idea" | "reminder";

export interface DevlogNote {
  id: string;
  timestamp: string;
  category: NoteCategory;
  content: string;
  files?: string[];
  codeChanges?: string;
}

export interface DevlogEntry {
  id: string;
  title: string;
  type: DevlogType;
  description: string;
  status: DevlogStatus;
  priority: DevlogPriority;
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
  tags: string[];
  notes: DevlogNote[];
  files: string[];
  relatedDevlogs: string[];
}

export interface DevlogFilter {
  status?: DevlogStatus[];
  type?: DevlogType[];
  priority?: DevlogPriority[];
  assignee?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface DevlogStats {
  totalEntries: number;
  byStatus: Record<DevlogStatus, number>;
  byType: Record<DevlogType, number>;
  byPriority: Record<DevlogPriority, number>;
  averageCompletionTime?: number;
}

export interface CreateDevlogRequest {
  id?: string;
  title: string;
  type: DevlogType;
  description: string;
  priority?: DevlogPriority;
  estimatedHours?: number;
  assignee?: string;
  tags?: string[];
}

export interface UpdateDevlogRequest {
  id: string;
  title?: string;
  description?: string;
  status?: DevlogStatus;
  priority?: DevlogPriority;
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
  tags?: string[];
  progress?: string;
  files?: string[];
  codeChanges?: string;
  noteCategory?: NoteCategory;
}
