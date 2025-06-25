/**
 * Hybrid storage provider that combines git-based JSON storage with local SQLite cache
 * Provides the best of both worlds: git synchronization and fast local queries
 */

import { DevlogEntry, DevlogFilter, DevlogStats, DevlogId, GitStorageConfig, LocalCacheConfig, GitSyncStatus, ConflictResolution } from "@devlog/types";
import { StorageProvider } from "./storage-provider.js";
import { GitStorageProvider } from "./git-storage-provider.js";
import { SQLiteStorageProvider } from "./sqlite-storage.js";

export class HybridStorageProvider implements StorageProvider {
  private gitStorage: GitStorageProvider;
  private cacheStorage: SQLiteStorageProvider;
  private gitConfig: GitStorageConfig;
  private cacheConfig: LocalCacheConfig;
  private syncInProgress = false;

  constructor(gitConfig: GitStorageConfig, cacheConfig: LocalCacheConfig) {
    this.gitConfig = gitConfig;
    this.cacheConfig = cacheConfig;
    
    this.gitStorage = new GitStorageProvider(gitConfig);
    this.cacheStorage = new SQLiteStorageProvider(cacheConfig.filePath);
  }

  async initialize(): Promise<void> {
    // Initialize both storage providers
    await Promise.all([
      this.gitStorage.initialize(),
      this.cacheStorage.initialize()
    ]);
    
    // Sync from git to cache if cache is empty
    await this.syncFromGitToCache();
  }

  async exists(id: DevlogId): Promise<boolean> {
    // Check cache first for speed
    const existsInCache = await this.cacheStorage.exists(id);
    
    if (existsInCache) {
      return true;
    }
    
    // Fallback to git storage
    return this.gitStorage.exists(id);
  }

  async get(id: DevlogId): Promise<DevlogEntry | null> {
    // Try cache first
    let entry = await this.cacheStorage.get(id);
    
    if (!entry) {
      // Fallback to git storage
      entry = await this.gitStorage.get(id);
      
      // Cache the entry if found
      if (entry) {
        await this.cacheStorage.save(entry);
      }
    }
    
    return entry;
  }

  async save(entry: DevlogEntry): Promise<void> {
    // Save to both storages
    await Promise.all([
      this.gitStorage.save(entry),
      this.cacheStorage.save(entry)
    ]);
  }

  async delete(id: DevlogId): Promise<void> {
    // Delete from both storages
    await Promise.all([
      this.gitStorage.delete(id),
      this.cacheStorage.delete(id)
    ]);
  }

  async list(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    // Use cache for listing (much faster)
    return this.cacheStorage.list(filter);
  }

  async search(query: string): Promise<DevlogEntry[]> {
    // Use cache for search (much faster with SQLite FTS)
    return this.cacheStorage.search(query);
  }

  async getStats(): Promise<DevlogStats> {
    // Use cache for stats (faster aggregation)
    return this.cacheStorage.getStats();
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.gitStorage.dispose(),
      this.cacheStorage.dispose()
    ]);
  }

  isRemoteStorage(): boolean {
    return true;
  }

  isGitBased(): boolean {
    return true;
  }

  // Git-specific methods delegate to git storage
  async clone(repository: string, branch?: string): Promise<void> {
    await this.gitStorage.clone(repository, branch);
    // Re-sync cache after clone
    await this.syncFromGitToCache();
  }

  async pull(): Promise<void> {
    await this.gitStorage.pull();
    // Sync changes to cache
    await this.syncFromGitToCache();
  }

  async push(message: string): Promise<void> {
    await this.gitStorage.push(message);
  }

  async getRemoteStatus(): Promise<GitSyncStatus> {
    return this.gitStorage.getRemoteStatus();
  }

  async resolveConflicts(strategy: ConflictResolution): Promise<void> {
    await this.gitStorage.resolveConflicts(strategy);
    // Re-sync cache after conflict resolution
    await this.syncFromGitToCache();
  }

  // Hybrid-specific methods
  async syncFromGitToCache(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;
    
    try {
      console.log("Syncing from git to cache...");
      
      // Get all entries from git storage
      const gitEntries = await this.gitStorage.list();
      const cacheEntries = await this.cacheStorage.list();
      
      // Create maps for efficient comparison
      const gitMap = new Map(gitEntries.map(e => [e.id, e]));
      const cacheMap = new Map(cacheEntries.map(e => [e.id, e]));
      
      // Find entries to add/update in cache
      const toAddOrUpdate: DevlogEntry[] = [];
      const toDelete: DevlogId[] = [];
      
      for (const [id, gitEntry] of gitMap) {
        const cacheEntry = cacheMap.get(id);
        
        if (!cacheEntry || gitEntry.updatedAt > cacheEntry.updatedAt) {
          toAddOrUpdate.push(gitEntry);
        }
      }
      
      // Find entries to delete from cache (exist in cache but not in git)
      for (const [id] of cacheMap) {
        if (!gitMap.has(id)) {
          toDelete.push(id);
        }
      }
      
      // Apply changes to cache
      console.log(`Syncing: ${toAddOrUpdate.length} to add/update, ${toDelete.length} to delete`);
      
      for (const entry of toAddOrUpdate) {
        await this.cacheStorage.save(entry);
      }
      
      for (const id of toDelete) {
        await this.cacheStorage.delete(id);
      }
      
      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Failed to sync from git to cache:", error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncFromCacheToGit(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;
    
    try {
      console.log("Syncing from cache to git...");
      
      // Get all entries from cache
      const cacheEntries = await this.cacheStorage.list();
      
      // Save each entry to git storage
      for (const entry of cacheEntries) {
        await this.gitStorage.save(entry);
      }
      
      console.log(`Synced ${cacheEntries.length} entries from cache to git`);
    } catch (error) {
      console.error("Failed to sync from cache to git:", error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  async forceSyncBothDirections(): Promise<void> {
    await this.syncFromGitToCache();
    await this.syncFromCacheToGit();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    gitEntries: number;
    cacheEntries: number;
    lastSync: string;
    needsSync: boolean;
  }> {
    const [gitStats, cacheStats] = await Promise.all([
      this.gitStorage.getStats(),
      this.cacheStorage.getStats()
    ]);
    
    return {
      gitEntries: gitStats.totalEntries,
      cacheEntries: cacheStats.totalEntries,
      lastSync: new Date().toISOString(), // TODO: Track actual last sync time
      needsSync: gitStats.totalEntries !== cacheStats.totalEntries
    };
  }
}
