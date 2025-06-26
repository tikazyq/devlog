/**
 * Abstract storage interface that supports different storage backends
 */

import { DevlogEntry, DevlogFilter, DevlogId, DevlogStats, StorageConfig } from '@devlog/types';

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
   * Get the next available ID for a new entry
   */
  getNextId?(): Promise<DevlogId>;
}

/**
 * Factory for creating storage providers based on configuration
 */
export class StorageProviderFactory {
  static async create(config: StorageConfig): Promise<StorageProvider> {
    // Handle new storage strategies
    switch (config.type) {
      case 'sqlite':
        const { SQLiteStorageProvider } = await import('./sqlite-storage.js');
        return new SQLiteStorageProvider(config.connectionString || ':memory:', config.options);

      case 'postgres':
        const { PostgreSQLStorageProvider } = await import('./postgresql-storage.js');
        return new PostgreSQLStorageProvider(config.connectionString!, config.options);

      case 'mysql':
        const { MySQLStorageProvider } = await import('./mysql-storage.js');
        return new MySQLStorageProvider(config.connectionString!, config.options);

      case 'json':
      default:
        const { JsonStorageProvider } = await import('./json-storage');
        return new JsonStorageProvider(config.json || {});
    }
  }
}
