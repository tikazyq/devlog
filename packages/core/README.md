# @devlog/core

Core functionality for the devlog system. This package provides the main `DevlogManager` class that handles creation, updating, querying, and management of development logs.

## Features

- **CRUD Operations**: Create, read, update, and delete devlog entries
- **Multiple Storage Backends**: SQLite, PostgreSQL, MySQL, and Enterprise integrations
- **Rich Context**: Support for business context, technical context, and AI-enhanced metadata
- **Filtering & Search**: Query devlogs by status, type, priority, tags, and text search
- **Notes & Progress Tracking**: Add timestamped notes to track progress
- **AI Context Management**: Special handling for AI assistant context and insights
- **Decision Tracking**: Record important decisions with rationale
- **Statistics**: Get overview statistics of your devlog entries

## Installation

```bash
pnpm add @devlog/core
```

## Usage

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
  technicalContext: 'Using JWT tokens with refresh mechanism',
  acceptanceCriteria: [
    'Users can register with email/password',
    'Users can login and receive JWT token',
    'Protected routes require valid token'
  ]
});

// Update the devlog
await devlog.updateDevlog({
  id: entry.id,
  status: 'in-progress',
  progress: 'Completed user registration endpoint'
});

// Add a note
await devlog.addNote(entry.id, {
  category: 'progress',
  content: 'Fixed validation issues with email format'
});

// List all devlogs
const allDevlogs = await devlog.listDevlogs();

// Filter devlogs
const inProgressTasks = await devlog.listDevlogs({
  status: ['in-progress'],
  type: ['feature', 'bugfix']
});

// Search devlogs
const authDevlogs = await devlog.searchDevlogs('authentication');

// Get active context for AI assistants
const activeContext = await devlog.getActiveContext(5);

// Complete a devlog
await devlog.completeDevlog(entry.id, 'Authentication system implemented and tested');
```

## API Reference

### DevlogManager

#### Constructor

```typescript
new DevlogManager(options?: DevlogManagerOptions)
```

Options:
- `workspaceRoot?: string` - Root directory of your project (defaults to `process.cwd()`)
- `devlogDir?: string` - Custom directory for devlog storage (defaults to `{workspaceRoot}/.devlog`)

#### Methods

- `createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry>`
- `updateDevlog(request: UpdateDevlogRequest): Promise<DevlogEntry>`
- `getDevlog(id: string): Promise<DevlogEntry | null>`
- `listDevlogs(filters?: DevlogFilter): Promise<DevlogEntry[]>`
- `searchDevlogs(query: string): Promise<DevlogEntry[]>`
- `addNote(id: string, note: Omit<DevlogNote, "id" | "timestamp">): Promise<DevlogEntry>`
- `completeDevlog(id: string, summary?: string): Promise<DevlogEntry>`
- `deleteDevlog(id: string): Promise<void>`
- `getActiveContext(limit?: number): Promise<DevlogEntry[]>`
- `updateAIContext(args: AIContextUpdate): Promise<DevlogEntry>`
- `addDecision(args: DecisionArgs): Promise<DevlogEntry>`
- `getStats(): Promise<DevlogStats>`

## Storage

The core package supports multiple storage backends:

- **SQLite**: Default for local development, provides good performance and full-text search
- **PostgreSQL**: For production environments requiring multi-user access
- **MySQL**: Alternative database option for web applications  
- **Enterprise**: Integration with external systems like Jira, Azure DevOps, etc.

Storage is configured through the `DevlogManager` constructor or environment variables.

## Integration

This core package is designed to be used by:

- `@devlog/mcp` - MCP server for AI assistants
- `@devlog/cli` - Command-line interface
- `@devlog/web` - Web interface for browsing devlogs
- Custom applications and scripts

## License

MIT
