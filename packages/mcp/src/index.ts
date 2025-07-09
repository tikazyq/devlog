#!/usr/bin/env node

/**
 * MCP Server with flexible storage architecture
 * Supports multiple storage backends: JSON, SQLite, PostgreSQL, MySQL, Enterprise
 */

// Load environment variables from .env file
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPDevlogAdapter } from './mcp-adapter.js';

const server = new Server(
  {
    name: 'devlog-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Initialize the adapter
const adapter = new MCPDevlogAdapter();

// Tool definitions
const tools: Tool[] = [
  {
    name: 'create_devlog',
    description: 'Create a new devlog entry for a task, feature, or bugfix with rich context',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the task/feature/bugfix',
        },
        type: {
          type: 'string',
          enum: ['feature', 'bugfix', 'task', 'refactor', 'docs'],
          description: 'Type of work being done',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the work',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
          description: 'Priority level',
        },
        businessContext: {
          type: 'string',
          description: 'Business context - why this work matters and what problem it solves',
        },
        technicalContext: {
          type: 'string',
          description: 'Technical context - architecture decisions, constraints, assumptions',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Acceptance criteria or definition of done',
        },
        initialInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initial insights or knowledge about this work',
        },
        relatedPatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related patterns or examples from other projects',
        },
      },
      required: ['title', 'type', 'description'],
    },
  },
  {
    name: 'discover_related_devlogs',
    description:
      'Comprehensively search for existing devlog entries related to planned work before creating new entries. Returns detailed analysis of relevant historical context to prevent duplicate work.',
    inputSchema: {
      type: 'object',
      properties: {
        workDescription: {
          type: 'string',
          description: 'Detailed description of the work you plan to do',
        },
        workType: {
          type: 'string',
          enum: ['feature', 'bugfix', 'task', 'refactor', 'docs'],
          description: 'Type of work being planned',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key terms, technologies, components, or concepts involved in the work',
        },
        scope: {
          type: 'string',
          description: 'Scope or area of the codebase this work affects',
        },
      },
      required: ['workDescription', 'workType'],
    },
  },
  {
    name: 'update_devlog',
    description: 'Update an existing devlog entry with progress, notes, or status changes',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry to update',
        },
        status: {
          type: 'string',
          enum: ['new', 'in-progress', 'blocked', 'in-review', 'testing', 'done', 'closed'],
          description: 'Current status of the task',
        },
        blockers: {
          type: 'string',
          description: 'Any blockers or issues encountered',
        },
        nextSteps: {
          type: 'string',
          description: 'Next steps to take',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files that were modified',
        },
        businessContext: {
          type: 'string',
          description: 'Business context - why this work matters and what problem it solves',
        },
        technicalContext: {
          type: 'string',
          description: 'Technical context - architecture decisions, constraints, assumptions',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Acceptance criteria or definition of done',
        },
        initialInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initial insights or knowledge about this work',
        },
        relatedPatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related patterns or examples from other projects',
        },
        // AI context fields (embedded from update_ai_context)
        currentSummary: {
          type: 'string',
          description: 'Updated summary of current understanding',
        },
        keyInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key insights or learnings',
        },
        openQuestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Open questions that need resolution',
        },
        suggestedNextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested next steps based on current progress',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_devlog',
    description: 'Get detailed information about a specific devlog entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_devlogs',
    description: 'List all devlog entries with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['new', 'in-progress', 'blocked', 'in-review', 'testing', 'done', 'closed'],
          description: 'Filter by status',
        },
        type: {
          type: 'string',
          enum: ['feature', 'bugfix', 'task', 'refactor', 'docs'],
          description: 'Filter by type',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Filter by priority',
        },
      },
    },
  },
  {
    name: 'search_devlogs',
    description: 'Search devlog entries by keywords in title, description, or notes',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_devlog_note',
    description: 'Add a timestamped note to an existing devlog entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry',
        },
        note: {
          type: 'string',
          description: 'Note content',
        },
        category: {
          type: 'string',
          enum: ['progress', 'issue', 'solution', 'idea', 'reminder'],
          default: 'progress',
          description: 'Category of the note',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files related to this note',
        },
        codeChanges: {
          type: 'string',
          description: 'Summary of code changes made',
        },
      },
      required: ['id', 'note'],
    },
  },
  {
    name: 'update_devlog_with_progress',
    description: 'Update devlog status/fields and add a progress note in one operation',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry',
        },
        status: {
          type: 'string',
          enum: ['new', 'in-progress', 'in-review', 'blocked', 'testing', 'done', 'closed'],
          description: 'New status for the devlog entry',
        },
        progress: {
          type: 'string',
          description: 'Progress note content',
        },
        codeChanges: {
          type: 'string',
          description: 'Summary of code changes made',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files modified in this update',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Updated priority level',
        },
      },
      required: ['id', 'progress'],
    },
  },
  {
    name: 'add_decision',
    description: 'Record a decision with rationale for a devlog entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry',
        },
        decision: {
          type: 'string',
          description: 'The decision that was made',
        },
        rationale: {
          type: 'string',
          description: 'Why this decision was made',
        },
        decisionMaker: {
          type: 'string',
          description: "Who made the decision (human name or 'ai-agent')",
        },
        alternatives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Other options that were considered',
        },
      },
      required: ['id', 'decision', 'rationale', 'decisionMaker'],
    },
  },
  {
    name: 'complete_devlog',
    description: 'Mark a devlog entry as completed and archive it',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry to complete',
        },
        summary: {
          type: 'string',
          description: 'Completion summary',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_active_context',
    description: 'Get a summary of all active devlog entries for AI context',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 10,
          description: 'Maximum number of entries to return',
        },
      },
    },
  },
  {
    name: 'get_context_for_ai',
    description: 'Get comprehensive AI-optimized context for a devlog entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry to get context for',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_ai_context',
    description:
      '[DEPRECATED] Update AI context for a devlog entry. Use update_devlog with AI context fields instead. This tool will be removed in v2.0.0.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Numeric ID of the devlog entry to update',
        },
        summary: {
          type: 'string',
          description: 'Updated summary of current understanding',
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'New insights or key learnings',
        },
        questions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Open questions that need resolution',
        },
        patterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related patterns discovered from other projects',
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested next steps based on current progress',
        },
      },
      required: ['id'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_devlog':
        return await adapter.createDevlog(args as any);

      case 'discover_related_devlogs':
        return await adapter.discoverRelatedDevlogs(args as any);

      case 'update_devlog':
        return await adapter.updateDevlog(args as any);

      case 'get_devlog':
        return await adapter.getDevlog(args as any);

      case 'list_devlogs':
        return await adapter.listDevlogs(args as any);

      case 'search_devlogs':
        return await adapter.searchDevlogs(args as any);

      case 'add_devlog_note':
        return await adapter.addDevlogNote(args as any);

      case 'update_devlog_with_progress':
        return await adapter.updateDevlogWithProgress(args as any);

      case 'add_decision':
        return await adapter.addDecision(args as any);

      case 'complete_devlog':
        return await adapter.completeDevlog(args as any);

      case 'get_active_context':
        return await adapter.getActiveContext(args as any);

      case 'get_context_for_ai':
        return await adapter.getContextForAI(args as any);

      case 'update_ai_context':
        return await adapter.updateAIContext(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Devlog MCP Server started with flexible storage architecture');
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.error('Shutting down server...');
  await adapter.dispose();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down server...');
  await adapter.dispose();
  process.exit(0);
});

main().catch(console.error);
