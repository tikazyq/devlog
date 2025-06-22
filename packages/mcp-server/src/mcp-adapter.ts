import { DevlogManager, DevlogEntry } from "@devlog/core";
import { CreateDevlogRequest, UpdateDevlogRequest, EnterpriseIntegration } from "@devlog/types";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Adapter class that wraps DevlogManager and converts responses to MCP format
 */
export class MCPDevlogAdapter {
  private devlogManager: DevlogManager;

  constructor(workspaceRoot?: string, integrations?: EnterpriseIntegration) {
    this.devlogManager = new DevlogManager({ workspaceRoot, integrations });
  }

  async createDevlog(args: CreateDevlogRequest): Promise<CallToolResult> {
    const entry = await this.devlogManager.createDevlog(args);
    
    return {
      content: [
        {
          type: "text",
          text: `Created devlog entry: ${entry.id}\nTitle: ${entry.title}\nType: ${entry.type}\nPriority: ${entry.priority}\nStatus: ${entry.status}\n\nBusiness Context: ${entry.context.businessContext}\nTechnical Context: ${entry.context.technicalContext}`,
        },
      ],
    };
  }

  async updateDevlog(args: any): Promise<CallToolResult> {
    // Convert old format to new UpdateDevlogRequest format
    const updateRequest: UpdateDevlogRequest = {
      id: args.id,
      status: args.status,
      files: args.files_changed,
      progress: args.progress,
      codeChanges: args.code_changes,
      noteCategory: "progress"
    };

    // Handle legacy fields
    if (args.blockers) {
      await this.devlogManager.addNote(args.id, {
        category: "issue",
        content: `Blockers: ${args.blockers}`
      });
    }

    if (args.next_steps) {
      await this.devlogManager.updateAIContext({
        id: args.id,
        nextSteps: args.next_steps.split('\n').filter((step: string) => step.trim())
      });
    }

    const entry = await this.devlogManager.updateDevlog(updateRequest);

    return {
      content: [
        {
          type: "text",
          text: `Updated devlog entry: ${entry.id}\nStatus: ${entry.status}\nLast updated: ${entry.updatedAt}`,
        },
      ],
    };
  }

  async listDevlogs(filters: any = {}): Promise<CallToolResult> {
    const entries = await this.devlogManager.listDevlogs(filters);

    const summary = entries.map((entry: DevlogEntry) => 
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

  async getDevlog(id: string): Promise<CallToolResult> {
    const entry = await this.devlogManager.getDevlog(id);
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
      entry.context.acceptanceCriteria.length ? `\nAcceptance Criteria:\n${entry.context.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n')}` : null,
      entry.files.length ? `\nFiles Changed:\n${entry.files.join(", ")}` : null,
    ].filter(Boolean).join("\n");

    let notesText = "";
    if (entry.notes.length > 0) {
      notesText = "\n\nNotes:\n" + entry.notes.map((note: any) => 
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

  async searchDevlogs(query: string): Promise<CallToolResult> {
    const matches = await this.devlogManager.searchDevlogs(query);

    const summary = matches.map((entry: DevlogEntry) => 
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

  async addNote(args: any): Promise<CallToolResult> {
    const entry = await this.devlogManager.addNote(args.id, {
      category: args.category || "progress",
      content: args.note,
      files: args.files
    });

    // Build the output text
    const lastNote = entry.notes[entry.notes.length - 1];
    let outputText = `Added note to devlog '${entry.id}':\n[${lastNote.timestamp}] (${lastNote.category}): ${lastNote.content}`;
    
    // Include files in output if they were provided
    if (lastNote.files && lastNote.files.length > 0) {
      outputText += `\nFiles: ${lastNote.files.join(', ')}`;
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

  async completeDevlog(args: any): Promise<CallToolResult> {
    const entry = await this.devlogManager.completeDevlog(args.id, args.summary);

    return {
      content: [
        {
          type: "text",
          text: `Completed devlog entry: ${entry.id}\nTitle: ${entry.title}\nCompleted at: ${entry.updatedAt}`,
        },
      ],
    };
  }

  async getActiveContext(limit: number = 10): Promise<CallToolResult> {
    const contextEntries = await this.devlogManager.getActiveContext(limit);
    
    const context = contextEntries.map((entry: DevlogEntry) => {
      const recentNotes = entry.notes.slice(-2).map((note: any) => 
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
  }): Promise<CallToolResult> {
    const entry = await this.devlogManager.updateAIContext(args);

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
  }): Promise<CallToolResult> {
    const entry = await this.devlogManager.addDecision(args);

    return {
      content: [
        {
          type: "text",
          text: `Added decision to devlog: ${args.id}\nDecision: ${args.decision}\nRationale: ${args.rationale}\nMade by: ${args.decisionMaker}`,
        },
      ],
    };
  }

  async getContextForAI(args: { id: string }): Promise<CallToolResult> {
    const entry = await this.devlogManager.getDevlog(args.id);
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

  // Enterprise Integration Methods

  async syncWithJira(id: string): Promise<CallToolResult> {
    try {
      const entry = await this.devlogManager.syncWithJira(id);
      const jiraRef = entry.externalReferences?.find(ref => ref.system === "jira");
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully synced devlog ${entry.id} with Jira.\n\nJira Issue: ${jiraRef?.id}\nURL: ${jiraRef?.url}\nStatus: ${jiraRef?.status}\nLast Sync: ${jiraRef?.lastSync}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to sync with Jira: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async syncWithADO(id: string): Promise<CallToolResult> {
    try {
      const entry = await this.devlogManager.syncWithADO(id);
      const adoRef = entry.externalReferences?.find(ref => ref.system === "ado");
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully synced devlog ${entry.id} with Azure DevOps.\n\nWork Item: ${adoRef?.id}\nURL: ${adoRef?.url}\nStatus: ${adoRef?.status}\nLast Sync: ${adoRef?.lastSync}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to sync with Azure DevOps: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async syncWithGitHub(id: string): Promise<CallToolResult> {
    try {
      const entry = await this.devlogManager.syncWithGitHub(id);
      const githubRef = entry.externalReferences?.find(ref => ref.system === "github");
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully synced devlog ${entry.id} with GitHub.\n\nIssue: #${githubRef?.id}\nURL: ${githubRef?.url}\nStatus: ${githubRef?.status}\nLast Sync: ${githubRef?.lastSync}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to sync with GitHub: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async syncAllIntegrations(id: string): Promise<CallToolResult> {
    try {
      const entry = await this.devlogManager.syncAllIntegrations(id);
      const syncedSystems = entry.externalReferences?.map(ref => `${ref.system}: ${ref.id}`).join(", ") || "none";
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully synced devlog ${entry.id} with all configured integrations.\n\nSynced Systems: ${syncedSystems}\nLast Updated: ${entry.updatedAt}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to sync with integrations: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async findOrCreateDevlog(args: any): Promise<CallToolResult> {
    try {
      const result = await this.devlogManager.findOrCreateDevlog(args as any);
      const action = result.created ? "Created" : "Found existing";
      
      return {
        content: [
          {
            type: "text",
            text: `${action} devlog entry: ${result.entry.id}\nTitle: ${result.entry.title}\nType: ${result.entry.type}\nPriority: ${result.entry.priority}\nStatus: ${result.entry.status}\n\nBusiness Context: ${result.entry.context.businessContext}\nTechnical Context: ${result.entry.context.technicalContext}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to find or create devlog: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }
}
