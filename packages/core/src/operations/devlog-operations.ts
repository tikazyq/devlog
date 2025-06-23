import { 
  DevlogEntry, 
  DevlogNote, 
  DevlogStats,
  DevlogStatus,
  DevlogType,
  DevlogPriority,
  CreateDevlogRequest,
  UpdateDevlogRequest,
  DevlogFilter
} from "@devlog/types";

import { DevlogStorage } from "../storage/file-system-storage";
import { DevlogUtils } from "../utils/devlog-utils";
import { EnterpriseSync } from "../integrations/enterprise-sync";

export class DevlogOperations {
  private storage: DevlogStorage;
  private enterpriseSync?: EnterpriseSync;

  constructor(storage: DevlogStorage, enterpriseSync?: EnterpriseSync) {
    this.storage = storage;
    this.enterpriseSync = enterpriseSync;
  }

  async createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    const id = request.id || await DevlogUtils.generateUniqueId(
      request.title, 
      request.type,
      (id) => this.storage.loadDevlog(id)
    );
    const now = DevlogUtils.getCurrentTimestamp();

    // Check if ID already exists (in case a custom ID was provided)
    if (request.id) {
      const existing = await this.storage.loadDevlog(request.id);
      if (existing) {
        throw new Error(`Devlog entry with ID '${request.id}' already exists`);
      }
    }

    // Check for duplicate titles with same type
    const duplicateTitle = await DevlogUtils.checkForDuplicateTitle(
      request.title, 
      request.type,
      () => this.listDevlogs()
    );
    if (duplicateTitle) {
      throw new Error(`A ${request.type} with title "${request.title}" already exists (ID: ${duplicateTitle.id})`);
    }

    const entry: DevlogEntry = {
      id,
      title: request.title,
      type: request.type,
      description: request.description,
      priority: request.priority || "medium",
      status: "todo",
      createdAt: now,
      updatedAt: now,
      assignee: request.assignee,
      tags: request.tags || [],
      notes: [],
      files: [],
      relatedDevlogs: [],
      estimatedHours: request.estimatedHours,
      actualHours: undefined,
      context: {
        businessContext: request.businessContext || "",
        technicalContext: request.technicalContext || "",
        dependencies: [],
        decisions: [],
        acceptanceCriteria: request.acceptanceCriteria || [],
        risks: [],
      },
      aiContext: {
        currentSummary: `New ${request.type}: ${request.title}. ${request.description}`,
        keyInsights: request.initialInsights || [],
        openQuestions: [],
        relatedPatterns: request.relatedPatterns || [],
        suggestedNextSteps: [],
        lastAIUpdate: now,
        contextVersion: 1,
      },
      
      // Enterprise references (optional for now)
      externalReferences: [],
    };

    await this.storage.saveDevlog(entry);
    return entry;
  }

  async updateDevlog(request: UpdateDevlogRequest): Promise<DevlogEntry> {
    const entry = await this.storage.loadDevlog(request.id);
    if (!entry) {
      throw new Error(`Devlog entry '${request.id}' not found`);
    }

    // Update basic fields if provided
    if (request.title) entry.title = request.title;
    if (request.description) entry.description = request.description;
    if (request.status) entry.status = request.status;
    if (request.priority) entry.priority = request.priority;
    if (request.estimatedHours !== undefined) entry.estimatedHours = request.estimatedHours;
    if (request.actualHours !== undefined) entry.actualHours = request.actualHours;
    if (request.assignee) entry.assignee = request.assignee;
    if (request.tags) entry.tags = request.tags;
    if (request.files) entry.files = request.files;

    // Add notes for progress updates
    if (request.progress || request.codeChanges) {
      if (request.progress) {
        entry.notes.push(DevlogUtils.createNote(request.progress, 'progress'));
      }
      
      if (request.codeChanges) {
        entry.notes.push(DevlogUtils.createNote(`Code changes: ${request.codeChanges}`, 'progress'));
      }
    }

    entry.updatedAt = DevlogUtils.getCurrentTimestamp();
    await this.storage.saveDevlog(entry);
    return entry;
  }

  async getDevlog(id: string): Promise<DevlogEntry | null> {
    return await this.storage.loadDevlog(id);
  }

  async listDevlogs(filters: DevlogFilter = {}): Promise<DevlogEntry[]> {
    const index = await this.storage.loadIndex();
    const entries: DevlogEntry[] = [];

    for (const id of Object.keys(index)) {
      const entry = await this.storage.loadDevlog(id);
      if (entry) {
        entries.push(entry);
      }
    }

    // Apply filters
    const filteredEntries = DevlogUtils.filterDevlogs(entries, filters);
    
    // Sort by updatedAt descending
    return DevlogUtils.sortEntriesByUpdatedDate(filteredEntries);
  }

  async searchDevlogs(query: string): Promise<DevlogEntry[]> {
    const allEntries = await this.listDevlogs();
    const matches = allEntries.filter(entry => DevlogUtils.searchDevlogEntry(entry, query));
    return matches;
  }

  async addNote(id: string, note: Omit<DevlogNote, "id" | "timestamp">): Promise<DevlogEntry> {
    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const newNote: DevlogNote = {
      id: `note-${Date.now()}`,
      timestamp: DevlogUtils.getCurrentTimestamp(),
      ...note,
    };

    entry.notes.push(newNote);
    entry.updatedAt = DevlogUtils.getCurrentTimestamp();

    await this.storage.saveDevlog(entry);
    return entry;
  }

  async completeDevlog(id: string, summary?: string): Promise<DevlogEntry> {
    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const now = DevlogUtils.getCurrentTimestamp();
    entry.status = "done";
    entry.updatedAt = now;

    if (summary) {
      const completionNote = DevlogUtils.createNote(`Completed: ${summary}`, 'progress');
      entry.notes.push(completionNote);
    }

    await this.storage.saveDevlog(entry);
    return entry;
  }

  async getActiveContext(limit: number = 10): Promise<DevlogEntry[]> {
    const allEntries = await this.listDevlogs();
    const activeEntries = allEntries.filter(entry => entry.status !== "done");

    // Sort by priority and updated date
    const priorityWeight: Record<DevlogPriority, number> = { 
      critical: 4, 
      high: 3, 
      medium: 2, 
      low: 1 
    };
    
    activeEntries.sort((a, b) => {
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return activeEntries.slice(0, limit);
  }

  async updateAIContext(args: {
    id: string;
    summary?: string;
    insights?: string[];
    questions?: string[];
    patterns?: string[];
    nextSteps?: string[];
  }): Promise<DevlogEntry> {
    const entry = await this.storage.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const now = DevlogUtils.getCurrentTimestamp();
    
    // Update AI context
    if (args.summary) entry.aiContext.currentSummary = args.summary;
    if (args.insights) entry.aiContext.keyInsights = [...entry.aiContext.keyInsights, ...args.insights];
    if (args.questions) entry.aiContext.openQuestions = args.questions;
    if (args.patterns) entry.aiContext.relatedPatterns = [...entry.aiContext.relatedPatterns, ...args.patterns];
    if (args.nextSteps) entry.aiContext.suggestedNextSteps = args.nextSteps;
    
    entry.aiContext.lastAIUpdate = now;
    entry.aiContext.contextVersion += 1;
    entry.updatedAt = now;

    await this.storage.saveDevlog(entry);
    return entry;
  }

  async addDecision(args: {
    id: string;
    decision: string;
    rationale: string;
    alternatives?: string[];
    decisionMaker: string;
  }): Promise<DevlogEntry> {
    const entry = await this.storage.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const now = DevlogUtils.getCurrentTimestamp();
    const decision = {
      id: `decision-${Date.now()}`,
      timestamp: now,
      decision: args.decision,
      rationale: args.rationale,
      alternatives: args.alternatives || [],
      decisionMaker: args.decisionMaker,
    };

    entry.context.decisions.push(decision);
    entry.updatedAt = now;

    await this.storage.saveDevlog(entry);
    return entry;
  }

  async getStats(): Promise<DevlogStats> {
    const entries = await this.listDevlogs();
    
    const stats: DevlogStats = {
      totalEntries: entries.length,
      byStatus: {} as Record<DevlogStatus, number>,
      byType: {} as Record<DevlogType, number>,
      byPriority: {} as Record<DevlogPriority, number>,
    };

    // Initialize counters
    const statuses: DevlogStatus[] = ["todo", "in-progress", "review", "testing", "done", "archived"];
    const types: DevlogType[] = ["feature", "bugfix", "task", "refactor", "docs"];
    const priorities: DevlogPriority[] = ["low", "medium", "high", "critical"];

    statuses.forEach(status => stats.byStatus[status] = 0);
    types.forEach(type => stats.byType[type] = 0);
    priorities.forEach(priority => stats.byPriority[priority] = 0);

    // Count entries
    entries.forEach(entry => {
      stats.byStatus[entry.status]++;
      stats.byType[entry.type]++;
      stats.byPriority[entry.priority]++;
    });

    // Calculate average completion time for completed items
    const completedEntries = entries.filter(entry => entry.status === "done");
    if (completedEntries.length > 0) {
      const totalTime = completedEntries.reduce((sum, entry) => {
        const created = new Date(entry.createdAt).getTime();
        const completed = new Date(entry.updatedAt).getTime();
        return sum + (completed - created);
      }, 0);
      stats.averageCompletionTime = totalTime / completedEntries.length / (1000 * 60 * 60 * 24); // in days
    }

    return stats;
  }

  async deleteDevlog(id: string): Promise<void> {
    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    await this.storage.deleteDevlogFile(id);
  }

  async findOrCreateDevlog(request: CreateDevlogRequest): Promise<{entry: DevlogEntry, created: boolean}> {
    // First, check if we would generate the same ID for this request
    const expectedId = await DevlogUtils.generateUniqueId(
      request.title, 
      request.type,
      (id) => this.storage.loadDevlog(id)
    );
    const existingById = await this.storage.loadDevlog(expectedId);
    
    if (existingById) {
      return { entry: existingById, created: false };
    }
    
    // Check if a similar entry already exists by title and type
    const existing = await DevlogUtils.checkForDuplicateTitle(
      request.title, 
      request.type,
      () => this.listDevlogs()
    );
    
    if (existing) {
      return { entry: existing, created: false };
    }
    
    // Create new entry
    const entry = await this.createDevlog(request);
    return { entry, created: true };
  }

  // Enterprise Integration Methods
  async syncWithJira(id: string): Promise<DevlogEntry> {
    if (!this.enterpriseSync) {
      throw new Error("Enterprise integrations not configured");
    }

    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    try {
      const jiraRef = await this.enterpriseSync.syncWithJira(entry);
      
      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "jira" && ref.id === jiraRef.id);
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = jiraRef;
      } else {
        entry.externalReferences.push(jiraRef);
      }

      entry.updatedAt = DevlogUtils.getCurrentTimestamp();
      await this.storage.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`Jira sync failed: ${error}`);
    }
  }

  async syncWithADO(id: string): Promise<DevlogEntry> {
    if (!this.enterpriseSync) {
      throw new Error("Enterprise integrations not configured");
    }

    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    try {
      const adoRef = await this.enterpriseSync.syncWithADO(entry);
      
      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "ado" && ref.id === adoRef.id);
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = adoRef;
      } else {
        entry.externalReferences.push(adoRef);
      }

      entry.updatedAt = DevlogUtils.getCurrentTimestamp();
      await this.storage.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`Azure DevOps sync failed: ${error}`);
    }
  }

  async syncWithGitHub(id: string): Promise<DevlogEntry> {
    if (!this.enterpriseSync) {
      throw new Error("Enterprise integrations not configured");
    }

    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    try {
      const githubRef = await this.enterpriseSync.syncWithGitHub(entry);
      
      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "github" && ref.id === githubRef.id);
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = githubRef;
      } else {
        entry.externalReferences.push(githubRef);
      }

      entry.updatedAt = DevlogUtils.getCurrentTimestamp();
      await this.storage.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`GitHub sync failed: ${error}`);
    }
  }

  async syncAllIntegrations(id: string): Promise<DevlogEntry> {
    if (!this.enterpriseSync) {
      throw new Error("Enterprise integrations not configured");
    }

    const entry = await this.storage.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    try {
      const refs = await this.enterpriseSync.syncAll(entry);
      
      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update all references
      refs.forEach(ref => {
        const existingIndex = entry.externalReferences!.findIndex(existing => existing.system === ref.system && existing.id === ref.id);
        if (existingIndex >= 0) {
          entry.externalReferences![existingIndex] = ref;
        } else {
          entry.externalReferences!.push(ref);
        }
      });

      entry.updatedAt = DevlogUtils.getCurrentTimestamp();
      await this.storage.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`Integration sync failed: ${error}`);
    }
  }
}
