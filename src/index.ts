#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { DevlogManager } from "./devlog-manager.js";

const server = new Server(
  {
    name: "devlog-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const devlogManager = new DevlogManager();

// Define available tools
const tools: Tool[] = [
  {
    name: "create_devlog",
    description: "Create a new devlog entry for a task, feature, or bugfix",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Unique identifier for the devlog entry",
        },
        title: {
          type: "string",
          description: "Title of the task/feature/bugfix",
        },
        type: {
          type: "string",
          enum: ["feature", "bugfix", "task", "refactor", "docs"],
          description: "Type of work being done",
        },
        description: {
          type: "string",
          description: "Detailed description of the work",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Priority level",
          default: "medium",
        },
      },
      required: ["id", "title", "type", "description"],
    },
  },
  {
    name: "update_devlog",
    description: "Update an existing devlog entry with progress, notes, or status changes",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to update",
        },
        status: {
          type: "string",
          enum: ["todo", "in-progress", "blocked", "review", "testing", "done"],
          description: "Current status of the task",
        },
        progress: {
          type: "string",
          description: "Progress notes or updates",
        },
        blockers: {
          type: "string",
          description: "Any blockers or issues encountered",
        },
        next_steps: {
          type: "string",
          description: "Next steps to take",
        },
        files_changed: {
          type: "array",
          items: { type: "string" },
          description: "List of files that were modified",
        },
        code_changes: {
          type: "string",
          description: "Summary of code changes made",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_devlogs",
    description: "List all devlog entries with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["todo", "in-progress", "blocked", "review", "testing", "done"],
          description: "Filter by status",
        },
        type: {
          type: "string",
          enum: ["feature", "bugfix", "task", "refactor", "docs"],
          description: "Filter by type",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Filter by priority",
        },
      },
    },
  },
  {
    name: "get_devlog",
    description: "Get detailed information about a specific devlog entry",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to retrieve",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "search_devlogs",
    description: "Search devlog entries by keywords in title, description, or notes",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "add_devlog_note",
    description: "Add a timestamped note to an existing devlog entry",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry",
        },
        note: {
          type: "string",
          description: "Note to add",
        },
        category: {
          type: "string",
          enum: ["progress", "issue", "solution", "idea", "reminder"],
          description: "Category of the note",
          default: "progress",
        },
      },
      required: ["id", "note"],
    },
  },
  {
    name: "complete_devlog",
    description: "Mark a devlog entry as completed and archive it",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to complete",
        },
        summary: {
          type: "string",
          description: "Completion summary",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_active_context",
    description: "Get a summary of all active devlog entries for AI context",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of entries to return",
          default: 10,
        },
      },
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_devlog":
        return await devlogManager.createDevlog(args);

      case "update_devlog":
        return await devlogManager.updateDevlog(args);

      case "list_devlogs":
        return await devlogManager.listDevlogs(args);

      case "get_devlog":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogManager.getDevlog(args.id as string);

      case "search_devlogs":
        if (!args || typeof args !== 'object' || !('query' in args)) {
          throw new Error("Missing required parameter: query");
        }
        return await devlogManager.searchDevlogs(args.query as string);

      case "add_devlog_note":
        return await devlogManager.addNote(args);

      case "complete_devlog":
        return await devlogManager.completeDevlog(args);

      case "get_active_context":
        const limit = args && typeof args === 'object' && 'limit' in args ? args.limit as number : undefined;
        return await devlogManager.getActiveContext(limit);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Devlog MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
