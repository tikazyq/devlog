/**
 * Repository structure management for devlog git storage
 * Handles .devlog/ folder organization, file naming, and metadata management
 */

import { DevlogEntry, DevlogId, GitStorageConfig } from "@devlog/types";
import * as path from "path";
import * as fs from "fs/promises";

export interface DevlogIndex {
  version: string;
  entries: Record<DevlogId, DevlogIndexEntry>;
  nextId: DevlogId;
  lastModified: string;
  createdAt: string;
  workspace?: string;
}

export interface DevlogIndexEntry {
  id: DevlogId;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  file: string;
  slug: string;
}

export interface DevlogMetadata {
  version: string;
  createdAt: string;
  lastModified: string;
  workspace: {
    name: string;
    description?: string;
    owner?: string;
  };
  statistics: {
    totalEntries: number;
    lastEntryId: DevlogId;
  };
}

export class RepositoryStructure {
  private repositoryPath: string;
  private config: GitStorageConfig;
  private devlogPath: string;
  private entriesPath: string;
  private metadataPath: string;
  private indexPath: string;
  private configPath: string;

  constructor(repositoryPath: string, config: GitStorageConfig) {
    this.repositoryPath = repositoryPath;
    this.config = config;
    this.devlogPath = path.join(repositoryPath, config.path || ".devlog");
    this.entriesPath = path.join(this.devlogPath, "entries");
    this.metadataPath = path.join(this.devlogPath, "metadata");
    this.indexPath = path.join(this.devlogPath, "index.json");
    this.configPath = path.join(this.devlogPath, "config.json");
  }

  /**
   * Initialize the complete .devlog directory structure
   */
  async initialize(workspaceName?: string): Promise<void> {
    try {
      // Create directory structure
      await fs.mkdir(this.devlogPath, { recursive: true });
      await fs.mkdir(this.entriesPath, { recursive: true });
      await fs.mkdir(this.metadataPath, { recursive: true });

      // Create index.json if it doesn't exist
      await this.ensureIndex(workspaceName);

      // Create metadata files
      await this.ensureMetadata(workspaceName);

      // Create repository config
      await this.ensureConfig();

      // Create .gitignore to exclude SQLite cache files
      await this.ensureGitIgnore();

      console.log(`Initialized devlog repository structure at ${this.devlogPath}`);
    } catch (error) {
      throw new Error(`Failed to initialize repository structure: ${error}`);
    }
  }

  /**
   * Generate a filename for a devlog entry
   */
  generateEntryFilename(entry: DevlogEntry): string {
    const paddedId = entry.id.toString().padStart(3, '0');
    const slug = this.generateSlug(entry.title);
    return `${paddedId}-${slug}.json`;
  }

  /**
   * Get the full path for an entry file
   */
  getEntryPath(entry: DevlogEntry): string {
    const filename = this.generateEntryFilename(entry);
    return path.join(this.entriesPath, filename);
  }

  /**
   * Get entry path by ID (requires reading index to get filename)
   */
  async getEntryPathById(id: DevlogId): Promise<string | null> {
    try {
      const index = await this.readIndex();
      const indexEntry = index.entries[id];
      if (!indexEntry) return null;
      
      return path.join(this.entriesPath, indexEntry.file);
    } catch {
      // Fallback to old naming convention
      const paddedId = id.toString().padStart(3, '0');
      return path.join(this.entriesPath, `${paddedId}-entry.json`);
    }
  }

  /**
   * Read the index.json file
   */
  async readIndex(): Promise<DevlogIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      throw new Error('Index file not found or corrupted');
    }
  }

  /**
   * Update the index.json file with entry information
   */
  async updateIndex(entry: DevlogEntry): Promise<void> {
    try {
      const index = await this.readIndex();
      const filename = this.generateEntryFilename(entry);
      
      index.entries[entry.id] = {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        status: entry.status,
        priority: entry.priority,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        file: filename,
        slug: this.generateSlug(entry.title)
      };
      
      index.lastModified = new Date().toISOString();
      index.nextId = Math.max(index.nextId, entry.id + 1);
      
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      throw new Error(`Failed to update index: ${error}`);
    }
  }

  /**
   * Remove entry from index
   */
  async removeFromIndex(id: DevlogId): Promise<void> {
    try {
      const index = await this.readIndex();
      delete index.entries[id];
      index.lastModified = new Date().toISOString();
      
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      throw new Error(`Failed to remove from index: ${error}`);
    }
  }

  /**
   * Get next available ID
   */
  async getNextId(): Promise<DevlogId> {
    try {
      const index = await this.readIndex();
      return index.nextId;
    } catch {
      return 1;
    }
  }

  /**
   * List all entry files in the entries directory
   */
  async listEntryFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.entriesPath);
      return files.filter(file => file.endsWith('.json')).sort();
    } catch {
      return [];
    }
  }

  /**
   * Check if the repository structure is properly initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.devlogPath);
      await fs.access(this.entriesPath);
      await fs.access(this.indexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate repository structure integrity
   */
  async validate(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check directories exist
      await fs.access(this.devlogPath);
      await fs.access(this.entriesPath);
    } catch {
      issues.push('Missing .devlog directory structure');
    }

    try {
      // Check index exists and is valid JSON
      const index = await this.readIndex();
      if (!index.version || !index.entries || !index.nextId) {
        issues.push('Invalid index.json structure');
      }
    } catch {
      issues.push('Missing or corrupted index.json');
    }

    // Check for orphaned files
    try {
      const files = await this.listEntryFiles();
      const index = await this.readIndex();
      
      for (const file of files) {
        const found = Object.values(index.entries).some(entry => entry.file === file);
        if (!found) {
          issues.push(`Orphaned entry file: ${file}`);
        }
      }
    } catch {
      // Non-critical
    }

    return { valid: issues.length === 0, issues };
  }

  // Private helper methods

  private async ensureIndex(workspaceName?: string): Promise<void> {
    try {
      await fs.access(this.indexPath);
    } catch {
      const initialIndex: DevlogIndex = {
        version: "1.0",
        entries: {},
        nextId: 1,
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        workspace: workspaceName
      };
      await fs.writeFile(this.indexPath, JSON.stringify(initialIndex, null, 2));
    }
  }

  private async ensureMetadata(workspaceName?: string): Promise<void> {
    const metadataFile = path.join(this.metadataPath, 'workspace-info.json');
    
    try {
      await fs.access(metadataFile);
    } catch {
      const metadata: DevlogMetadata = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        workspace: {
          name: workspaceName || 'devlog',
          description: 'Devlog workspace for development tracking'
        },
        statistics: {
          totalEntries: 0,
          lastEntryId: 0
        }
      };
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    }
  }

  private async ensureConfig(): Promise<void> {
    try {
      await fs.access(this.configPath);
    } catch {
      const config = {
        version: "1.0",
        storage: {
          type: this.config.repository ? "git-json" : "local-sqlite",
          repository: this.config.repository,
          branch: this.config.branch || "main"
        },
        features: {
          autoSync: this.config.autoSync !== false,
          conflictResolution: this.config.conflictResolution || "timestamp-wins"
        }
      };
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
  }

  private async ensureGitIgnore(): Promise<void> {
    const gitIgnorePath = path.join(this.repositoryPath, '.gitignore');
    const devlogIgnoreRules = [
      '',
      '# Devlog - exclude SQLite databases and local cache',
      '*.db',
      '*.db-*',
      '.devlog/cache/',
      '.devlog/temp/',
      '.devlog/local/',
      '',
      '# Keep JSON files and structure',
      '!.devlog/entries/',
      '!.devlog/*.json'
    ].join('\n');

    try {
      // Check if .gitignore exists
      const content = await fs.readFile(gitIgnorePath, 'utf-8');
      
      // Add devlog rules if not present
      if (!content.includes('# Devlog - exclude SQLite databases')) {
        await fs.writeFile(gitIgnorePath, content + devlogIgnoreRules);
      }
    } catch {
      // Create new .gitignore
      await fs.writeFile(gitIgnorePath, devlogIgnoreRules);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}
