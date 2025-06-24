# Storage Architecture V3

This document describes the new flexible storage architecture for the devlog system that supports multiple storage backends and enterprise integrations.

## Overview

The new storage architecture provides three main benefits:

1. **Enterprise Integration**: Store devlogs directly in enterprise tools (Jira, ADO, GitHub) without local duplication
2. **Efficient Local Storage**: Use SQLite instead of JSON files for better performance
3. **Production Database Support**: Support PostgreSQL, MySQL for scalable deployments

## Architecture Components

### StorageProvider Interface

The `StorageProvider` interface defines the contract for all storage backends:

```typescript
interface StorageProvider {
  initialize(): Promise<void>;
  exists(id: string): Promise<boolean>;
  get(id: string): Promise<DevlogEntry | null>;
  save(entry: DevlogEntry): Promise<void>;
  delete(id: string): Promise<void>;
  list(filter?: DevlogFilter): Promise<DevlogEntry[]>;
  search(query: string): Promise<DevlogEntry[]>;
  getStats(): Promise<DevlogStats>;
  dispose(): Promise<void>;
  isRemoteStorage(): boolean;
}
```

### Storage Types

#### 1. Enterprise Storage (`enterprise`)

For teams using enterprise tools like Jira, Azure DevOps, or GitHub Issues.

**Features:**
- No local storage duplication
- Direct integration with existing workflows
- Automatic synchronization
- Enterprise-grade security

**Configuration:**
```json
{
  "storage": {
    "type": "enterprise",
    "options": {
      "integrations": {
        "jira": {
          "baseUrl": "https://company.atlassian.net",
          "projectKey": "DEV",
          "userEmail": "user@company.com",
          "apiToken": "xxx"
        }
      }
    }
  }
}
```

#### 2. SQLite Storage (`sqlite`)

For individual developers and local development.

**Features:**
- Fast performance with full-text search
- ACID transactions
- No server required
- Efficient querying

**Configuration:**
```json
{
  "storage": {
    "type": "sqlite",
    "filePath": ".devlog/devlogs.db"
  }
}
```

#### 3. PostgreSQL Storage (`postgres`)

For production deployments and team collaboration.

**Features:**
- Multi-user support
- Advanced querying capabilities
- Scalable and reliable
- Full ACID compliance

**Configuration:**
```json
{
  "storage": {
    "type": "postgres",
    "connectionString": "postgresql://user:pass@localhost/devlog"
  }
}
```

#### 4. MySQL Storage (`mysql`)

For web applications and existing MySQL infrastructure.

**Features:**
- Wide adoption and support
- Good performance
- Multi-user support
- Full-text search capabilities

**Configuration:**
```json
{
  "storage": {
    "type": "mysql",
    "connectionString": "mysql://user:pass@localhost/devlog"
  }
}
```

#### 5. JSON Storage (`json`)

For backward compatibility and simple use cases.

**Features:**
- Simple setup
- Human-readable files
- Easy backup and migration
- No dependencies

**Configuration:**
```json
{
  "storage": {
    "type": "json",
    "filePath": ".devlog"
  }
}
```

## Usage

### Automatic Configuration

The system automatically detects the best storage configuration:

```typescript
import { NewDevlogManager } from "@devlog/core";

const manager = new NewDevlogManager();
await manager.initialize(); // Auto-detects storage
```

### Manual Configuration

```typescript
import { NewDevlogManager } from "@devlog/core";

const manager = new NewDevlogManager({
  storage: {
    type: "sqlite",
    filePath: "./my-devlogs.db"
  }
});
await manager.initialize();
```

### Environment Variables

The system supports environment-based configuration:

```bash
# Storage type
export DEVLOG_STORAGE_TYPE=sqlite
export DEVLOG_SQLITE_PATH=/path/to/devlogs.db

# Database URLs
export DATABASE_URL=postgresql://localhost/devlog
export DATABASE_URL=mysql://localhost/devlog

# Enterprise integrations
export JIRA_BASE_URL=https://company.atlassian.net
export JIRA_EMAIL=user@company.com
export JIRA_API_TOKEN=xxx
export JIRA_PROJECT_KEY=DEV
```

## Migration

### From JSON to SQLite

```typescript
import { StorageMigration } from "@devlog/core";

const migration = new StorageMigration();

// Check if migration is needed
const needsMigration = await migration.needsMigration(".devlog");

if (needsMigration) {
  // Backup existing data
  await migration.backupJsonStorage(".devlog");
  
  // Migrate to SQLite
  const result = await migration.migrate({
    sourceDir: ".devlog",
    targetStorage: {
      type: "sqlite",
      filePath: ".devlog/devlogs.db"
    }
  });
  
  console.log(`Migrated ${result.migratedEntries} entries`);
}
```

### From SQLite to PostgreSQL

```typescript
// Export from SQLite
const sqliteManager = new NewDevlogManager({
  storage: { type: "sqlite", filePath: ".devlog/devlogs.db" }
});

// Import to PostgreSQL
const postgresManager = new NewDevlogManager({
  storage: { 
    type: "postgres", 
    connectionString: "postgresql://localhost/devlog" 
  }
});

const entries = await sqliteManager.listDevlogs();
for (const entry of entries) {
  await postgresManager.findOrCreateDevlog(entry);
}
```

## Configuration File

Create a `devlog.config.json` file in your project root:

```json
{
  "storage": {
    "type": "sqlite",
    "filePath": ".devlog/devlogs.db"
  },
  "integrations": {
    "jira": {
      "baseUrl": "https://company.atlassian.net",
      "projectKey": "DEV",
      "userEmail": "user@company.com",
      "apiToken": "xxx"
    }
  }
}
```

## Performance Comparison

| Storage Type | Read Speed | Write Speed | Search Speed | Concurrent Access | Scale |
|--------------|------------|-------------|--------------|-------------------|-------|
| JSON         | Slow       | Slow        | Very Slow    | None              | Small |
| SQLite       | Fast       | Fast        | Fast         | Single Writer     | Medium |
| PostgreSQL   | Fast       | Fast        | Very Fast    | Multi-User        | Large |
| MySQL        | Fast       | Fast        | Fast         | Multi-User        | Large |
| Enterprise   | Medium     | Medium      | Medium       | Multi-User        | Large |

## Best Practices

### For Individual Developers
- Use SQLite for local development
- Configure with environment variables
- Enable automatic backups

### For Small Teams
- Use PostgreSQL with shared database
- Configure role-based access
- Set up automated migrations

### For Enterprise Teams
- Use enterprise storage for workflow integration
- Configure multiple integrations (Jira + GitHub)
- Set up monitoring and alerting

### For Web Applications
- Use PostgreSQL or MySQL
- Configure connection pooling
- Enable query optimization

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql postgresql://user:pass@localhost/devlog

# Test MySQL connection
mysql -h localhost -u user -p devlog
```

### Migration Issues
```typescript
// Check migration status
const stats = await migration.getMigrationStats(".devlog");
console.log(`Found ${stats.totalEntries} entries, ${stats.totalSize} bytes`);

// Run dry-run migration
const result = await migration.migrate({
  sourceDir: ".devlog",
  targetStorage: { type: "sqlite", filePath: ":memory:" },
  dryRun: true
});
```

### Performance Issues
```sql
-- Check PostgreSQL query performance
EXPLAIN ANALYZE SELECT * FROM devlog_entries WHERE status = 'in-progress';

-- Check SQLite indexes
.schema devlog_entries
```

## Dependencies

Install optional dependencies based on your storage choice:

```bash
# SQLite
npm install better-sqlite3

# PostgreSQL
npm install pg @types/pg

# MySQL
npm install mysql2
```

## API Changes

The new `NewDevlogManager` is backward compatible but provides enhanced functionality:

```typescript
// Old way (still works)
const manager = new DevlogManager();

// New way (recommended)
const manager = new NewDevlogManager();
await manager.initialize();

// Storage-aware operations
const entry = await manager.findOrCreateDevlog({
  title: "New Feature",
  type: "feature",
  description: "Description"
});
```

## MCP Server Integration

The new MCP server supports all storage types:

```bash
# Use new MCP server
node packages/mcp-server/build/index-v3.js

# Configure storage via environment
DEVLOG_STORAGE_TYPE=sqlite node packages/mcp-server/build/index-v3.js
```

## Future Enhancements

- **Redis Storage**: For high-performance caching
- **Cloud Storage**: Support for AWS DynamoDB, Azure Cosmos DB
- **Elasticsearch**: For advanced search capabilities
- **GraphQL API**: For flexible querying
- **Real-time Sync**: WebSocket-based updates
