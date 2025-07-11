/**
 * Storage configuration and provider types
 */

import { DevlogEntry, DevlogFilter, DevlogId, DevlogStats, DevlogStatus, DevlogType, DevlogPriority } from './core.js';

// Storage Configuration Types
export type StorageType = 'json' | 'sqlite' | 'mysql' | 'postgres' | 'github';

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

export interface JsonConfig {
  directory?: string; // default: ".devlog/"
  filePattern?: string; // default: "{id:03d}-{slug}.json"
  minPadding?: number; // default: 3 (minimum padding for IDs in filenames)
  global?: boolean; // default: true (if true, uses a global directory, i.e. "~/.devlog", otherwise uses project root)
}

export interface GitHubStorageConfig {
  owner: string;           // Repository owner (user/org)
  repo: string;            // Repository name  
  token: string;           // GitHub Personal Access Token
  apiUrl?: string;         // For GitHub Enterprise (default: api.github.com)
  branch?: string;         // For repository-specific operations
  labelsPrefix?: string;   // Prefix for devlog labels (default: 'devlog')
  
  // Strategy for mapping devlog fields to GitHub features
  mapping?: {
    useNativeType?: boolean;      // Use GitHub's native 'type' field instead of labels (default: true)
    useNativeLabels?: boolean;    // Prefer GitHub's default labels over custom prefixes (default: true)
    useStateReason?: boolean;     // Use GitHub's state_reason for nuanced status (default: true)
    projectId?: number;           // GitHub Projects v2 ID for organizing devlog entries
    projectFieldMappings?: {      // Map devlog fields to project custom fields
      priority?: string;          // Project field name for priority
      status?: string;            // Project field name for status
      type?: string;              // Project field name for type (if not using native)
    };
  };
  
  rateLimit?: {
    requestsPerHour?: number;  // Default: 5000 (GitHub's limit)
    retryDelay?: number;       // Default: 1000ms
    maxRetries?: number;       // Default: 3
  };
  cache?: {
    enabled?: boolean;       // Default: true
    ttl?: number;           // Cache TTL in ms (default: 300000 = 5min)
  };
}

export interface StorageConfig {
  type: StorageType;

  // JSON storage config
  json?: JsonConfig;

  // GitHub storage config
  github?: GitHubStorageConfig;

  // Database connection config
  connectionString?: string;
  options?: Record<string, any>;
}

export interface GitSyncStatus {
  status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'error';
  localCommits?: number;
  remoteCommits?: number;
  lastSync?: string;
  error?: string;
}

// Storage Provider Interface
export interface StorageProvider {
  /**
   * Initialize the storage backend
   */
  initialize(): Promise<void>;

  /**
   * Check if an entry exists
   */
  exists(id: DevlogId): Promise<boolean>;

  /**
   * Get a single devlog entry by ID
   */
  get(id: DevlogId): Promise<DevlogEntry | null>;

  /**
   * Save or update a devlog entry
   */
  save(entry: DevlogEntry): Promise<void>;

  /**
   * Delete a devlog entry
   */
  delete(id: DevlogId): Promise<void>;

  /**
   * List all devlog entries with optional filtering
   */
  list(filter?: DevlogFilter): Promise<DevlogEntry[]>;

  /**
   * Search devlog entries by text query
   */
  search(query: string): Promise<DevlogEntry[]>;

  /**
   * Get statistics about devlog entries
   */
  getStats(): Promise<DevlogStats>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Get the next available ID for a new entry
   */
  getNextId(): Promise<DevlogId>;
}

// Internal Storage Index Types (for JSON storage implementation)
export interface DevlogIndex {
  entries: Record<string, DevlogIndexEntry>;
  lastId: number;
  version: string;
}

export interface DevlogIndexEntry {
  filename: string;
  title: string;
  status: DevlogStatus;
  type: DevlogType;
  priority: DevlogPriority;
  createdAt: string;
  updatedAt: string;
}

// Configuration Types
export interface DevlogConfig {
  // Traditional single workspace mode (backward compatibility)
  storage?: StorageConfig;
  
  // TODO: Uncomment when integrations are implemented
  // integrations?: EnterpriseIntegration;
  // syncStrategy?: SyncStrategy;
}

export interface DevlogManagerOptions {
  workspaceRoot?: string;
  workspace?: string; // Workspace name to use
  storage?: StorageConfig; // Direct storage config (fallback for backward compatibility)
  // integrations?: EnterpriseIntegration;
  // syncStrategy?: SyncStrategy;
}
