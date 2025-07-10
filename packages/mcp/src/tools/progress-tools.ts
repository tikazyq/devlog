import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Progress tracking operations - notes, decisions, and completion
 */
export const progressTools: Tool[] = [
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
          enum: ['progress', 'issue', 'solution', 'idea', 'reminder', 'feedback'],
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
    name: 'update_devlog_with_note',
    description: 'Update devlog status/fields and add a note in one operation',
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
        note: {
          type: 'string',
          description: 'Note content to add',
        },
        category: {
          type: 'string',
          enum: ['progress', 'issue', 'solution', 'idea', 'reminder', 'feedback'],
          default: 'progress',
          description: 'Category of the note being added',
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
      required: ['id', 'note'],
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
];
