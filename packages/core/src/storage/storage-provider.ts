/**
 * Abstract storage interface that supports different storage backends
 */

import { DevlogEntry, DevlogFilter, DevlogStats, DevlogId, GitSyncStatus, ConflictResolution, StorageConfig } from "@devlog/types";

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
  dispose(): Promise<void>;

  /**
   * Check if this storage provider can handle enterprise-managed entries
   */
  isRemoteStorage(): boolean;

  /**
   * Check if the storage provider supports git operations
   */
  isGitBased(): boolean;

  // Git-specific methods (optional - only implemented by git storage providers)
  
  /**
   * Clone a git repository for storage
   */
  clone?(repository: string, branch?: string): Promise<void>;

  /**
   * Pull latest changes from remote repository
   */
  pull?(): Promise<void>;

  /**
   * Push local changes to remote repository
   */
  push?(message: string): Promise<void>;

  /**
   * Get current sync status with remote repository
   */
  getRemoteStatus?(): Promise<GitSyncStatus>;

  /**
   * Resolve conflicts with remote repository
   */
  resolveConflicts?(strategy: ConflictResolution): Promise<void>;
}

/**
 * Factory for creating storage providers based on configuration
 */
export class StorageProviderFactory {
  static async create(config: StorageConfig): Promise<StorageProvider> {
    // Handle legacy configurations
    if (config.type) {
      switch (config.type) {
        case "sqlite":
          const { SQLiteStorageProvider } = await import("./sqlite-storage.js");
          return new SQLiteStorageProvider(config.filePath || ":memory:", config.options);

        case "postgres":
          const { PostgreSQLStorageProvider } = await import("./postgresql-storage.js");
          return new PostgreSQLStorageProvider(config.connectionString!, config.options);

        case "mysql":
          const { MySQLStorageProvider } = await import("./mysql-storage.js");
          return new MySQLStorageProvider(config.connectionString!, config.options);

        default:
          throw new Error(`Unsupported storage type: ${config.type}`);
      }
    }

    // Handle new storage strategies
    switch (config.strategy) {
      case "local-sqlite":
        const { SQLiteStorageProvider } = await import("./sqlite-storage.js");
        return new SQLiteStorageProvider(
          config.sqlite?.filePath || ":memory:", 
          config.sqlite?.options
        );

      case "git-json":
        if (!config.git) {
          throw new Error("Git configuration is required for git-json strategy");
        }
        const { GitStorageProvider } = await import("./git-storage-provider.js");
        return new GitStorageProvider(config.git);

      case "hybrid-git":
        if (!config.git) {
          throw new Error("Git configuration is required for hybrid-git strategy");
        }
        if (!config.cache) {
          throw new Error("Cache configuration is required for hybrid-git strategy");
        }
        const { HybridStorageProvider } = await import("./hybrid-storage-provider.js");
        return new HybridStorageProvider(config.git, config.cache);

      default:
        throw new Error(`Unsupported storage strategy: ${config.strategy}`);
    }
  }
}
