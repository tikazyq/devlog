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
} from '@modelcontextprotocol/sdk/types.js';
import { MCPDevlogAdapter } from './mcp-adapter.js';
import { allTools } from './tools/index.js';

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
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

      case 'update_devlog_with_note':
        return await adapter.updateDevlogWithNote(args as any);

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
