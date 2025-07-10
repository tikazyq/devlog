import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * AI context management and optimization operations
 */
export const aiContextTools: Tool[] = [
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
