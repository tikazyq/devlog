/**
 * DevlogManager that uses the storage provider abstraction
 * This provides a flexible architecture supporting multiple storage backends
 */

import * as crypto from 'crypto';
import type {
  CreateDevlogRequest,
  DevlogEntry,
  DevlogFilter,
  DevlogId,
  DevlogNote,
  DevlogStats,
  DevlogStatus,
  DevlogType,
  EnterpriseIntegration,
  StorageConfig,
  UpdateDevlogRequest,
} from '@devlog/types';
import { StorageProvider, StorageProviderFactory } from './storage/storage-provider.js';
import { ConfigurationManager, SyncStrategy } from './configuration-manager.js';
import { IntegrationService } from './integration-service.js';
import { IdManager } from './utils/id-manager.js';

// Discovery-related interfaces
export interface DiscoverDevlogsRequest {
  workDescription: string;
  workType: DevlogType;
  keywords?: string[];
  scope?: string;
}

export interface DiscoveredDevlogEntry {
  entry: DevlogEntry;
  relevance: 'direct-text-match' | 'same-type' | 'keyword-in-notes';
  matchedTerms: string[];
}

export interface DiscoveryResult {
  relatedEntries: DiscoveredDevlogEntry[];
  activeCount: number;
  recommendation: string;
  searchParameters: DiscoverDevlogsRequest;
}

export interface DevlogManagerOptions {
  workspaceRoot?: string;
  storage?: StorageConfig;
  integrations?: EnterpriseIntegration;
  syncStrategy?: SyncStrategy;
  useIntegerIds?: boolean; // Flag to enable new integer ID system
}

export class DevlogManager {
  private storageProvider!: StorageProvider;
  private integrationService!: IntegrationService;
  private idManager!: IdManager;
  private readonly workspaceRoot: string;
  private readonly integrations?: EnterpriseIntegration;
  private readonly syncStrategy?: SyncStrategy;
  private readonly useIntegerIds: boolean;
  private readonly configManager: ConfigurationManager;
  private initialized = false;

  constructor(private options: DevlogManagerOptions = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.integrations = options.integrations;
    this.syncStrategy = options.syncStrategy;
    this.useIntegerIds = options.useIntegerIds ?? true; // Default to new system
    this.configManager = new ConfigurationManager(this.workspaceRoot);
  }

  /**
   * Initialize the storage provider based on configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const storageConfig = await this.determineStorageConfig();
    this.storageProvider = await StorageProviderFactory.create(storageConfig);
    await this.storageProvider.initialize();

    // Initialize ID manager with storage provider's data directory
    const dataDir =
      storageConfig.type === 'sqlite' && storageConfig.filePath
        ? storageConfig.filePath.replace(/[^\/]*$/, '') // Get directory from file path
        : this.workspaceRoot;
    this.idManager = new IdManager(dataDir);
    await this.idManager.initializeCounter();

    // Initialize integration service if integrations are configured
    const integrations =
      this.integrations || (await this.configManager.detectEnterpriseIntegrations());
    const syncStrategy =
      this.syncStrategy || (await this.configManager.detectSyncStrategy(integrations));

    this.integrationService = new IntegrationService(
      this.storageProvider,
      integrations,
      syncStrategy,
    );

    this.initialized = true;
  }

  /**
   * Create a new devlog entry or find existing one with same title and type
   * Alias for findOrCreateDevlog to provide a cleaner API
   */
  async createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    return this.findOrCreateDevlog(request);
  }

  /**
   * Create a new devlog entry or find existing one with same title and type
   */
  async findOrCreateDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    await this.ensureInitialized();

    // Use provided ID if available, otherwise generate one
    const id = request.id || (await this.generateId(request.title, request.type));

    // Check if entry already exists
    const existing = await this.storageProvider.get(id);
    if (existing) {
      return existing;
    }

    // Generate semantic key for reference
    const key = this.generateKey(request.title, request.type);

    // Create new entry
    const now = new Date().toISOString();
    const entry: DevlogEntry = {
      id,
      key,
      title: request.title,
      type: request.type,
      description: request.description,
      status: 'todo' as DevlogStatus,
      priority: request.priority || 'medium',
      createdAt: now,
      updatedAt: now,
      estimatedHours: request.estimatedHours,
      assignee: request.assignee,
      tags: request.tags || [],
      notes: [],
      files: [],
      relatedDevlogs: [],
      context: {
        businessContext: request.businessContext || '',
        technicalContext: request.technicalContext || '',
        dependencies: [],
        decisions: [],
        acceptanceCriteria: request.acceptanceCriteria || [],
        risks: [],
      },
      aiContext: {
        currentSummary: '',
        keyInsights: request.initialInsights || [],
        openQuestions: [],
        relatedPatterns: request.relatedPatterns || [],
        suggestedNextSteps: [],
        lastAIUpdate: now,
        contextVersion: 1,
      },
    };

    // Save with integration sync
    await this.integrationService.saveWithSync(entry);
    return entry;
  }

  /**
   * Get a devlog entry by ID
   */
  async getDevlog(id: DevlogId): Promise<DevlogEntry | null> {
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
      updatedAt: new Date().toISOString(),
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
        category: request.noteCategory || 'progress',
        content: request.progress,
        files: request.files,
        codeChanges: request.codeChanges,
      };
      updated.notes.push(note);
    }

    await this.integrationService.saveWithSync(updated);
    return updated;
  }

  /**
   * Add a note to a devlog entry
   */
  async addNote(
    id: DevlogId,
    content: string,
    category: DevlogNote['category'] = 'progress',
  ): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${id}' not found`);
    }

    const note: DevlogNote = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category,
      content,
    };

    const updated: DevlogEntry = {
      ...existing,
      notes: [...existing.notes, note],
      updatedAt: new Date().toISOString(),
    };

    await this.integrationService.saveWithSync(updated);
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
  async deleteDevlog(id: DevlogId): Promise<void> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${id}' not found`);
    }

    await this.storageProvider.delete(id);
  }

  /**
   * Complete a devlog entry and archive it
   */
  async completeDevlog(id: DevlogId, summary?: string): Promise<DevlogEntry> {
    const updated = await this.updateDevlog({
      id,
      status: 'done',
    });

    if (summary) {
      return await this.addNote(id, `Completed: ${summary}`, 'progress');
    }

    return updated;
  }

  /**
   * Get AI context for a devlog entry
   */
  async getContextForAI(id: DevlogId): Promise<DevlogEntry | null> {
    await this.ensureInitialized();
    return await this.storageProvider.get(id);
  }

  /**
   * Get active devlog entries for AI context
   */
  async getActiveContext(limit?: number): Promise<DevlogEntry[]> {
    await this.ensureInitialized();

    const filter = {
      status: ['todo', 'in-progress', 'review', 'testing'] as any[],
    };

    const entries = await this.storageProvider.list(filter);
    return entries.slice(0, limit || 10);
  }

  /**
   * Update AI context for a devlog entry
   */
  async updateAIContext(
    id: DevlogId,
    context: Partial<DevlogEntry['aiContext']>,
  ): Promise<DevlogEntry> {
    await this.ensureInitialized();

    const existing = await this.storageProvider.get(id);
    if (!existing) {
      throw new Error(`Devlog entry with ID '${id}' not found`);
    }

    const updated: DevlogEntry = {
      ...existing,
      aiContext: {
        ...existing.aiContext,
        ...context,
      },
      updatedAt: new Date().toISOString(),
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

  /**
   * Comprehensively discover related devlog entries before creating new work
   * Prevents duplicate work by finding relevant historical context
   */
  async discoverRelatedDevlogs(request: DiscoverDevlogsRequest): Promise<DiscoveryResult> {
    await this.ensureInitialized();

    const { workDescription, workType, keywords = [], scope } = request;

    // Build comprehensive search terms
    const searchTerms = [workDescription, workType, scope, ...keywords].filter(Boolean);

    // Get all entries for analysis
    const allEntries = await this.listDevlogs();
    const relatedEntries: DiscoveredDevlogEntry[] = [];

    // 1. Direct text matching in title/description/context
    for (const entry of allEntries) {
      const entryText =
        `${entry.title} ${entry.description} ${entry.context.businessContext || ''} ${entry.context.technicalContext || ''}`.toLowerCase();
      const matchedTerms = searchTerms.filter(
        (term): term is string => term !== undefined && entryText.includes(term.toLowerCase()),
      );

      if (matchedTerms.length > 0) {
        relatedEntries.push({
          entry,
          relevance: 'direct-text-match',
          matchedTerms,
        });
      }
    }

    // 2. Same type entries (if not already included)
    const sameTypeEntries = allEntries.filter(
      (entry) => entry.type === workType && !relatedEntries.some((r) => r.entry.id === entry.id),
    );

    for (const entry of sameTypeEntries) {
      relatedEntries.push({
        entry,
        relevance: 'same-type',
        matchedTerms: [workType],
      });
    }

    // 3. Keyword matching in notes and decisions
    for (const entry of allEntries) {
      if (relatedEntries.some((r) => r.entry.id === entry.id)) continue;

      const noteText = entry.notes
        .map((n) => n.content)
        .join(' ')
        .toLowerCase();
      const decisionText = entry.context.decisions
        .map((d) => `${d.decision} ${d.rationale}`)
        .join(' ')
        .toLowerCase();
      const combinedText = `${noteText} ${decisionText}`;

      const matchedKeywords = keywords.filter(
        (keyword): keyword is string =>
          keyword !== undefined && combinedText.includes(keyword.toLowerCase()),
      );

      if (matchedKeywords.length > 0) {
        relatedEntries.push({
          entry,
          relevance: 'keyword-in-notes',
          matchedTerms: matchedKeywords,
        });
      }
    }

    // Sort by relevance and status priority
    relatedEntries.sort((a, b) => {
      type RelevanceType = 'direct-text-match' | 'same-type' | 'keyword-in-notes';

      const relevanceOrder: Record<RelevanceType, number> = {
        'direct-text-match': 0,
        'same-type': 1,
        'keyword-in-notes': 2,
      };
      const statusOrder: Record<DevlogStatus, number> = {
        'in-progress': 0,
        review: 1,
        todo: 2,
        testing: 3,
        done: 4,
        archived: 5,
      };

      const relevanceDiff =
        relevanceOrder[a.relevance as RelevanceType] - relevanceOrder[b.relevance as RelevanceType];
      if (relevanceDiff !== 0) return relevanceDiff;

      return statusOrder[a.entry.status] - statusOrder[b.entry.status];
    });

    // Calculate active entries and generate recommendation
    const activeCount = relatedEntries.filter((r) =>
      ['todo', 'in-progress', 'review', 'testing'].includes(r.entry.status),
    ).length;

    const recommendation =
      activeCount > 0
        ? `⚠️ RECOMMENDATION: Review ${activeCount} active related entries before creating new work. Consider updating existing entries or coordinating efforts.`
        : relatedEntries.length > 0
          ? `✅ RECOMMENDATION: Related entries are completed. Safe to create new devlog entry, but review completed work for insights and patterns.`
          : `✅ RECOMMENDATION: No related work found. Safe to create new devlog entry.`;

    return {
      relatedEntries,
      activeCount,
      recommendation,
      searchParameters: request,
    };
  }

  /**
   * Manually sync a devlog entry with external systems
   */
  async syncDevlog(id: DevlogId): Promise<DevlogEntry | null> {
    await this.ensureInitialized();
    return await this.integrationService.syncEntry(id);
  }

  /**
   * Get sync status for a devlog entry
   */
  getSyncStatus(entry: DevlogEntry) {
    return this.integrationService.getSyncStatus(entry);
  }

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async determineStorageConfig(): Promise<StorageConfig> {
    if (this.options.storage) {
      return this.options.storage;
    }

    // Use ConfigurationManager to detect the best storage configuration
    // This will automatically handle ~/.devlog folder creation and usage
    return await this.configManager.detectBestStorage();
  }

  private hasEnterpriseIntegrations(): boolean {
    return !!(this.integrations?.jira || this.integrations?.ado || this.integrations?.github);
  }

  private async generateId(title: string, type?: DevlogType): Promise<DevlogId> {
    if (this.useIntegerIds) {
      // Use integer ID system
      return await this.idManager.generateNextId();
    } else {
      // Legacy system no longer supported - always use integers
      throw new Error('Legacy string IDs are no longer supported. Use integer ID system.');
    }
  }

  /**
   * Generate semantic key for the entry (used for referencing and legacy compatibility)
   */
  private generateKey(title: string, type?: DevlogType): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    // For consistency with legacy system, optionally include type-based hash
    if (type && this.useIntegerIds) {
      // Clean key without hash for new system
      return slug;
    } else {
      // Legacy format with hash
      const content = type ? `${title}:${type}` : title;
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
      return `${slug}--${hash}`;
    }
  }
}
