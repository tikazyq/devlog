/**
 * Storage configuration and provider types
 */

import { DevlogEntry, DevlogFilter, DevlogId, DevlogStats, DevlogStatus, DevlogType, DevlogPriority } from './core.js';

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

export interface JsonConfig {
  directory?: string; // default: ".devlog/"
  filePattern?: string; // default: "{id:03d}-{slug}.json"
  minPadding?: number; // default: 3 (minimum padding for IDs in filenames)
  global?: boolean; // default: true (if true, uses a global directory, i.e. "~/.devlog", otherwise uses project root)
}

export interface StorageConfig {
  type: StorageType;

  // JSON storage config
  json?: JsonConfig;

  // Database connection config
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
  storage: StorageConfig;
  // TODO: Uncomment when integrations are implemented
  // integrations?: EnterpriseIntegration;
  // syncStrategy?: SyncStrategy;
}

export interface DevlogManagerOptions {
  workspaceRoot?: string;
  storage?: StorageConfig;
  // integrations?: EnterpriseIntegration;
  // syncStrategy?: SyncStrategy;
}
