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
  
  // Enhanced AI agent context
  context: DevlogContext;
  
  // AI-specific context for cross-session persistence
  aiContext: AIContext;
  
  // Enterprise tool integration (optional for now)
  externalReferences?: ExternalReference[];
}

export interface DevlogContext {
  // What problem this solves or what goal it achieves
  businessContext: string;
  
  // Technical context - architecture decisions, constraints, assumptions
  technicalContext: string;
  
  // Dependencies on other work items or external factors
  dependencies: Dependency[];
  
  // Key decisions made and their rationale
  decisions: Decision[];
  
  // Acceptance criteria or definition of done
  acceptanceCriteria: string[];
  
  // Risks and mitigation strategies
  risks: Risk[];
}

export interface Dependency {
  id: string;
  type: "blocks" | "blocked-by" | "related-to";
  description: string;
  externalId?: string; // For Jira, ADO, etc.
}

export interface Decision {
  id: string;
  timestamp: string;
  decision: string;
  rationale: string;
  alternatives?: string[];
  decisionMaker: string; // human name or AI agent identifier
}

export interface Risk {
  id: string;
  description: string;
  impact: "low" | "medium" | "high";
  probability: "low" | "medium" | "high";
  mitigation: string;
}

export interface ExternalReference {
  system: "jira" | "ado" | "github" | "slack" | "confluence" | "other";
  id: string;
  url?: string;
  title?: string;
  status?: string;
  lastSync?: string;
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
  
  // Enhanced context for AI agents
  businessContext?: string;
  technicalContext?: string;
  acceptanceCriteria?: string[];
  initialInsights?: string[];
  relatedPatterns?: string[];
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

// Enterprise Integration Types (for future use)
export interface EnterpriseIntegration {
  jira?: JiraConfig;
  ado?: AdoConfig;
  slack?: SlackConfig;
  github?: GitHubConfig;
}

export interface JiraConfig {
  baseUrl: string;
  projectKey: string;
  apiToken: string;
  userEmail: string;
}

export interface AdoConfig {
  organization: string;
  project: string;
  personalAccessToken: string;
}

export interface SlackConfig {
  botToken: string;
  channelId: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

// AI Agent Context Enhancement
export interface AIContext {
  // Summary of the current understanding for AI agents
  currentSummary: string;
  
  // Key insights that should be preserved across sessions
  keyInsights: string[];
  
  // Current blockers or questions that need resolution
  openQuestions: string[];
  
  // Related concepts or patterns from other projects
  relatedPatterns: string[];
  
  // Next logical steps based on current progress
  suggestedNextSteps: string[];
  
  // Context freshness indicator
  lastAIUpdate: string;
  contextVersion: number;
}
