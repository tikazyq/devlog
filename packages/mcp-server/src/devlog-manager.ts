import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { DevlogEntry, DevlogNote, AIContext, DevlogContext, CreateDevlogRequest } from "@devlog/types";

export class DevlogManager {
  private devlogDir: string;
  private indexFile: string;

  constructor(workspaceRoot?: string) {
    // If no workspace root provided, use current working directory
    const root = workspaceRoot || process.cwd();
    this.devlogDir = path.join(root, ".devlog");
    this.indexFile = path.join(this.devlogDir, "index.json");
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

  private generateId(title: string): string {
    const timestamp = Date.now();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);
    return `${slug}-${timestamp}`;
  }

  async createDevlog(args: CreateDevlogRequest): Promise<any> {
    const id = args.id || this.generateId(args.title);
    const now = new Date().toISOString();

    // Check if ID already exists
    const existing = await this.loadDevlog(id);
    if (existing) {
      throw new Error(`Devlog with ID '${id}' already exists`);
    }

    const entry: DevlogEntry = {
      id,
      title: args.title,
      type: args.type,
      description: args.description,
      priority: args.priority || "medium",
      status: "todo",
      createdAt: now,
      updatedAt: now,
      assignee: args.assignee,
      tags: args.tags || [],
      notes: [],
      files: [],
      relatedDevlogs: [],
      estimatedHours: args.estimatedHours,
      actualHours: undefined,
      
      // Enhanced context for AI agents
      context: {
        businessContext: args.businessContext || "",
        technicalContext: args.technicalContext || "",
        dependencies: [],
        decisions: [],
        acceptanceCriteria: args.acceptanceCriteria || [],
        risks: [],
      },
      
      // AI-specific context
      aiContext: {
        currentSummary: `New ${args.type}: ${args.title}. ${args.description}`,
        keyInsights: args.initialInsights || [],
        openQuestions: [],
        relatedPatterns: args.relatedPatterns || [],
        suggestedNextSteps: [],
        lastAIUpdate: now,
        contextVersion: 1,
      },
      
      // Enterprise references (optional for now)
      externalReferences: [],
    };

    await this.saveDevlog(entry);

    return {
      content: [
        {
          type: "text",
          text: `Created devlog entry: ${id}\nTitle: ${entry.title}\nType: ${entry.type}\nPriority: ${entry.priority}\nStatus: ${entry.status}\n\nBusiness Context: ${entry.context.businessContext}\nTechnical Context: ${entry.context.technicalContext}`,
        },
      ],
    };
  }

  async updateDevlog(args: any): Promise<any> {
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    // Update fields if provided
    if (args.status) entry.status = args.status;
    if (args.files_changed) entry.files = args.files_changed;
    
    // Add notes for progress updates
    if (args.progress || args.blockers || args.next_steps || args.code_changes) {
      const now = new Date().toISOString();
      
      if (args.progress) {
        entry.notes.push({
          id: `note-${Date.now()}`,
          timestamp: now,
          category: "progress",
          content: args.progress
        });
      }
      
      if (args.blockers) {
        entry.notes.push({
          id: `note-${Date.now() + 1}`,
          timestamp: now,
          category: "issue",
          content: `Blockers: ${args.blockers}`
        });
      }
      
      if (args.next_steps) {
        entry.aiContext.suggestedNextSteps = args.next_steps.split('\n').filter((step: string) => step.trim());
      }
      
      if (args.code_changes) {
        entry.notes.push({
          id: `note-${Date.now() + 2}`,
          timestamp: now,
          category: "solution",
          content: `Code changes: ${args.code_changes}`
        });
      }
    }

    entry.updatedAt = new Date().toISOString();

    await this.saveDevlog(entry);

    return {
      content: [
        {
          type: "text",
          text: `Updated devlog entry: ${entry.id}\nStatus: ${entry.status}\nLast updated: ${entry.updatedAt}`,
        },
      ],
    };
  }

  async listDevlogs(filters: any = {}): Promise<any> {
    const index = await this.loadIndex();
    const entries: DevlogEntry[] = [];

    for (const id of Object.keys(index)) {
      const entry = await this.loadDevlog(id);
      if (entry) {
        // Apply filters
        if (filters.status) {
          const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statusArray.includes(entry.status)) continue;
        }
        if (filters.type) {
          const typeArray = Array.isArray(filters.type) ? filters.type : [filters.type];
          if (!typeArray.includes(entry.type)) continue;
        }
        if (filters.priority) {
          const priorityArray = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
          if (!priorityArray.includes(entry.priority)) continue;
        }
        
        entries.push(entry);
      }
    }

    // Sort by updatedAt descending
    entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const summary = entries.map(entry => 
      `ID: ${entry.id}\nTitle: ${entry.title}\nType: ${entry.type}\nStatus: ${entry.status}\nPriority: ${entry.priority}\nUpdated: ${entry.updatedAt}\n`
    ).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${entries.length} devlog entries:\n\n${summary}`,
        },
      ],
    };
  }

  async getDevlog(id: string): Promise<any> {
    const entry = await this.loadDevlog(id);
    if (!entry) {
      throw new Error(`Devlog entry '${id}' not found`);
    }

    const details = [
      `ID: ${entry.id}`,
      `Title: ${entry.title}`,
      `Type: ${entry.type}`,
      `Priority: ${entry.priority}`,
      `Status: ${entry.status}`,
      `Created: ${entry.createdAt}`,
      `Updated: ${entry.updatedAt}`,
      `\nDescription:\n${entry.description}`,
      `\nBusiness Context:\n${entry.context.businessContext}`,
      `\nTechnical Context:\n${entry.context.technicalContext}`,
      entry.context.acceptanceCriteria.length ? `\nAcceptance Criteria:\n${entry.context.acceptanceCriteria.map(c => `- ${c}`).join('\n')}` : null,
      entry.files.length ? `\nFiles Changed:\n${entry.files.join(", ")}` : null,
    ].filter(Boolean).join("\n");

    let notesText = "";
    if (entry.notes.length > 0) {
      notesText = "\n\nNotes:\n" + entry.notes.map(note => 
        `[${note.timestamp}] (${note.category}): ${note.content}`
      ).join("\n");
    }

    return {
      content: [
        {
          type: "text",
          text: details + notesText,
        },
      ],
    };
  }

  async searchDevlogs(query: string): Promise<any> {
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

    const summary = matches.map(entry => 
      `ID: ${entry.id}\nTitle: ${entry.title}\nType: ${entry.type}\nStatus: ${entry.status}\n`
    ).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${matches.length} matching devlog entries for "${query}":\n\n${summary}`,
        },
      ],
    };
  }

  async addNote(args: any): Promise<any> {
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const note: DevlogNote = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: args.category || "progress",
      content: args.note,
    };

    // Add files if provided
    if (args.files && Array.isArray(args.files) && args.files.length > 0) {
      note.files = args.files;
    }

    entry.notes.push(note);
    entry.updatedAt = new Date().toISOString();

    await this.saveDevlog(entry);

    // Build the output text
    let outputText = `Added note to devlog '${entry.id}':\n[${note.timestamp}] (${note.category}): ${note.content}`;
    
    // Include files in output if they were provided
    if (note.files && note.files.length > 0) {
      outputText += `\nFiles: ${note.files.join(', ')}`;
    }

    return {
      content: [
        {
          type: "text",
          text: outputText,
        },
      ],
    };
  }

  async completeDevlog(args: any): Promise<any> {
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const now = new Date().toISOString();
    entry.status = "done";
    entry.updatedAt = now;

    if (args.summary) {
      const completionNote: DevlogNote = {
        id: `note-${Date.now()}`,
        timestamp: now,
        category: "progress",
        content: `Completed: ${args.summary}`,
      };
      entry.notes.push(completionNote);
    }

    await this.saveDevlog(entry);

    return {
      content: [
        {
          type: "text",
          text: `Completed devlog entry: ${entry.id}\nTitle: ${entry.title}\nCompleted at: ${now}`,
        },
      ],
    };
  }

  async getActiveContext(limit: number = 10): Promise<any> {
    const index = await this.loadIndex();
    const activeEntries: DevlogEntry[] = [];

    for (const id of Object.keys(index)) {
      const entry = await this.loadDevlog(id);
      if (entry && entry.status !== "done") {
        activeEntries.push(entry);
      }
    }

    // Sort by priority and updated date
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    activeEntries.sort((a, b) => {
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const contextEntries = activeEntries.slice(0, limit);
    
    const context = contextEntries.map(entry => {
      const recentNotes = entry.notes.slice(-2).map((note: DevlogNote) => 
        `  - [${note.category}] ${note.content}`
      ).join("\n");

      return [
        `## ${entry.title} (${entry.id})`,
        `**Type:** ${entry.type} | **Priority:** ${entry.priority} | **Status:** ${entry.status}`,
        `**Description:** ${entry.description}`,
        `**Business Context:** ${entry.context.businessContext}`,
        `**AI Summary:** ${entry.aiContext.currentSummary}`,
        entry.aiContext.suggestedNextSteps.length ? `**Next Steps:** ${entry.aiContext.suggestedNextSteps.join(', ')}` : null,
        entry.files.length ? `**Files:** ${entry.files.join(", ")}` : null,
        recentNotes ? `**Recent Notes:**\n${recentNotes}` : null,
      ].filter(Boolean).join("\n");
    }).join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Active Development Context\n\nShowing ${contextEntries.length} active devlog entries:\n\n${context}`,
        },
      ],
    };
  }

  async updateAIContext(args: {
    id: string;
    summary?: string;
    insights?: string[];
    questions?: string[];
    patterns?: string[];
    nextSteps?: string[];
  }): Promise<any> {
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

    return {
      content: [
        {
          type: "text",
          text: `Updated AI context for devlog: ${args.id}\nContext version: ${entry.aiContext.contextVersion}\nSummary: ${entry.aiContext.currentSummary}`,
        },
      ],
    };
  }

  async addDecision(args: {
    id: string;
    decision: string;
    rationale: string;
    alternatives?: string[];
    decisionMaker: string;
  }): Promise<any> {
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

    return {
      content: [
        {
          type: "text",
          text: `Added decision to devlog: ${args.id}\nDecision: ${args.decision}\nRationale: ${args.rationale}\nMade by: ${args.decisionMaker}`,
        },
      ],
    };
  }

  async getContextForAI(args: { id: string }): Promise<any> {
    const entry = await this.loadDevlog(args.id);
    if (!entry) {
      throw new Error(`Devlog entry '${args.id}' not found`);
    }

    const contextSummary = {
      id: entry.id,
      title: entry.title,
      type: entry.type,
      status: entry.status,
      priority: entry.priority,
      description: entry.description,
      
      // Business and technical context
      businessContext: entry.context.businessContext,
      technicalContext: entry.context.technicalContext,
      acceptanceCriteria: entry.context.acceptanceCriteria,
      
      // Current AI understanding
      currentSummary: entry.aiContext.currentSummary,
      keyInsights: entry.aiContext.keyInsights,
      openQuestions: entry.aiContext.openQuestions,
      relatedPatterns: entry.aiContext.relatedPatterns,
      suggestedNextSteps: entry.aiContext.suggestedNextSteps,
      
      // Decisions and dependencies
      decisions: entry.context.decisions,
      dependencies: entry.context.dependencies,
      risks: entry.context.risks,
      
      // Recent activity
      recentNotes: entry.notes.slice(-3),
      filesChanged: entry.files,
      relatedDevlogs: entry.relatedDevlogs,
      
      // Metadata
      contextVersion: entry.aiContext.contextVersion,
      lastUpdate: entry.updatedAt,
    };

    return {
      content: [
        {
          type: "text",
          text: `AI Context for ${entry.id}:\n\n${JSON.stringify(contextSummary, null, 2)}`,
        },
      ],
    };
  }
}
