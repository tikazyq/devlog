/**
 * JSON file storage provider for backward compatibility
 * This is similar to the existing FileSystemStorage but implements the new interface
 */

import * as fs from "fs/promises";
import * as path from "path";
import { DevlogEntry, DevlogFilter, DevlogStats, DevlogStatus, DevlogType, DevlogPriority } from "@devlog/types";
import { StorageProvider } from "./storage-provider.js";

export class JSONStorageProvider implements StorageProvider {
  private devlogDir: string;
  private indexFile: string;
  private options: Record<string, any>;

  constructor(devlogDir: string, options: Record<string, any> = {}) {
    this.devlogDir = devlogDir;
    this.indexFile = path.join(this.devlogDir, "index.json");
    this.options = options;
  }

  async initialize(): Promise<void> {
    await this.ensureDevlogDir();
  }

  async exists(id: string): Promise<boolean> {
    const index = await this.loadIndex();
    return id in index;
  }

  async get(id: string): Promise<DevlogEntry | null> {
    try {
      const index = await this.loadIndex();
      const filename = index[id];
      if (!filename) return null;

      const filePath = path.join(this.devlogDir, filename);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async save(entry: DevlogEntry): Promise<void> {
    await this.ensureDevlogDir();
    
    const filename = `${entry.id}.json`;
    const filePath = path.join(this.devlogDir, filename);
    
    // Update the index
    const index = await this.loadIndex();
    index[entry.id] = filename;
    await this.saveIndex(index);
    
    // Save the devlog entry
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  async delete(id: string): Promise<void> {
    // Remove from index
    const index = await this.loadIndex();
    const filename = index[id];
    delete index[id];
    await this.saveIndex(index);

    // Delete the file
    if (filename) {
      const filePath = path.join(this.devlogDir, filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // File might not exist, continue
      }
    }
  }

  async list(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    const index = await this.loadIndex();
    const entries: DevlogEntry[] = [];

    for (const [id, filename] of Object.entries(index)) {
      try {
        const filePath = path.join(this.devlogDir, filename);
        const data = await fs.readFile(filePath, "utf-8");
        const entry = JSON.parse(data) as DevlogEntry;
        
        if (this.matchesFilter(entry, filter)) {
          entries.push(entry);
        }
      } catch {
        // Skip corrupted files
        continue;
      }
    }

    // Sort by updated date, newest first
    entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return entries;
  }

  async search(query: string): Promise<DevlogEntry[]> {
    const allEntries = await this.list();
    const lowerQuery = query.toLowerCase();
    
    return allEntries.filter(entry => 
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.notes.some(note => note.content.toLowerCase().includes(lowerQuery)) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getStats(): Promise<DevlogStats> {
    const entries = await this.list();
    
    const byStatus: Record<DevlogStatus, number> = {
      todo: 0,
      "in-progress": 0,
      review: 0,
      testing: 0,
      done: 0,
      archived: 0
    };

    const byType: Record<DevlogType, number> = {
      feature: 0,
      bugfix: 0,
      task: 0,
      refactor: 0,
      docs: 0
    };

    const byPriority: Record<DevlogPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    entries.forEach(entry => {
      byStatus[entry.status]++;
      byType[entry.type]++;
      byPriority[entry.priority]++;
    });

    return {
      totalEntries: entries.length,
      byStatus,
      byType,
      byPriority
    };
  }

  async dispose(): Promise<void> {
    // No cleanup needed for JSON storage
  }

  isRemoteStorage(): boolean {
    return false;
  }

  // Private helper methods

  private async ensureDevlogDir(): Promise<void> {
    try {
      await fs.access(this.devlogDir);
    } catch {
      await fs.mkdir(this.devlogDir, { recursive: true });
    }
  }

  private async loadIndex(): Promise<Record<string, string>> {
    try {
      await this.ensureDevlogDir();
      const data = await fs.readFile(this.indexFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async saveIndex(index: Record<string, string>): Promise<void> {
    await this.ensureDevlogDir();
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
  }

  private matchesFilter(entry: DevlogEntry, filter?: DevlogFilter): boolean {
    if (!filter) return true;

    if (filter.status && filter.status.length > 0 && !filter.status.includes(entry.status)) {
      return false;
    }

    if (filter.type && filter.type.length > 0 && !filter.type.includes(entry.type)) {
      return false;
    }

    if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(entry.priority)) {
      return false;
    }

    if (filter.assignee && entry.assignee !== filter.assignee) {
      return false;
    }

    if (filter.fromDate && new Date(entry.createdAt) < new Date(filter.fromDate)) {
      return false;
    }

    if (filter.toDate && new Date(entry.createdAt) > new Date(filter.toDate)) {
      return false;
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => entry.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }
}
