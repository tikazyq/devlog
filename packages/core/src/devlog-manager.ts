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
  DiscoverDevlogsRequest,
  DiscoveredDevlogEntry,
  DiscoveryResult,
  StorageProvider,
  UpdateDevlogRequest,
} from '@devlog/types';
import { StorageProviderFactory } from './storage/storage-provider.js';
import { ConfigurationManager } from './configuration-manager.js';

export class DevlogManager {
  private storageProvider!: StorageProvider;
  // TODO: Uncomment when integrations are implemented
  // private integrationService!: IntegrationService;
  // private readonly integrations?: EnterpriseIntegration;
  // private readonly syncStrategy?: SyncStrategy;
  private readonly configManager: ConfigurationManager;
  private initialized = false;

  constructor() {
    // TODO: integrations and syncStrategy can be configured later
    // this.integrations = options.integrations;
    // this.syncStrategy = options.syncStrategy;
    this.configManager = new ConfigurationManager();
  }

  /**
   * Initialize the storage provider based on configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = await this.configManager.loadConfig();
    console.debug('Initialized devlog config', config);

    this.storageProvider = await StorageProviderFactory.create(config.storage);
    await this.storageProvider.initialize();

    // TODO: Initialize integration service if integrations are configured
    // const integrations =
    //   this.integrations || (await this.configManager.detectEnterpriseIntegrations());
    // const syncStrategy =
    //   this.syncStrategy || (await this.configManager.detectSyncStrategy(integrations));
    // this.integrationService = new IntegrationService(
    //   this.storageProvider,
    //   integrations,
    //   syncStrategy,
    // );

    this.initialized = true;
  }

  /**
   * Create a new devlog entry
   */
  async createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    await this.ensureInitialized();

    // Generate semantic key for reference
    const key = this.generateKey(request.title);

    // Create new entry
    const now = new Date().toISOString();
    const entry: DevlogEntry = {
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
    await this.storageProvider.save(entry);

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

    await this.storageProvider.save(updated);
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
      await this.storageProvider.cleanup();
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

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Generate semantic key for the entry (used for referencing and legacy compatibility)
   */
  private generateKey(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}
