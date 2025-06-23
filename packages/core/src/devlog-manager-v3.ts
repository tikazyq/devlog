/**
 * New DevlogManager that uses the storage provider abstraction
 * This replaces the existing DevlogManager with a more flexible architecture
 */

import * as crypto from "crypto";
import { 
  DevlogEntry, 
  DevlogNote, 
  CreateDevlogRequest,
  UpdateDevlogRequest,
  DevlogFilter,
  DevlogStats,
  DevlogStatus,
  DevlogType,
  DevlogPriority,
  EnterpriseIntegration
} from "@devlog/types";

import { StorageProvider, StorageConfig, StorageProviderFactory } from "./storage/storage-provider.js";

export interface NewDevlogManagerOptions {
  workspaceRoot?: string;
  storage?: StorageConfig;
  integrations?: EnterpriseIntegration;
}

export class NewDevlogManager {
  private storageProvider!: StorageProvider;
  private workspaceRoot: string;
  private integrations?: EnterpriseIntegration;
  private initialized = false;

  constructor(private options: NewDevlogManagerOptions = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.integrations = options.integrations;
  }

  /**
   * Initialize the storage provider based on configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const storageConfig = this.determineStorageConfig();
    this.storageProvider = await StorageProviderFactory.create(storageConfig);
    await this.storageProvider.initialize();
    this.initialized = true;
  }

  /**
   * Create a new devlog entry or find existing one with same title and type
   */
  async findOrCreateDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const id = this.generateId(request.title, request.type);
    
    // Check if entry already exists
    const existing = await this.storageProvider.get(id);
    if (existing) {
      return existing;
    }

    // Create new entry
    const now = new Date().toISOString();
    const entry: DevlogEntry = {
      id,
      title: request.title,
      type: request.type,
      description: request.description,
      status: "todo" as DevlogStatus,
      priority: request.priority || "medium",
      createdAt: now,
      updatedAt: now,
      estimatedHours: request.estimatedHours,
      assignee: request.assignee,
      tags: request.tags || [],
      notes: [],
      files: [],
      relatedDevlogs: [],
      context: {
        businessContext: request.businessContext || "",
        technicalContext: request.technicalContext || "",
        dependencies: [],
        decisions: [],
        acceptanceCriteria: request.acceptanceCriteria || [],
        risks: []
      },
      aiContext: {
        currentSummary: "",
        keyInsights: request.initialInsights || [],
        openQuestions: [],
        relatedPatterns: request.relatedPatterns || [],
        suggestedNextSteps: [],
        lastAIUpdate: now,
        contextVersion: 1
      }
    };

    await this.storageProvider.save(entry);
    return entry;
  }

  /**
   * Get a devlog entry by ID
   */
  async getDevlog(id: string): Promise<DevlogEntry | null> {
    await this.ensureInitialized();
    return await this.storageProvider.get(id);
  }

  /**
   * Update an existing devlog entry
   */
  async updateDevlog(request: UpdateDevlogRequest): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(request.id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${request.id}' not found`);
    }

    const updated: DevlogEntry = {
      ...existing,
      updatedAt: new Date().toISOString()
    };

    // Update basic fields
    if (request.title !== undefined) updated.title = request.title;
    if (request.description !== undefined) updated.description = request.description;
    if (request.status !== undefined) updated.status = request.status;
    if (request.priority !== undefined) updated.priority = request.priority;
    if (request.estimatedHours !== undefined) updated.estimatedHours = request.estimatedHours;
    if (request.actualHours !== undefined) updated.actualHours = request.actualHours;
    if (request.assignee !== undefined) updated.assignee = request.assignee;
    if (request.tags !== undefined) updated.tags = request.tags;
    if (request.files !== undefined) updated.files = request.files;

    // Add progress note if provided
    if (request.progress) {
      const note: DevlogNote = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        category: request.noteCategory || "progress",
        content: request.progress,
        files: request.files,
        codeChanges: request.codeChanges
      };
      updated.notes.push(note);
    }

    await this.storageProvider.save(updated);
    return updated;
  }

  /**
   * Add a note to a devlog entry
   */
  async addNote(id: string, content: string, category: DevlogNote["category"] = "progress"): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${id}' not found`);
    }

    const note: DevlogNote = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category,
      content
    };

    const updated: DevlogEntry = {
      ...existing,
      notes: [...existing.notes, note],
      updatedAt: new Date().toISOString()
    };

    await this.storageProvider.save(updated);
    return updated;
  }

  /**
   * List devlog entries with optional filtering
   */
  async listDevlogs(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    await this.ensureInitialized();
    return await this.storageProvider.list(filter);
  }

  /**
   * Search devlog entries
   */
  async searchDevlogs(query: string): Promise<DevlogEntry[]> {
    await this.ensureInitialized();
    return await this.storageProvider.search(query);
  }

  /**
   * Get devlog statistics
   */
  async getStats(): Promise<DevlogStats> {
    await this.ensureInitialized();
    return await this.storageProvider.getStats();
  }

  /**
   * Delete a devlog entry
   */
  async deleteDevlog(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.storageProvider.delete(id);
  }

  /**
   * Complete a devlog entry and archive it
   */
  async completeDevlog(id: string, summary?: string): Promise<DevlogEntry> {
    const updated = await this.updateDevlog({
      id,
      status: "done"
    });

    if (summary) {
      return await this.addNote(id, `Completed: ${summary}`, "progress");
    }

    return updated;
  }

  /**
   * Get AI context for a devlog entry
   */
  async getContextForAI(id: string): Promise<DevlogEntry | null> {
    await this.ensureInitialized();
    return await this.storageProvider.get(id);
  }

  /**
   * Update AI context for a devlog entry
   */
  async updateAIContext(id: string, context: Partial<DevlogEntry["aiContext"]>): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${id}' not found`);
    }

    const updated: DevlogEntry = {
      ...existing,
      aiContext: {
        ...existing.aiContext,
        ...context
      },
      updatedAt: new Date().toISOString()
    };

    await this.storageProvider.save(updated);
    return updated;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.storageProvider) {
      await this.storageProvider.dispose();
    }
  }

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private determineStorageConfig(): StorageConfig {
    if (this.options.storage) {
      return this.options.storage;
    }

    // Determine storage type based on configuration
    if (this.integrations && this.hasEnterpriseIntegrations()) {
      return {
        type: "enterprise",
        options: { integrations: this.integrations }
      };
    }

    // Check for database environment variables
    if (process.env.DATABASE_URL) {
      if (process.env.DATABASE_URL.startsWith("postgres://") || process.env.DATABASE_URL.startsWith("postgresql://")) {
        return {
          type: "postgres",
          connectionString: process.env.DATABASE_URL
        };
      }
      if (process.env.DATABASE_URL.startsWith("mysql://")) {
        return {
          type: "mysql",
          connectionString: process.env.DATABASE_URL
        };
      }
    }

    // Default to SQLite for local storage
    const sqlitePath = process.env.DEVLOG_SQLITE_PATH || `${this.workspaceRoot}/.devlog/devlogs.db`;
    return {
      type: "sqlite",
      filePath: sqlitePath
    };
  }

  private hasEnterpriseIntegrations(): boolean {
    return !!(this.integrations?.jira || this.integrations?.ado || this.integrations?.github);
  }

  private generateId(title: string, type?: DevlogType): string {
    // Create a clean slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    // Create hash from title and type for consistency
    const content = type ? `${title}:${type}` : title;
    const hash = crypto.createHash("sha256").update(content).digest("hex").substring(0, 8);

    return `${slug}--${hash}`;
  }
}
