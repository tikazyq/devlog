/**
 * Core types for the devlog system
 */

export type DevlogType = 'feature' | 'bugfix' | 'task' | 'refactor' | 'docs';

export type DevlogStatus = 'todo' | 'in-progress' | 'review' | 'testing' | 'done' | 'archived';

export type DevlogPriority = 'low' | 'medium' | 'high' | 'critical';

export type NoteCategory = 'progress' | 'issue' | 'solution' | 'idea' | 'reminder';

/**
 * ID type for devlog entries - integer only for clean, user-friendly references
 */
export type DevlogId = number;

export interface DevlogNote {
  id: string;
  timestamp: string;
  category: NoteCategory;
  content: string;
  files?: string[];
  codeChanges?: string;
}

export interface DevlogEntry {
  id: DevlogId;
  key: string; // Original semantic key (e.g., "web-ui-issues-investigation")
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
  type: 'blocks' | 'blocked-by' | 'related-to';
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
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ExternalReference {
  system: 'jira' | 'ado' | 'github' | 'slack' | 'confluence' | 'other';
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
  id: DevlogId;
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
  projectNumber?: number; // GitHub Project V2 number
  projectId?: string; // GitHub Project V2 ID (for GraphQL)
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

export interface DiscoverDevlogsRequest {
  workDescription: string;
  workType: DevlogType;
  keywords?: string[];
  scope?: string;
}

export interface DiscoveredDevlogEntry {
  entry: DevlogEntry;
  relevance: 'direct-text-match' | 'same-type' | 'keyword-in-notes';
  matchedTerms: string[];
}

export interface DiscoveryResult {
  relatedEntries: DiscoveredDevlogEntry[];
  activeCount: number;
  recommendation: string;
  searchParameters: DiscoverDevlogsRequest;
}

// Storage Configuration Types
export type StorageType = 'json' | 'sqlite' | 'mysql' | 'postgres';

export type ConflictResolution = 'local-wins' | 'remote-wins' | 'timestamp-wins' | 'interactive';

export interface GitCredentials {
  type: 'token' | 'ssh' | 'basic';
  token?: string; // For GitHub/GitLab PAT
  username?: string; // For basic auth
  password?: string; // For basic auth
  keyPath?: string; // For SSH key path
}

export interface GitStorageConfig {
  repository: string; // "owner/repo" or full Git URL
  branch?: string; // default: "main"
  path?: string; // default: ".devlog/"
  credentials?: GitCredentials;
  autoSync?: boolean; // default: true
  conflictResolution?: ConflictResolution;
}

export interface LocalCacheConfig {
  type: 'sqlite';
  filePath: string; // e.g., "~/.devlog/cache/project-name.db"
}

export interface LocalJsonConfig {
  directory?: string; // default: ".devlog/"
  filePattern?: string; // default: "{id:03d}-{slug}.json"
}

export interface StorageConfig {
  type: StorageType;

  // JSON storage
  json?: LocalJsonConfig;

  // Connection support
  connectionString?: string;
  options?: Record<string, any>;
}

export interface WorkspaceConfig {
  workspaces?: Record<string, StorageConfig>;
  defaultWorkspace?: string;
}

export interface GitSyncStatus {
  status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'error';
  localCommits?: number;
  remoteCommits?: number;
  lastSync?: string;
  error?: string;
}
