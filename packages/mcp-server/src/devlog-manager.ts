import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface DevlogEntry {
  id: string;
  title: string;
  type: "feature" | "bugfix" | "task" | "refactor" | "docs";
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "blocked" | "review" | "testing" | "done";
  created_at: string;
  updated_at: string;
  completed_at?: string;
  progress?: string;
  blockers?: string;
  next_steps?: string;
  files_changed?: string[];
  code_changes?: string;
  notes: DevlogNote[];
  tags?: string[];
}

export interface DevlogNote {
  timestamp: string;
  category: "progress" | "issue" | "solution" | "idea" | "reminder";
  content: string;
  files?: string[];
}

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

  async createDevlog(args: any): Promise<any> {
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
      created_at: now,
      updated_at: now,
      notes: [],
    };

    await this.saveDevlog(entry);

    return {
      content: [
        {
          type: "text",
          text: `Created devlog entry: ${id}\nTitle: ${entry.title}\nType: ${entry.type}\nPriority: ${entry.priority}\nStatus: ${entry.status}`,
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
    if (args.progress) entry.progress = args.progress;
    if (args.blockers) entry.blockers = args.blockers;
    if (args.next_steps) entry.next_steps = args.next_steps;
    if (args.files_changed) entry.files_changed = args.files_changed;
    if (args.code_changes) entry.code_changes = args.code_changes;

    entry.updated_at = new Date().toISOString();

    await this.saveDevlog(entry);

    return {
      content: [
        {
          type: "text",
          text: `Updated devlog entry: ${entry.id}\nStatus: ${entry.status}\nLast updated: ${entry.updated_at}`,
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

    // Sort by updated_at descending
    entries.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const summary = entries.map(entry => 
      `ID: ${entry.id}\nTitle: ${entry.title}\nType: ${entry.type}\nStatus: ${entry.status}\nPriority: ${entry.priority}\nUpdated: ${entry.updated_at}\n`
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
      `Created: ${entry.created_at}`,
      `Updated: ${entry.updated_at}`,
      entry.completed_at ? `Completed: ${entry.completed_at}` : null,
      `\nDescription:\n${entry.description}`,
      entry.progress ? `\nProgress:\n${entry.progress}` : null,
      entry.blockers ? `\nBlockers:\n${entry.blockers}` : null,
      entry.next_steps ? `\nNext Steps:\n${entry.next_steps}` : null,
      entry.files_changed?.length ? `\nFiles Changed:\n${entry.files_changed.join(", ")}` : null,
      entry.code_changes ? `\nCode Changes:\n${entry.code_changes}` : null,
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
          entry.progress || "",
          entry.blockers || "",
          entry.next_steps || "",
          entry.code_changes || "",
          ...entry.notes.map(note => note.content),
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
      timestamp: new Date().toISOString(),
      category: args.category || "progress",
      content: args.note,
    };

    // Add files if provided
    if (args.files && Array.isArray(args.files) && args.files.length > 0) {
      note.files = args.files;
    }

    entry.notes.push(note);
    entry.updated_at = new Date().toISOString();

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

    entry.status = "done";
    entry.completed_at = new Date().toISOString();
    entry.updated_at = entry.completed_at;

    if (args.summary) {
      const completionNote: DevlogNote = {
        timestamp: entry.completed_at,
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
          text: `Completed devlog entry: ${entry.id}\nTitle: ${entry.title}\nCompleted at: ${entry.completed_at}`,
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
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    const contextEntries = activeEntries.slice(0, limit);
    
    const context = contextEntries.map(entry => {
      const recentNotes = entry.notes.slice(-2).map(note => 
        `  - [${note.category}] ${note.content}`
      ).join("\n");

      return [
        `## ${entry.title} (${entry.id})`,
        `**Type:** ${entry.type} | **Priority:** ${entry.priority} | **Status:** ${entry.status}`,
        `**Description:** ${entry.description}`,
        entry.progress ? `**Progress:** ${entry.progress}` : null,
        entry.blockers ? `**Blockers:** ${entry.blockers}` : null,
        entry.next_steps ? `**Next Steps:** ${entry.next_steps}` : null,
        entry.files_changed?.length ? `**Files:** ${entry.files_changed.join(", ")}` : null,
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
}
