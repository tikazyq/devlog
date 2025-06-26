/**
 * Git-based storage provider for devlog entries
 * Stores entries as JSON files in .devlog/ folder within a git repository
 */

import {
  ConflictResolution,
  DevlogEntry,
  DevlogFilter,
  DevlogId,
  DevlogStats,
  GitStorageConfig,
  GitSyncStatus,
} from '@devlog/types';
import { StorageProvider } from './storage-provider.js';
import { GitOperations } from '../utils/git-operations.js';
import { ConflictResolver } from '../utils/conflict-resolver.js';
import { RepositoryStructure } from '../utils/repository-structure.js';
import { GitRepositoryManager } from '../utils/git-repository-manager.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class GitStorageProvider implements StorageProvider {
  private gitOps: GitOperations;
  private conflictResolver: ConflictResolver;
  private repoStructure: RepositoryStructure;
  private repoManager: GitRepositoryManager;
  private config: GitStorageConfig;
  private repositoryPath: string;
  private initialized = false;

  constructor(config: GitStorageConfig) {
    this.config = {
      branch: 'main',
      path: '.devlog/',
      autoSync: true,
      conflictResolution: 'timestamp-wins',
      ...config,
    };

    // Repository will be cloned to a temp directory or specified path
    this.repositoryPath = this.getRepositoryPath();

    this.gitOps = new GitOperations(this.repositoryPath, this.config);
    this.conflictResolver = new ConflictResolver();
    this.repoStructure = new RepositoryStructure(this.repositoryPath, this.config);
    this.repoManager = new GitRepositoryManager(this.config);
  }

  private getRepositoryPath(): string {
    // Extract repo name from repository URL/path
    const repoName = this.config.repository.split('/').pop()?.replace('.git', '') || 'devlog';
    return path.join(
      process.env.HOME || process.env.USERPROFILE || '/tmp',
      '.devlog',
      'repos',
      repoName,
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if repository exists locally
      const repoExists = await this.repositoryExists();

      if (!repoExists) {
        // Clone the repository
        await this.clone(this.config.repository, this.config.branch);
      } else {
        // Pull latest changes
        await this.pull();
      }

      // Ensure .devlog directory structure exists
      await this.repoStructure.initialize();

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize git storage: ${error}`);
    }
  }

  private async repositoryExists(): Promise<boolean> {
    try {
      await fs.access(path.join(this.repositoryPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: DevlogId): Promise<boolean> {
    const entryPath = await this.repoStructure.getEntryPathById(id);
    if (!entryPath) return false;

    try {
      await fs.access(entryPath);
      return true;
    } catch {
      return false;
    }
  }

  async get(id: DevlogId): Promise<DevlogEntry | null> {
    const entryPath = await this.repoStructure.getEntryPathById(id);
    if (!entryPath) return null;

    try {
      const content = await fs.readFile(entryPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async save(entry: DevlogEntry): Promise<void> {
    const entryPath = this.repoStructure.getEntryPath(entry);

    // Write entry to JSON file
    await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));

    // Update index
    await this.repoStructure.updateIndex(entry);

    // Auto-sync if enabled
    if (this.config.autoSync) {
      await this.push(`Update devlog entry ${entry.id}: ${entry.title}`);
    }
  }

  async delete(id: DevlogId): Promise<void> {
    const entryPath = await this.repoStructure.getEntryPathById(id);
    if (!entryPath) {
      throw new Error(`Entry ${id} not found`);
    }

    try {
      await fs.unlink(entryPath);
      await this.repoStructure.removeFromIndex(id);

      // Auto-sync if enabled
      if (this.config.autoSync) {
        await this.push(`Delete devlog entry ${id}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete entry ${id}: ${error}`);
    }
  }

  async list(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    const entries: DevlogEntry[] = [];

    try {
      const files = await this.repoStructure.listEntryFiles();

      for (const file of files) {
        const filePath = path.join(this.repositoryPath, this.config.path!, 'entries', file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = JSON.parse(content);

          if (this.matchesFilter(entry, filter)) {
            entries.push(entry);
          }
        } catch (error) {
          console.warn(`Failed to read entry file ${file}:`, error);
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }

    return entries.sort((a, b) => b.id - a.id);
  }

  async search(query: string): Promise<DevlogEntry[]> {
    const allEntries = await this.list();
    const lowerQuery = query.toLowerCase();

    return allEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.notes.some((note) => note.content.toLowerCase().includes(lowerQuery)) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  async getStats(): Promise<DevlogStats> {
    const entries = await this.list();

    const stats: DevlogStats = {
      totalEntries: entries.length,
      byStatus: {} as any,
      byType: {} as any,
      byPriority: {} as any,
    };

    entries.forEach((entry) => {
      stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1;
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      stats.byPriority[entry.priority] = (stats.byPriority[entry.priority] || 0) + 1;
    });

    return stats;
  }

  async dispose(): Promise<void> {
    // Git repositories are persistent, no cleanup needed
  }

  isRemoteStorage(): boolean {
    return true;
  }

  isGitBased(): boolean {
    return true;
  }

  // Git-specific methods
  async clone(repository: string, branch?: string): Promise<void> {
    await this.gitOps.clone(repository, branch || this.config.branch);
  }

  async pull(): Promise<void> {
    await this.gitOps.pull();
  }

  async push(message: string): Promise<void> {
    await this.gitOps.push(message);
  }

  async getRemoteStatus(): Promise<GitSyncStatus> {
    return this.gitOps.getStatus();
  }

  async resolveConflicts(strategy: ConflictResolution): Promise<void> {
    await this.conflictResolver.resolveConflicts(strategy, this.repositoryPath);
  }

  private matchesFilter(entry: DevlogEntry, filter?: DevlogFilter): boolean {
    if (!filter) return true;

    if (filter.status && !filter.status.includes(entry.status)) return false;
    if (filter.type && !filter.type.includes(entry.type)) return false;
    if (filter.priority && !filter.priority.includes(entry.priority)) return false;
    if (filter.assignee && entry.assignee !== filter.assignee) return false;
    if (filter.tags && !filter.tags.some((tag) => entry.tags.includes(tag))) return false;

    if (filter.fromDate && entry.createdAt < filter.fromDate) return false;
    if (filter.toDate && entry.createdAt > filter.toDate) return false;

    return true;
  }
}
