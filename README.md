# Devlog Development Tools - Monorepo

A monorepo containing development logging tools and utilities, including a Model Context Protocol (MCP) server for managing development logs and working notes. These tools help AI assistants maintain context about ongoing tasks, features, and bugfixes by storing structured notes in a local `.devlog` directory.

## Packages

### `@devlog/mcp-server`
The main MCP server for development logging functionality.

## Features

- **Task Management**: Create and track features, bugfixes, tasks, refactoring, and documentation work
- **Structured Notes**: Timestamped notes with categories (progress, issues, solutions, ideas, reminders)
- **Status Tracking**: Track work through todo → in-progress → review → testing → done
- **Priority Management**: Assign and filter by priority levels (low, medium, high, critical)
- **Search & Filter**: Find devlogs by keywords, status, type, or priority
- **Active Context**: Get a summary of current work for AI context
- **File Tracking**: Keep track of which files were modified
- **Code Change Summaries**: Document what code changes were made

## Installation

```bash
# Clone or download this repository
pnpm install
pnpm build
```

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
pnpm build:mcp
pnpm build:types
```

### Available Tools

#### `create_devlog`
Create a new devlog entry for a task, feature, or bugfix.

```json
{
  "id": "optional-custom-id",
  "title": "Add user authentication",
  "type": "feature",
  "description": "Implement JWT-based authentication system",
  "priority": "high"
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

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Start the server
npm start
```

## License

MIT License - see LICENSE file for details.