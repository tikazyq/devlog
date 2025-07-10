# Devlog Development Tools - Monorepo

A monorepo containing development logging tools and utilities, including a Model Context Protocol (MCP) server for managing development logs and working notes. These tools help AI assistants maintain context about ongoing tasks, features, and bugfixes by storing structured notes in a local `.devlog` directory.

## Packages

### `@devlog/types`
Shared TypeScript types and interfaces used across all packages.

### `@devlog/core` 
Core devlog management functionality including file system operations, CRUD operations, filtering, and search. This package provides the foundation that other packages build upon.

### `@devlog/mcp`
MCP (Model Context Protocol) server that wraps the core functionality for AI assistant integration.

## Features

- **Task Management**: Create and track features, bugfixes, tasks, refactoring, and documentation work
- **Structured Notes**: Timestamped notes with categories (progress, issues, solutions, ideas, reminders)
- **Status Tracking**: Track work through new → in-progress → blocked/in-review → testing → done
- **Priority Management**: Assign and filter by priority levels (low, medium, high, critical)
- **Search & Filter**: Find devlogs by keywords, status, type, or priority
- **Active Context**: Get a summary of current work for AI context
- **File Tracking**: Keep track of which files were modified
- **Code Change Summaries**: Document what code changes were made
- **Enterprise Integrations**: Sync with Jira, Azure DevOps, and GitHub Issues
- **AI Memory Persistence**: Maintain context across development sessions
- **Decision Tracking**: Record architectural decisions with rationale
- **Duplicate Prevention**: Standardized ID generation prevents duplicate entries
- **Deterministic IDs**: Hash-based IDs ensure consistency across AI sessions

## Installation

```bash
# Clone or download this repository
pnpm install
pnpm build
```

## Configuration

### Environment Variables

The devlog system supports configuration through environment variables and `.env` files. Copy the example file and customize as needed:

```bash
cp .env.example .env
# Edit .env with your configuration
```

#### Storage Configuration
- `DEVLOG_STORAGE_TYPE` - Storage backend (sqlite, postgres, mysql, enterprise)
- `DEVLOG_SQLITE_PATH` - SQLite database file path
- `DATABASE_URL` - Database connection string for PostgreSQL/MySQL

#### Enterprise Integrations
- **Jira**: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`
- **Azure DevOps**: `ADO_ORGANIZATION`, `ADO_PROJECT`, `ADO_PAT`
- **GitHub**: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`, `GITHUB_PROJECT_NUMBER`

#### Web Server
- `NODE_ENV` - Environment (development/production)
- `PORT` - Web server port (default: 3001)
- `DEVLOG_DIR` - Custom devlog directory path

See `.env.example` for complete configuration options.

## Usage

### MCP Server
The devlog MCP server is designed to be used with MCP-compatible AI clients. It stores all data locally in a `.devlog` directory within your project.

```bash
# Start the MCP server
pnpm start

# Start in development mode
pnpm dev

# Build all packages
pnpm build

# Build specific packages
pnpm build:types
pnpm build:core  
pnpm build:mcp
```

## Documentation

### 📚 Available Guides
- **[Usage Examples](docs/guides/EXAMPLES.md)** - Common workflows and usage patterns
- **[Testing Guide](docs/guides/TESTING.md)** - How to test the devlog system  
- **[GitHub Setup](docs/guides/GITHUB_SETUP.md)** - GitHub integration configuration
- **[Enterprise Integrations](docs/guides/INTEGRATIONS.md)** - Jira, Azure DevOps, and GitHub sync

### 🤝 Contributing
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project

### 📁 Full Documentation
See the [docs/](docs/) directory for complete documentation including archived implementation details.

### Using the Core Package

The `@devlog/core` package can be used directly in your own applications:

```typescript
import { DevlogManager } from '@devlog/core';

// Initialize the manager
const devlog = new DevlogManager({
  workspaceRoot: '/path/to/your/project',
  // devlogDir: '/custom/path/.devlog' // optional custom directory
});

// Create a new devlog entry
const entry = await devlog.createDevlog({
  title: 'Implement user authentication',
  type: 'feature',
  description: 'Add JWT-based authentication system',
  priority: 'high',
  businessContext: 'Users need secure login to access protected features',
  technicalContext: 'Using JWT tokens with refresh mechanism'
});

// Update the devlog
await devlog.updateDevlog({
  id: entry.id,
  status: 'in-progress',
  progress: 'Completed user registration endpoint'
});

// List all devlogs
const allDevlogs = await devlog.listDevlogs();

// Search devlogs
const authDevlogs = await devlog.searchDevlogs('authentication');

// Get active context for AI assistants
const activeContext = await devlog.getActiveContext(5);
```

This makes it easy to build additional tools like CLI interfaces, web dashboards, or integrations with other development tools.

## Duplicate Prevention & ID Generation

Devlog uses a sophisticated standardized ID generation system to prevent duplicate entries and ensure consistency across AI sessions:

### Key Features
- **Deterministic IDs**: Same title + type always generates the same ID
- **Hash-based**: Uses SHA-256 hash for collision resistance
- **Human-readable**: Format is `{slug}-{8-char-hash}`
- **Type-aware**: Different types can have the same title with different IDs
- **Collision handling**: Automatic counter suffixes for true hash collisions

### Example
```typescript
// These requests will generate different IDs because they have different types:
const bug = await devlog.findOrCreateDevlog({
  title: "Fix authentication bug",
  type: "bug"  // → fix-authentication-bug-7f14a073
});

const feature = await devlog.findOrCreateDevlog({
  title: "Fix authentication bug", 
  type: "feature"  // → fix-authentication-bug-12cb64b8
});

// But these will generate the same ID (case-insensitive):
const entry1 = await devlog.findOrCreateDevlog({
  title: "Add user login",
  type: "feature"  // → add-user-login-a1b2c3d4
});

const entry2 = await devlog.findOrCreateDevlog({
  title: "ADD USER LOGIN",  // Same ID due to normalization
  type: "feature"  // → add-user-login-a1b2c3d4 (found existing)
});
```

This prevents the common issue where AI assistants create duplicate entries when processing the same request multiple times or in rapid succession.

## Enterprise Integrations

Devlog supports synchronization with popular enterprise project management platforms:

### Supported Platforms

- **Jira** - Create and update issues
- **Azure DevOps** - Create and update work items  
- **GitHub** - Create and update issues

### Quick Setup

1. Copy the integration config template:
   ```bash
   cp devlog.config.template.json devlog.config.json
   ```

2. Fill in your platform credentials (see [docs/guides/INTEGRATIONS.md](docs/guides/INTEGRATIONS.md) for detailed setup)

3. Use the sync tools:
   ```typescript
   // Sync with all configured platforms
   await devlog.syncAllIntegrations(entryId);
   
   // Or sync with specific platforms
   await devlog.syncWithJira(entryId);
   await devlog.syncWithGitHub(entryId);
   await devlog.syncWithADO(entryId);
   ```

### MCP Integration Tools

- `sync_with_jira` - Sync devlog entry with Jira
- `sync_with_ado` - Sync devlog entry with Azure DevOps
- `sync_with_github` - Sync devlog entry with GitHub
- `sync_all_integrations` - Sync with all configured platforms

For complete setup instructions, see [docs/guides/INTEGRATIONS.md](docs/guides/INTEGRATIONS.md).

### Available Tools

#### `create_devlog`
Create a new devlog entry for a task, feature, or bugfix. Will fail if an entry with the same title already exists.

```json
{
  "id": "optional-custom-id",
  "title": "Add user authentication",
  "type": "feature",
  "description": "Implement JWT-based authentication system",
  "priority": "high"
}
```

#### `create_devlog`
Find an existing devlog entry by title or create a new one if it doesn't exist. This is the recommended way to create devlog entries as it prevents duplicates.

```json
{
  "title": "Add user authentication",
  "type": "feature", 
  "description": "Implement JWT-based authentication system",
  "priority": "high",
  "businessContext": "Users need secure login to access protected features",
  "technicalContext": "Using JWT tokens with refresh mechanism"
}
```

#### `update_devlog`
Update an existing devlog entry with progress, notes, or status changes.

```json
{
  "id": "auth-feature-123",
  "status": "in-progress",
  "progress": "Implemented JWT token generation",
  "files_changed": ["src/auth.ts", "src/middleware.ts"],
  "next_steps": "Add token validation middleware"
}
```

#### `list_devlogs`
List all devlog entries with optional filtering.

```json
{
  "status": "in-progress",
  "type": "feature",
  "priority": "high"
}
```

#### `get_devlog`
Get detailed information about a specific devlog entry.

```json
{
  "id": "auth-feature-123"
}
```

#### `search_devlogs`
Search devlog entries by keywords.

```json
{
  "query": "authentication JWT"
}
```

#### `add_devlog_note`
Add a timestamped note to an existing devlog entry.

```json
{
  "id": "auth-feature-123",
  "note": "Found issue with token expiration handling",
  "category": "issue"
}
```

#### `complete_devlog`
Mark a devlog entry as completed and archive it.

```json
{
  "id": "auth-feature-123",
  "summary": "Authentication system fully implemented and tested"
}
```

#### `get_active_context`
Get a summary of all active devlog entries for AI context.

```json
{
  "limit": 10
}
```

## Data Structure

Each devlog entry is stored as a JSON file in `.devlog/` with the following structure:

```json
{
  "id": "auth-feature-1703123456789",
  "title": "Add user authentication",
  "type": "feature",
  "description": "Implement JWT-based authentication system",
  "priority": "high",
  "status": "in-progress",
  "created_at": "2024-12-20T10:30:00.000Z",
  "updated_at": "2024-12-20T15:45:00.000Z",
  "progress": "Implemented JWT token generation",
  "files_changed": ["src/auth.ts", "src/middleware.ts"],
  "next_steps": "Add token validation middleware",
  "notes": [
    {
      "timestamp": "2024-12-20T14:20:00.000Z",
      "category": "progress",
      "content": "JWT library integrated successfully"
    },
    {
      "timestamp": "2024-12-20T15:30:00.000Z",
      "category": "issue",
      "content": "Found issue with token expiration handling"
    }
  ]
}
```

## Configuration

The server automatically creates a `.devlog` directory in the current working directory. You can also specify a custom workspace root when initializing the DevlogManager.

## MCP Client Configuration

To use this server with an MCP client, add it to your client configuration:

```json
{
  "mcpServers": {
    "devlog": {
      "command": "node",
      "args": ["/path/to/devlog-mcp/build/index.js"]
    }
  }
}
```

## Development

This monorepo provides an enhanced development experience with automatic dependency building. When you run development scripts for application packages, the base packages (`@devlog/types` and `@devlog/core`) automatically rebuild when their source files change.

### Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start MCP server with auto-building dependencies
pnpm dev:mcp

# Start web app with auto-building dependencies  
pnpm dev:web
```

### Enhanced Dev Scripts

The following commands automatically watch and rebuild dependencies:

- `pnpm dev:mcp` - MCP server with auto-building `types` and `core`
- `pnpm dev:web` - Web app with auto-building `types` and `core`

For more details, see [Development Guide](docs/guides/DEVELOPMENT.md).

### Legacy Commands

```bash
# Build individual packages
pnpm build:types
pnpm build:core  
pnpm build:mcp
pnpm build:web

# Run individual packages (no dependency watching)
pnpm dev          # MCP server only
pnpm --filter @devlog/web dev  # Web app only
```

## License

MIT License - see LICENSE file for details.