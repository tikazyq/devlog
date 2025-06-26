/**
 * MCP adapter that uses the flexible storage architecture
 */

import * as crypto from 'crypto';
import { type DevlogConfig, DevlogManager } from '@devlog/core';
import { CreateDevlogRequest, DevlogStatus, DevlogType, UpdateDevlogRequest } from '@devlog/types';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export class MCPDevlogAdapter {
  private devlogManager: DevlogManager;
  private config: DevlogConfig | null = null;

  constructor() {
    this.devlogManager = new DevlogManager();
  }

  /**
   * Initialize the adapter with appropriate storage configuration
   */
  async initialize(): Promise<void> {
    this.devlogManager = new DevlogManager();
    await this.devlogManager.initialize();
  }

  async createDevlog(args: CreateDevlogRequest): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.createDevlog(args);

    return {
      content: [
        {
          type: 'text',
          text: `Created devlog entry: ${entry.id}\nTitle: ${entry.title}\nType: ${entry.type}\nPriority: ${entry.priority}\nStatus: ${entry.status}\n\nBusiness Context: ${entry.context.businessContext}\nTechnical Context: ${entry.context.technicalContext}`,
        },
      ],
    };
  }

  async updateDevlog(args: UpdateDevlogRequest): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.updateDevlog(args);

    return {
      content: [
        {
          type: 'text',
          text: `Updated devlog entry: ${entry.id}\nTitle: ${entry.title}\nStatus: ${entry.status}\nLast Updated: ${entry.updatedAt}\n\nTotal Notes: ${entry.notes.length}`,
        },
      ],
    };
  }

  async getDevlog(args: { id: number }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.getDevlog(args.id);

    if (!entry) {
      return {
        content: [
          {
            type: 'text',
            text: `Devlog entry '${args.id}' not found.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(entry, null, 2),
        },
      ],
    };
  }

  async listDevlogs(args: any = {}): Promise<CallToolResult> {
    await this.ensureInitialized();

    const filter = {
      status: args.status ? [args.status] : undefined,
      type: args.type ? [args.type] : undefined,
      priority: args.priority ? [args.priority] : undefined,
    };

    const entries = await this.devlogManager.listDevlogs(filter);

    if (entries.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No devlog entries found matching the criteria.',
          },
        ],
      };
    }

    const summary = entries
      .map(
        (entry) =>
          `- [${entry.status}] ${entry.title} (${entry.type}, ${entry.priority}) - ${entry.id}`,
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${entries.length} devlog entries:\n\n${summary}`,
        },
      ],
    };
  }

  async searchDevlogs(args: { query: string }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entries = await this.devlogManager.searchDevlogs(args.query);

    if (entries.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No devlog entries found matching query: "${args.query}"`,
          },
        ],
      };
    }

    const summary = entries
      .map(
        (entry) =>
          `- [${entry.status}] ${entry.title} (${entry.type}, ${entry.priority}) - ${entry.id}`,
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${entries.length} devlog entries matching "${args.query}":\n\n${summary}`,
        },
      ],
    };
  }

  async addDevlogNote(args: {
    id: number;
    note: string;
    category?: string;
  }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const category = (args.category as any) || 'progress';
    const entry = await this.devlogManager.addNote(args.id, args.note, category);

    return {
      content: [
        {
          type: 'text',
          text: `Added ${category} note to devlog '${entry.id}':\n${args.note}\n\nTotal notes: ${entry.notes.length}`,
        },
      ],
    };
  }

  async addDecision(args: {
    id: number;
    decision: string;
    rationale: string;
    decisionMaker: string;
    alternatives?: string[];
  }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.getDevlog(args.id);
    if (!entry) {
      return {
        content: [
          {
            type: 'text',
            text: `Devlog entry '${args.id}' not found.`,
          },
        ],
        isError: true,
      };
    }

    const decision = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      decision: args.decision,
      rationale: args.rationale,
      alternatives: args.alternatives,
      decisionMaker: args.decisionMaker,
    };

    entry.context.decisions.push(decision);

    // Update the entry to trigger save
    const updated = await this.devlogManager.updateDevlog({
      id: args.id,
      // Use a field that exists in UpdateDevlogRequest to trigger save
      tags: entry.tags,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Added decision to devlog '${args.id}':\nDecision: ${args.decision}\nRationale: ${args.rationale}\nDecision Maker: ${args.decisionMaker}`,
        },
      ],
    };
  }

  async completeDevlog(args: { id: number; summary?: string }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.completeDevlog(args.id, args.summary);

    return {
      content: [
        {
          type: 'text',
          text: `Completed devlog '${entry.id}': ${entry.title}\nStatus: ${entry.status}\nCompletion summary: ${args.summary || 'None provided'}`,
        },
      ],
    };
  }

  async getActiveContext(args: { limit?: number } = {}): Promise<CallToolResult> {
    await this.ensureInitialized();

    const filter = {
      status: ['todo', 'in-progress', 'review', 'testing'] as any[],
    };

    const entries = await this.devlogManager.listDevlogs(filter);
    const limited = entries.slice(0, args.limit || 10);

    if (limited.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No active devlog entries found.',
          },
        ],
      };
    }

    const summary = limited
      .map((entry) => {
        const recentNotes = entry.notes.slice(-2);
        const notesText =
          recentNotes.length > 0
            ? `\n  Recent notes: ${recentNotes.map((n) => n.content).join('; ')}`
            : '';

        return `- [${entry.status}] ${entry.title} (${entry.type}, ${entry.priority})${notesText}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `${limited.length} active devlog entries:\n\n${summary}`,
        },
      ],
    };
  }

  async getContextForAI(args: { id: number }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const entry = await this.devlogManager.getContextForAI(args.id);

    if (!entry) {
      return {
        content: [
          {
            type: 'text',
            text: `Devlog entry '${args.id}' not found.`,
          },
        ],
        isError: true,
      };
    }

    const context = {
      id: entry.id,
      title: entry.title,
      type: entry.type,
      status: entry.status,
      priority: entry.priority,
      description: entry.description,
      context: entry.context,
      aiContext: entry.aiContext,
      recentNotes: entry.notes.slice(-5),
      totalNotes: entry.notes.length,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context, null, 2),
        },
      ],
    };
  }

  async updateAIContext(args: {
    id: number;
    summary?: string;
    insights?: string[];
    questions?: string[];
    patterns?: string[];
    nextSteps?: string[];
  }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const contextUpdate: any = {};

    if (args.summary) contextUpdate.currentSummary = args.summary;
    if (args.insights) contextUpdate.keyInsights = args.insights;
    if (args.questions) contextUpdate.openQuestions = args.questions;
    if (args.patterns) contextUpdate.relatedPatterns = args.patterns;
    if (args.nextSteps) contextUpdate.suggestedNextSteps = args.nextSteps;

    contextUpdate.lastAIUpdate = new Date().toISOString();
    contextUpdate.contextVersion = (contextUpdate.contextVersion || 0) + 1;

    const entry = await this.devlogManager.updateAIContext(args.id, contextUpdate);

    return {
      content: [
        {
          type: 'text',
          text: `Updated AI context for devlog '${entry.id}':\n${JSON.stringify(contextUpdate, null, 2)}`,
        },
      ],
    };
  }

  async dispose(): Promise<void> {
    if (this.devlogManager) {
      await this.devlogManager.dispose();
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }
  }

  async discoverRelatedDevlogs(args: {
    workDescription: string;
    workType: DevlogType;
    keywords?: string[];
    scope?: string;
  }): Promise<CallToolResult> {
    await this.ensureInitialized();

    const discoveryResult = await this.devlogManager.discoverRelatedDevlogs(args);

    if (discoveryResult.relatedEntries.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text:
              `No related devlog entries found for:\n` +
              `Work: ${args.workDescription}\n` +
              `Type: ${args.workType}\n` +
              `Keywords: ${args.keywords?.join(', ') || 'None'}\n` +
              `Scope: ${args.scope || 'N/A'}\n\n` +
              `✅ Safe to create a new devlog entry - no overlapping work detected.`,
          },
        ],
      };
    }

    // Generate detailed analysis
    const analysis = discoveryResult.relatedEntries
      .slice(0, 10)
      .map(({ entry, relevance, matchedTerms }) => {
        const statusEmoji: Record<DevlogStatus, string> = {
          todo: '📋',
          'in-progress': '🔄',
          review: '👀',
          testing: '🧪',
          done: '✅',
          archived: '📦',
        };

        return (
          `${statusEmoji[entry.status]} **${entry.title}** (${entry.type})\n` +
          `   ID: ${entry.id}\n` +
          `   Status: ${entry.status} | Priority: ${entry.priority}\n` +
          `   Relevance: ${relevance} (matched: ${matchedTerms.join(', ')})\n` +
          `   Description: ${entry.description.substring(0, 150)}${entry.description.length > 150 ? '...' : ''}\n` +
          `   Last Updated: ${new Date(entry.updatedAt).toLocaleDateString()}\n`
        );
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text:
            `## Discovery Analysis for: "${args.workDescription}"\n\n` +
            `**Search Parameters:**\n` +
            `- Type: ${args.workType}\n` +
            `- Keywords: ${args.keywords?.join(', ') || 'None'}\n` +
            `- Scope: ${args.scope || 'Not specified'}\n\n` +
            `**Found ${discoveryResult.relatedEntries.length} related entries:**\n\n${analysis}\n\n${discoveryResult.recommendation}`,
        },
      ],
    };
  }
}
