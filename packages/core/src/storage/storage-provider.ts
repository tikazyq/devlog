/**
 * Abstract storage interface that supports different storage backends
 */

import { DevlogEntry, DevlogFilter, DevlogStats } from "@devlog/types";

export interface StorageProvider {
  /**
   * Initialize the storage backend
   */
  initialize(): Promise<void>;

  /**
   * Check if an entry exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get a single devlog entry by ID
   */
  get(id: string): Promise<DevlogEntry | null>;

  /**
   * Save or update a devlog entry
   */
  save(entry: DevlogEntry): Promise<void>;

  /**
   * Delete a devlog entry
   */
  delete(id: string): Promise<void>;

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
}

export interface StorageConfig {
  type: "sqlite" | "postgres" | "mysql";
  connectionString?: string;
  filePath?: string;
  options?: Record<string, any>;
}

/**
 * Factory for creating storage providers based on configuration
 */
export class StorageProviderFactory {
  static async create(config: StorageConfig): Promise<StorageProvider> {
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
}
