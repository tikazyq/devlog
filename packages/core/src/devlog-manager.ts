import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { 
  DevlogEntry, 
  DevlogNote, 
  AIContext, 
  DevlogContext, 
  CreateDevlogRequest,
  UpdateDevlogRequest,
  DevlogFilter,
  DevlogStats,
  DevlogStatus,
  DevlogType,
  DevlogPriority,
  EnterpriseIntegration,
  ExternalReference,
  JiraConfig,
  AdoConfig,
  GitHubConfig,
  SlackConfig
} from "@devlog/types";

export interface DevlogManagerOptions {
  workspaceRoot?: string;
  devlogDir?: string;
  integrations?: EnterpriseIntegration;
}

export class DevlogManager {
  private devlogDir: string;
  private indexFile: string;
  private integrations?: EnterpriseIntegration;

  constructor(options: DevlogManagerOptions = {}) {
    // If no workspace root provided, use current working directory
    const root = options.workspaceRoot || process.cwd();
    this.devlogDir = options.devlogDir || path.join(root, ".devlog");
    this.indexFile = path.join(this.devlogDir, "index.json");
    this.integrations = options.integrations;
  }

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

  private async loadDevlog(id: string): Promise<DevlogEntry | null> {
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

  private async saveDevlog(entry: DevlogEntry): Promise<void> {
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

  private generateId(title: string, type?: DevlogType): string {
    // Create a clean slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);
    
    // Create a deterministic hash based on title + type
    const content = `${title.toLowerCase().trim()}|${type || 'feature'}`;
    const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
    
    return `${slug}-${hash}`;
  }

  private async generateUniqueId(title: string, type?: DevlogType): Promise<string> {
    const baseId = this.generateId(title, type);
    
    // Check if this ID already exists
    const existing = await this.loadDevlog(baseId);
    if (!existing) {
      return baseId;
    }
    
    // If it exists, add a counter suffix
    let counter = 1;
    let uniqueId: string;
    
    do {
      uniqueId = `${baseId}-${counter}`;
      const existingWithCounter = await this.loadDevlog(uniqueId);
      if (!existingWithCounter) {
        return uniqueId;
      }
      counter++;
    } while (counter < 100); // Prevent infinite loop
    
    // Fallback to timestamp if we can't find a unique ID
    return `${baseId}-${Date.now()}`;
  }

  private async checkForDuplicateTitle(title: string, type?: DevlogType, excludeId?: string): Promise<DevlogEntry | null> {
    const entries = await this.listDevlogs();
    const normalizedTitle = title.toLowerCase().trim();
    
    for (const entry of entries) {
      if (excludeId && entry.id === excludeId) continue;
      
      const entryNormalizedTitle = entry.title.toLowerCase().trim();
      // Only consider it a duplicate if both title AND type match
      if (entryNormalizedTitle === normalizedTitle && (!type || entry.type === type)) {
        return entry;
      }
    }
    
    return null;
  }

  async createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    const id = request.id || await this.generateUniqueId(request.title, request.type);
    const now = new Date().toISOString();

    // Check if ID already exists (in case a custom ID was provided)
    if (request.id) {
      const existing = await this.loadDevlog(id);
      if (existing) {
        throw new Error(`Devlog with ID '${id}' already exists`);
      }
    }

    // Check for duplicate titles with same type
    const duplicateTitle = await this.checkForDuplicateTitle(request.title, request.type);
    if (duplicateTitle) {
      throw new Error(`A devlog entry with title '${request.title}' and type '${request.type}' already exists (ID: ${duplicateTitle.id}). Consider updating the existing entry instead.`);
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
      
      // Enhanced context for AI agents
      context: {
        businessContext: request.businessContext || "",
        technicalContext: request.technicalContext || "",
        dependencies: [],
        decisions: [],
        acceptanceCriteria: request.acceptanceCriteria || [],
        risks: [],
      },
      
      // AI-specific context
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

    await this.saveDevlog(entry);
    return entry;
  }

  async updateDevlog(request: UpdateDevlogRequest): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(request.id);
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
      const now = new Date().toISOString();
      
      if (request.progress) {
        entry.notes.push({
          id: `note-${Date.now()}`,
          timestamp: now,
          category: request.noteCategory || "progress",
          content: request.progress,
          files: request.files,
          codeChanges: request.codeChanges
        });
      }
    }

    entry.updatedAt = new Date().toISOString();
    await this.saveDevlog(entry);
    return entry;
  }

  async getDevlog(id: string): Promise<DevlogEntry | null> {
    return await this.loadDevlog(id);
  }

  async listDevlogs(filters: DevlogFilter = {}): Promise<DevlogEntry[]> {
    const index = await this.loadIndex();
    const entries: DevlogEntry[] = [];

    for (const id of Object.keys(index)) {
      const entry = await this.loadDevlog(id);
      if (entry) {
        // Apply filters
        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(entry.status)) continue;
        }
        if (filters.type && filters.type.length > 0) {
          if (!filters.type.includes(entry.type)) continue;
        }
        if (filters.priority && filters.priority.length > 0) {
          if (!filters.priority.includes(entry.priority)) continue;
        }
        if (filters.assignee && entry.assignee !== filters.assignee) continue;
        if (filters.tags && filters.tags.length > 0) {
          const hasTag = filters.tags.some((tag: string) => entry.tags.includes(tag));
          if (!hasTag) continue;
        }
        if (filters.fromDate) {
          if (new Date(entry.updatedAt) < new Date(filters.fromDate)) continue;
        }
        if (filters.toDate) {
          if (new Date(entry.updatedAt) > new Date(filters.toDate)) continue;
        }
        
        entries.push(entry);
      }
    }

    // Sort by updatedAt descending
    entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return entries;
  }

  async searchDevlogs(query: string): Promise<DevlogEntry[]> {
    const index = await this.loadIndex();
    const matches: DevlogEntry[] = [];
    const searchLower = query.toLowerCase();

    for (const id of Object.keys(index)) {
      const entry = await this.loadDevlog(id);
      if (entry) {
        const searchableText = [
          entry.title,
          entry.description,
          entry.context.businessContext,
          entry.context.technicalContext,
          entry.aiContext.currentSummary,
          ...entry.aiContext.keyInsights,
          ...entry.notes.map((note: DevlogNote) => note.content),
        ].join(" ").toLowerCase();

        if (searchableText.includes(searchLower)) {
          matches.push(entry);
        }
      }
    }

    return matches;
  }

  async addNote(id: string, note: Omit<DevlogNote, "id" | "timestamp">): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const newNote: DevlogNote = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...note,
    };

    entry.notes.push(newNote);
    entry.updatedAt = new Date().toISOString();

    await this.saveDevlog(entry);
    return entry;
  }

  async completeDevlog(id: string, summary?: string): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const now = new Date().toISOString();
    entry.status = "done";
    entry.updatedAt = now;

    if (summary) {
      const completionNote: DevlogNote = {
        id: `note-${Date.now()}`,
        timestamp: now,
        category: "progress",
        content: `Completed: ${summary}`,
      };
      entry.notes.push(completionNote);
    }

    await this.saveDevlog(entry);
    return entry;
  }

  async getActiveContext(limit: number = 10): Promise<DevlogEntry[]> {
    const index = await this.loadIndex();
    const activeEntries: DevlogEntry[] = [];

    for (const id of Object.keys(index)) {
      const entry = await this.loadDevlog(id);
      if (entry && entry.status !== "done") {
        activeEntries.push(entry);
      }
    }

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
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const now = new Date().toISOString();
    
    // Update AI context
    if (args.summary) entry.aiContext.currentSummary = args.summary;
    if (args.insights) entry.aiContext.keyInsights = [...entry.aiContext.keyInsights, ...args.insights];
    if (args.questions) entry.aiContext.openQuestions = args.questions;
    if (args.patterns) entry.aiContext.relatedPatterns = [...entry.aiContext.relatedPatterns, ...args.patterns];
    if (args.nextSteps) entry.aiContext.suggestedNextSteps = args.nextSteps;
    
    entry.aiContext.lastAIUpdate = now;
    entry.aiContext.contextVersion += 1;
    entry.updatedAt = now;

    await this.saveDevlog(entry);
    return entry;
  }

  async addDecision(args: {
    id: string;
    decision: string;
    rationale: string;
    alternatives?: string[];
    decisionMaker: string;
  }): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const now = new Date().toISOString();
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

    await this.saveDevlog(entry);
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
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

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

  async findOrCreateDevlog(request: CreateDevlogRequest): Promise<{entry: DevlogEntry, created: boolean}> {
    // First, check if we would generate the same ID for this request
    const expectedId = await this.generateUniqueId(request.title, request.type);
    const existingById = await this.loadDevlog(expectedId);
    
    if (existingById) {
      return { entry: existingById, created: false };
    }
    
    // Check if a similar entry already exists by title and type
    const existing = await this.checkForDuplicateTitle(request.title, request.type);
    
    if (existing) {
      return { entry: existing, created: false };
    }
    
    // Create new entry
    const entry = await this.createDevlog(request);
    return { entry, created: true };
  }

  async getDevlogDir(): Promise<string> {
    return this.devlogDir;
  }

  // Enterprise Integration Methods

  async syncWithJira(id: string): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    if (!this.integrations?.jira) {
      throw new Error("Jira integration not configured");
    }

    const jiraConfig = this.integrations.jira;
    
    try {
      // Create or update Jira issue
      const jiraIssue = await this.createOrUpdateJiraIssue(entry, jiraConfig);
      
      // Update devlog with Jira reference
      const jiraRef: ExternalReference = {
        system: "jira",
        id: jiraIssue.key,
        url: `${jiraConfig.baseUrl}/browse/${jiraIssue.key}`,
        title: jiraIssue.fields.summary,
        status: jiraIssue.fields.status.name,
        lastSync: new Date().toISOString()
      };

      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "jira" && ref.id === jiraIssue.key);
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = jiraRef;
      } else {
        entry.externalReferences.push(jiraRef);
      }

      entry.updatedAt = new Date().toISOString();
      await this.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`Jira sync failed: ${error}`);
    }
  }

  async syncWithADO(id: string): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    if (!this.integrations?.ado) {
      throw new Error("Azure DevOps integration not configured");
    }

    const adoConfig = this.integrations.ado;
    
    try {
      // Create or update ADO work item
      const workItem = await this.createOrUpdateADOWorkItem(entry, adoConfig);
      
      // Update devlog with ADO reference
      const adoRef: ExternalReference = {
        system: "ado",
        id: workItem.id.toString(),
        url: `https://dev.azure.com/${adoConfig.organization}/${adoConfig.project}/_workitems/edit/${workItem.id}`,
        title: workItem.fields["System.Title"],
        status: workItem.fields["System.State"],
        lastSync: new Date().toISOString()
      };

      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "ado" && ref.id === workItem.id.toString());
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = adoRef;
      } else {
        entry.externalReferences.push(adoRef);
      }

      entry.updatedAt = new Date().toISOString();
      await this.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`Azure DevOps sync failed: ${error}`);
    }
  }

  async syncWithGitHub(id: string): Promise<DevlogEntry> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    if (!this.integrations?.github) {
      throw new Error("GitHub integration not configured");
    }

    const githubConfig = this.integrations.github;
    
    try {
      // Create or update GitHub issue
      const issue = await this.createOrUpdateGitHubIssue(entry, githubConfig);
      
      // Update devlog with GitHub reference
      const githubRef: ExternalReference = {
        system: "github",
        id: issue.number.toString(),
        url: issue.html_url,
        title: issue.title,
        status: issue.state,
        lastSync: new Date().toISOString()
      };

      if (!entry.externalReferences) {
        entry.externalReferences = [];
      }

      // Update existing reference or add new one
      const existingIndex = entry.externalReferences.findIndex(ref => ref.system === "github" && ref.id === issue.number.toString());
      if (existingIndex >= 0) {
        entry.externalReferences[existingIndex] = githubRef;
      } else {
        entry.externalReferences.push(githubRef);
      }

      entry.updatedAt = new Date().toISOString();
      await this.saveDevlog(entry);

      return entry;
    } catch (error) {
      throw new Error(`GitHub sync failed: ${error}`);
    }
  }

  async syncAllIntegrations(id: string): Promise<DevlogEntry> {
    let entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const syncPromises = [];

    if (this.integrations?.jira) {
      syncPromises.push(this.syncWithJira(id));
    }

    if (this.integrations?.ado) {
      syncPromises.push(this.syncWithADO(id));
    }

    if (this.integrations?.github) {
      syncPromises.push(this.syncWithGitHub(id));
    }

    if (syncPromises.length === 0) {
      throw new Error("No integrations configured");
    }

    // Wait for all syncs to complete
    await Promise.all(syncPromises);

    // Return the updated entry
    return await this.loadDevlog(id) || entry;
  }

  private async createOrUpdateJiraIssue(entry: DevlogEntry, config: JiraConfig): Promise<any> {
    const auth = Buffer.from(`${config.userEmail}:${config.apiToken}`).toString('base64');
    
    const issueData = {
      fields: {
        project: {
          key: config.projectKey
        },
        summary: entry.title,
        description: this.formatDescriptionForJira(entry),
        issuetype: {
          name: this.mapDevlogTypeToJiraIssueType(entry.type)
        },
        priority: {
          name: this.mapDevlogPriorityToJiraPriority(entry.priority)
        }
      }
    };

    // Check if issue already exists
    const existingRef = entry.externalReferences?.find(ref => ref.system === "jira");
    
    if (existingRef) {
      // Update existing issue
      const response = await fetch(`${config.baseUrl}/rest/api/3/issue/${existingRef.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.statusText}`);
      }

      // Get updated issue
      const getResponse = await fetch(`${config.baseUrl}/rest/api/3/issue/${existingRef.id}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      return await getResponse.json();
    } else {
      // Create new issue
      const response = await fetch(`${config.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.statusText}`);
      }

      const createdIssue = await response.json();
      
      // Get full issue details
      const getResponse = await fetch(`${config.baseUrl}/rest/api/3/issue/${createdIssue.key}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      return await getResponse.json();
    }
  }

  private async createOrUpdateADOWorkItem(entry: DevlogEntry, config: AdoConfig): Promise<any> {
    const auth = Buffer.from(`:${config.personalAccessToken}`).toString('base64');
    
    const workItemData = [
      {
        op: "add",
        path: "/fields/System.Title",
        value: entry.title
      },
      {
        op: "add",
        path: "/fields/System.Description",
        value: this.formatDescriptionForADO(entry)
      },
      {
        op: "add",
        path: "/fields/Microsoft.VSTS.Common.Priority",
        value: this.mapDevlogPriorityToADOPriority(entry.priority)
      }
    ];

    // Check if work item already exists
    const existingRef = entry.externalReferences?.find(ref => ref.system === "ado");
    
    if (existingRef) {
      // Update existing work item
      const response = await fetch(`https://dev.azure.com/${config.organization}/${config.project}/_apis/wit/workitems/${existingRef.id}?api-version=7.0`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(workItemData)
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps API error: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Create new work item
      const workItemType = this.mapDevlogTypeToADOWorkItemType(entry.type);
      const response = await fetch(`https://dev.azure.com/${config.organization}/${config.project}/_apis/wit/workitems/$${workItemType}?api-version=7.0`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(workItemData)
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps API error: ${response.statusText}`);
      }

      return await response.json();
    }
  }

  private async createOrUpdateGitHubIssue(entry: DevlogEntry, config: GitHubConfig): Promise<any> {
    const issueData = {
      title: entry.title,
      body: this.formatDescriptionForGitHub(entry),
      labels: this.mapDevlogToGitHubLabels(entry)
    };

    // Check if issue already exists
    const existingRef = entry.externalReferences?.find(ref => ref.system === "github");
    
    if (existingRef) {
      // Update existing issue
      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/issues/${existingRef.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Create new issue
      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      return await response.json();
    }
  }

  // Helper methods for mapping between devlog and external systems

  private formatDescriptionForJira(entry: DevlogEntry): string {
    let description = entry.description;
    
    if (entry.context.businessContext) {
      description += `\n\n*Business Context:* ${entry.context.businessContext}`;
    }
    
    if (entry.context.technicalContext) {
      description += `\n\n*Technical Context:* ${entry.context.technicalContext}`;
    }

    if (entry.context.acceptanceCriteria.length > 0) {
      description += `\n\n*Acceptance Criteria:*\n${entry.context.acceptanceCriteria.map(c => `• ${c}`).join('\n')}`;
    }

    return description;
  }

  private formatDescriptionForADO(entry: DevlogEntry): string {
    let description = `<p>${entry.description}</p>`;
    
    if (entry.context.businessContext) {
      description += `<p><strong>Business Context:</strong> ${entry.context.businessContext}</p>`;
    }
    
    if (entry.context.technicalContext) {
      description += `<p><strong>Technical Context:</strong> ${entry.context.technicalContext}</p>`;
    }

    if (entry.context.acceptanceCriteria.length > 0) {
      description += `<p><strong>Acceptance Criteria:</strong></p><ul>${entry.context.acceptanceCriteria.map(c => `<li>${c}</li>`).join('')}</ul>`;
    }

    return description;
  }

  private formatDescriptionForGitHub(entry: DevlogEntry): string {
    let description = entry.description;
    
    if (entry.context.businessContext) {
      description += `\n\n## Business Context\n${entry.context.businessContext}`;
    }
    
    if (entry.context.technicalContext) {
      description += `\n\n## Technical Context\n${entry.context.technicalContext}`;
    }

    if (entry.context.acceptanceCriteria.length > 0) {
      description += `\n\n## Acceptance Criteria\n${entry.context.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}`;
    }

    return description;
  }

  private mapDevlogTypeToJiraIssueType(type: DevlogType): string {
    const mapping = {
      feature: "Story",
      bugfix: "Bug",
      task: "Task",
      refactor: "Task",
      docs: "Task"
    };
    return mapping[type] || "Task";
  }

  private mapDevlogTypeToADOWorkItemType(type: DevlogType): string {
    const mapping = {
      feature: "User Story",
      bugfix: "Bug",
      task: "Task",
      refactor: "Task",
      docs: "Task"
    };
    return mapping[type] || "Task";
  }

  private mapDevlogPriorityToJiraPriority(priority: DevlogPriority): string {
    const mapping = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Highest"
    };
    return mapping[priority] || "Medium";
  }

  private mapDevlogPriorityToADOPriority(priority: DevlogPriority): number {
    const mapping = {
      low: 4,
      medium: 3,
      high: 2,
      critical: 1
    };
    return mapping[priority] || 3;
  }

  private mapDevlogToGitHubLabels(entry: DevlogEntry): string[] {
    const labels = [];
    
    // Add type label
    labels.push(entry.type);
    
    // Add priority label
    if (entry.priority === "high" || entry.priority === "critical") {
      labels.push("priority-high");
    }
    
    // Add status label if not todo
    if (entry.status !== "todo") {
      labels.push(`status-${entry.status}`);
    }
    
    return labels;
  }
}
