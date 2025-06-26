/**
 * Local JSON storage provider - stores devlog entries as JSON files in project's .devlog/ directory
 * This replaces the complex git-based storage with a simple file-based approach that leverages
 * the project's existing git repository for versioning and collaboration.
 */

import type {
  DevlogEntry,
  DevlogFilter,
  DevlogId,
  DevlogPriority,
  DevlogStats,
  DevlogStatus,
  DevlogType,
  JsonConfig,
} from '@devlog/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import { StorageProvider } from './storage-provider.js';
import { getDevlogDirFromJsonConfig } from '../utils/storage.js';

export class JsonStorageProvider implements StorageProvider {
  private readonly config: Required<JsonConfig>;
  private readonly devlogDir: string;
  private readonly entriesDir: string;
  private readonly indexPath: string;
  private initialized = false;

  constructor(config: JsonConfig = {}) {
    this.config = {
      directory: config.directory || '.devlog',
      filePattern: config.filePattern || '{id:auto}-{slug}.json',
      minPadding: config.minPadding || 3,
      global: config.global !== undefined ? config.global : true, // Default to true for global storage
    };

    this.devlogDir = getDevlogDirFromJsonConfig(this.config);
    this.entriesDir = path.join(this.devlogDir, 'entries');
    this.indexPath = path.join(this.devlogDir, 'index.json');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create .devlog directory structure
    await fs.mkdir(this.devlogDir, { recursive: true });
    await fs.mkdir(this.entriesDir, { recursive: true });

    // Create index file if it doesn't exist
    try {
      await fs.access(this.indexPath);
    } catch {
      await this.saveIndex({ entries: {}, lastId: 0, version: '1.0.0' });
    }

    // Create .gitignore if needed (to exclude cache files but include JSON files)
    await this.ensureGitignore();

    this.initialized = true;
  }

  async exists(id: DevlogId): Promise<boolean> {
    const index = await this.loadIndex();
    return id.toString() in index.entries;
  }

  async get(id: DevlogId): Promise<DevlogEntry | null> {
    const index = await this.loadIndex();
    const entryInfo = index.entries[id.toString()];

    if (!entryInfo) return null;

    try {
      const filePath = path.join(this.entriesDir, entryInfo.filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async save(entry: DevlogEntry): Promise<void> {
    await this.initialize();

    // New entry if it doesn't have an ID
    if (!entry.id) {
      entry.id = await this.getNextId();
    }

    const index = await this.loadIndex();
    const slug = this.createSlug(entry.title);
    const filename = this.generateFilename(entry.id, slug, index.lastId);

    const filePath = path.join(this.entriesDir, filename);

    // Save entry file
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));

    // Update index
    index.entries[entry.id.toString()] = {
      filename,
      title: entry.title,
      status: entry.status,
      type: entry.type,
      priority: entry.priority,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };

    // Update lastId if this is a new entry
    if (entry.id > index.lastId) {
      index.lastId = entry.id;
    }

    await this.saveIndex(index);
  }

  async delete(id: DevlogId): Promise<void> {
    const index = await this.loadIndex();
    const entryInfo = index.entries[id.toString()];

    if (entryInfo) {
      // Delete file
      const filePath = path.join(this.entriesDir, entryInfo.filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // File might not exist, continue
      }

      // Update index
      delete index.entries[id.toString()];
      await this.saveIndex(index);
    }
  }

  async list(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    const index = await this.loadIndex();
    const entries: DevlogEntry[] = [];

    for (const [id, entryInfo] of Object.entries(index.entries)) {
      // Apply basic filtering using index data first
      if (filter) {
        if (filter.status && !filter.status.includes(entryInfo.status)) continue;
        if (filter.type && !filter.type.includes(entryInfo.type)) continue;
        if (filter.priority && !filter.priority.includes(entryInfo.priority)) continue;
        if (filter.fromDate && entryInfo.createdAt < filter.fromDate) continue;
        if (filter.toDate && entryInfo.createdAt > filter.toDate) continue;
      }

      // Load full entry for more complex filtering
      const entry = await this.get(parseInt(id));
      if (entry) {
        // Apply additional filtering
        if (filter) {
          if (filter.assignee && entry.assignee !== filter.assignee) continue;
          if (filter.tags && !filter.tags.some((tag) => entry.tags.includes(tag))) continue;
        }

        entries.push(entry);
      }
    }

    // Sort by updated time (most recent first)
    return entries.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async search(query: string): Promise<DevlogEntry[]> {
    const entries = await this.list();
    const lowerQuery = query.toLowerCase();

    return entries.filter((entry) => {
      return (
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        entry.notes.some((note) => note.content.toLowerCase().includes(lowerQuery))
      );
    });
  }

  async getStats(): Promise<DevlogStats> {
    const index = await this.loadIndex();
    const entries = Object.values(index.entries);

    const byStatus = {} as Record<DevlogStatus, number>;
    const byType = {} as Record<DevlogType, number>;
    const byPriority = {} as Record<DevlogPriority, number>;

    entries.forEach((entry) => {
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      byPriority[entry.priority] = (byPriority[entry.priority] || 0) + 1;
    });

    return {
      totalEntries: entries.length,
      byStatus,
      byType,
      byPriority,
    };
  }

  async dispose(): Promise<void> {
    // No cleanup needed for file-based storage
  }

  /**
   * Get the next available ID for a new entry
   */
  async getNextId(): Promise<DevlogId> {
    const index = await this.loadIndex();
    return index.lastId + 1;
  }

  private async loadIndex(): Promise<DevlogIndex> {
    try {
      console.debug('Loading devlog index from', this.indexPath);
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Return default index if file doesn't exist
      return { entries: {}, lastId: 0, version: '1.0.0' };
    }
  }

  private async saveIndex(index: DevlogIndex): Promise<void> {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private async ensureGitignore(): Promise<void> {
    const gitignorePath = path.join(this.devlogDir, '.gitignore');
    const gitignoreContent = `# Devlog - exclude cache and temporary files, include JSON entries
*.tmp
*.cache
cache/
temp/

# Include JSON files and structure
!entries/
!*.json
`;

    try {
      await fs.access(gitignorePath);
    } catch {
      await fs.writeFile(gitignorePath, gitignoreContent);
    }
  }

  private generateFilename(id: number, slug: string, maxId: number): string {
    // Calculate required padding based on max ID to ensure consistent ordering
    const requiredDigits = Math.max(this.config.minPadding, maxId.toString().length);
    const paddedId = id.toString().padStart(requiredDigits, '0');

    return this.config.filePattern.replace('{id:auto}', paddedId).replace('{slug}', slug);
  }
}

interface DevlogIndex {
  entries: Record<string, DevlogIndexEntry>;
  lastId: number;
  version: string;
}

interface DevlogIndexEntry {
  filename: string;
  title: string;
  status: DevlogStatus;
  type: DevlogType;
  priority: DevlogPriority;
  createdAt: string;
  updatedAt: string;
}
