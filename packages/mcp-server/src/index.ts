#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { MCPDevlogAdapter } from "./mcp-adapter.js";
import { EnterpriseIntegration } from "@devlog/types";
import * as fs from "fs";
import * as path from "path";

// Load integrations config if available
function loadIntegrationsConfig(): EnterpriseIntegration | undefined {
  const configPaths = [
    "devlog.config.json",
    "devlog-integrations.config.json", // backward compatibility
    ".devlog/integrations.config.json",
    path.join(process.env.HOME || "~", ".devlog.config.json"),
    path.join(process.env.HOME || "~", ".devlog-integrations.config.json") // backward compatibility
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configContent);
        console.error(`Loaded integrations config from: ${configPath}`);
        return config.integrations;
      }
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error);
    }
  }

  console.error("No integrations config found. External sync features disabled.");
  return undefined;
}

// Find the best location for .devlog directory based on context
function findDevlogDirectory(): string {
  // Check for user configuration first
  const configuredPath = process.env.DEVLOG_DIR;
  if (configuredPath) {
    console.error(`Using configured devlog directory: ${configuredPath}`);
    return configuredPath;
  }

  let currentDir = process.cwd();
  
  // Strategy 1: If we're in the devlog project itself, use its root
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    const pnpmWorkspacePath = path.join(currentDir, "pnpm-workspace.yaml");
    
    // Check if this is the devlog project by looking for specific markers
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        
        // This is the devlog project itself if it has our specific package name
        if (packageJson.name === "devlog" && packageJson.description?.includes("development logging tools")) {
          const devlogDir = path.join(currentDir, ".devlog");
          console.error(`Detected devlog project development, using project .devlog: ${devlogDir}`);
          return devlogDir;
        }
        
        // Check if this is a workspace root with the devlog project
        if (packageJson.workspaces || fs.existsSync(pnpmWorkspacePath)) {
          // Look for devlog-specific packages in workspace
          const packagesDir = path.join(currentDir, "packages");
          if (fs.existsSync(packagesDir)) {
            const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
              .filter(dirent => dirent.isDirectory())
              .map(dirent => dirent.name);
            
            if (packages.includes("mcp-server") && packages.includes("core") && packages.includes("types")) {
              const devlogDir = path.join(currentDir, ".devlog");
              console.error(`Detected devlog monorepo, using workspace .devlog: ${devlogDir}`);
              return devlogDir;
            }
          }
        }
      } catch (error) {
        // Continue searching if package.json is invalid
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Strategy 2: Find the nearest project root for external projects
  currentDir = process.cwd();
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    const gitPath = path.join(currentDir, ".git");
    
    // If we find a package.json or .git, this is likely a project root
    if (fs.existsSync(packageJsonPath) || fs.existsSync(gitPath)) {
      const devlogDir = path.join(currentDir, ".devlog");
      console.error(`Found project root, using project-local .devlog: ${devlogDir}`);
      return devlogDir;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Strategy 3: Fall back to global ~/.devlog if no project context found
  const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
  const globalDevlogDir = path.join(homeDir, ".devlog");
  console.error(`No project context found, using global .devlog: ${globalDevlogDir}`);
  return globalDevlogDir;
}

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

const integrations = loadIntegrationsConfig();
const devlogDirectory = findDevlogDirectory();
console.error(`Using devlog directory: ${devlogDirectory}`);
const devlogAdapter = new MCPDevlogAdapter(undefined, integrations, devlogDirectory);

// Define available tools
const tools: Tool[] = [
  {
    name: "create_devlog",
    description: "Create a new devlog entry for a task, feature, or bugfix with rich context",
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
        businessContext: {
          type: "string",
          description: "Business context - why this work matters and what problem it solves",
        },
        technicalContext: {
          type: "string",
          description: "Technical context - architecture decisions, constraints, assumptions",
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description: "Acceptance criteria or definition of done",
        },
        initialInsights: {
          type: "array",
          items: { type: "string" },
          description: "Initial insights or knowledge about this work",
        },
        relatedPatterns: {
          type: "array",
          items: { type: "string" },
          description: "Related patterns or examples from other projects",
        },
      },
      required: ["title", "type", "description"],
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
  {
    name: "update_ai_context",
    description: "Update AI context for a devlog entry with insights, questions, and next steps",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to update",
        },
        summary: {
          type: "string",
          description: "Updated summary of current understanding",
        },
        insights: {
          type: "array",
          items: { type: "string" },
          description: "New insights or key learnings",
        },
        questions: {
          type: "array",
          items: { type: "string" },
          description: "Open questions that need resolution",
        },
        patterns: {
          type: "array",
          items: { type: "string" },
          description: "Related patterns discovered from other projects",
        },
        nextSteps: {
          type: "array",
          items: { type: "string" },
          description: "Suggested next steps based on current progress",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "add_decision",
    description: "Record a decision with rationale for a devlog entry",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry",
        },
        decision: {
          type: "string",
          description: "The decision that was made",
        },
        rationale: {
          type: "string",
          description: "Why this decision was made",
        },
        alternatives: {
          type: "array",
          items: { type: "string" },
          description: "Other options that were considered",
        },
        decisionMaker: {
          type: "string",
          description: "Who made the decision (human name or 'ai-agent')",
        },
      },
      required: ["id", "decision", "rationale", "decisionMaker"],
    },
  },
  {
    name: "get_context_for_ai",
    description: "Get comprehensive AI-optimized context for a devlog entry",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to get context for",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sync_with_jira",
    description: "Sync a devlog entry with Jira (create or update issue)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to sync",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sync_with_ado",
    description: "Sync a devlog entry with Azure DevOps (create or update work item)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to sync",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sync_with_github",
    description: "Sync a devlog entry with GitHub (create or update issue)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to sync",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sync_all_integrations",
    description: "Sync a devlog entry with all configured integrations",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to sync",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sync_with_github_project",
    description: "Sync a devlog entry with GitHub Project (create or update project item)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the devlog entry to sync",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "import_github_project_items",
    description: "Import existing GitHub project items as devlog entries",
    inputSchema: {
      type: "object",
      properties: {
        projectNumber: {
          type: "number",
          description: "GitHub project number (optional, uses configured project if not provided)",
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
        if (!args || typeof args !== 'object') {
          throw new Error("Missing or invalid arguments");
        }
        return await devlogAdapter.createDevlog(args as any);

      case "update_devlog":
        return await devlogAdapter.updateDevlog(args);

      case "list_devlogs":
        return await devlogAdapter.listDevlogs(args);

      case "get_devlog":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.getDevlog(args.id as string);

      case "search_devlogs":
        if (!args || typeof args !== 'object' || !('query' in args)) {
          throw new Error("Missing required parameter: query");
        }
        return await devlogAdapter.searchDevlogs(args.query as string);

      case "add_devlog_note":
        return await devlogAdapter.addNote(args);

      case "complete_devlog":
        return await devlogAdapter.completeDevlog(args);

      case "get_active_context":
        const limit = args && typeof args === 'object' && 'limit' in args ? args.limit as number : undefined;
        return await devlogAdapter.getActiveContext(limit);

      case "update_ai_context":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.updateAIContext(args as any);

      case "add_decision":
        if (!args || typeof args !== 'object') {
          throw new Error("Missing or invalid arguments");
        }
        return await devlogAdapter.addDecision(args as any);

      case "get_context_for_ai":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.getContextForAI(args as any);

      case "sync_with_jira":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.syncWithJira(args.id as string);

      case "sync_with_ado":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.syncWithADO(args.id as string);

      case "sync_with_github":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.syncWithGitHub(args.id as string);

      case "sync_all_integrations":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.syncAllIntegrations(args.id as string);

      case "sync_with_github_project":
        if (!args || typeof args !== 'object' || !('id' in args)) {
          throw new Error("Missing required parameter: id");
        }
        return await devlogAdapter.syncWithGitHubProject(args.id as string);

      case "import_github_project_items":
        return await devlogAdapter.importGitHubProjectItems(args);

      case "find_or_create_devlog":
        if (!args || typeof args !== 'object') {
          throw new Error("Missing or invalid arguments");
        }
        return await devlogAdapter.findOrCreateDevlog(args as any);

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
