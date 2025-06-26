/**
 * Abstract storage interface that supports different storage backends
 */

import {
  ConflictResolution,
  DevlogEntry,
  DevlogFilter,
  DevlogId,
  DevlogStats,
  GitSyncStatus,
  StorageConfig,
} from '@devlog/types';
import * as path from 'path';
import * as fs from 'fs/promises';

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

  /**
   * Get the next available ID for a new entry
   */
  getNextId?(): Promise<DevlogId>;

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
        const { LocalJsonStorageProvider } = await import('./local-json-storage.js');
        const projectRoot = await findProjectRoot();
        if (!projectRoot) {
          throw new Error(
            'Could not detect project root. Please run from within a project directory or specify the path explicitly.',
          );
        }
        return new LocalJsonStorageProvider(projectRoot, config.json || {});
    }
  }
}

/**
 * Find the project root directory by looking for common project indicators
 * @param startPath Starting directory (defaults to current working directory)
 * @returns The project root path or null if not found
 */
export async function findProjectRoot(startPath: string = process.cwd()): Promise<string | null> {
  let currentDir = path.resolve(startPath);

  while (currentDir !== path.dirname(currentDir)) {
    // Check for strong monorepo indicators first (these take priority)
    const strongIndicators = [
      path.join(currentDir, 'pnpm-workspace.yaml'),
      path.join(currentDir, 'lerna.json'),
      path.join(currentDir, 'nx.json'),
      path.join(currentDir, 'rush.json'),
    ];

    for (const indicator of strongIndicators) {
      try {
        await fs.access(indicator);
        return currentDir;
      } catch {
        // Continue checking
      }
    }

    // Check for devlog-specific config
    try {
      await fs.access(path.join(currentDir, 'devlog.config.json'));
      return currentDir;
    } catch {
      // Continue checking
    }

    // Check for git root (but continue searching if we find a monorepo indicator later)
    const gitDir = path.join(currentDir, '.git');
    let gitRoot: string | null = null;
    try {
      await fs.access(gitDir);
      gitRoot = currentDir;
    } catch {
      // Continue checking
    }

    // Check if this directory contains workspace packages
    const packagesDir = path.join(currentDir, 'packages');
    try {
      await fs.access(packagesDir);
      const packagesStat = await fs.stat(packagesDir);
      if (packagesStat.isDirectory()) {
        // This looks like a monorepo root
        return currentDir;
      }
    } catch {
      // Continue checking
    }

    // If we found a git root but no strong indicators, use it as fallback
    if (gitRoot) {
      // Look ahead to see if there's a monorepo indicator in parent directories
      let tempDir = path.dirname(currentDir);
      let foundMonorepoAbove = false;

      while (tempDir !== path.dirname(tempDir)) {
        for (const indicator of strongIndicators) {
          try {
            await fs.access(path.join(tempDir, indicator));
            foundMonorepoAbove = true;
            break;
          } catch {
            // Continue checking
          }
        }
        if (foundMonorepoAbove) break;
        tempDir = path.dirname(tempDir);
      }

      // If no monorepo found above, use git root
      if (!foundMonorepoAbove) {
        return gitRoot;
      }
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}
