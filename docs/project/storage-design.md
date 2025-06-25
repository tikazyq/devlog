# Local JSON Storage Design Document

**Status:** Implementation Complete ✅  
**Implementation:** [git-storage-roadmap.md](./git-storage-roadmap.md)  
**Created:** June 25, 2025  
**Updated:** June 25, 2025 (Major Design Revision)  
**Author:** AI Agent  
**Priority:** High  
**Devlog ID:** 1

## Overview

This document outlines the design for a simplified local JSON file storage approach that treats devlog entries as regular project files. This eliminates the complexity of git-specific storage providers while naturally leveraging git's versioning and collaboration benefits through the project's existing repository.

## Problem Statement

### Original Flawed Approach
- **Over-engineered Git Storage**: Created complex GitStorageProvider with sync/pull/push operations
- **Misplaced Concerns**: Git operations belonged in integration layer, not storage layer
- **Configuration Complexity**: Required repository URLs, credentials, and sync strategies
- **Unnecessary Abstractions**: JSON files don't need git-specific storage logic

### Correct User Need
> "I want devlog entries to be part of my project codebase, versioned with git automatically, without any configuration or complexity."

## Solution Architecture

### Core Design Principles

1. **Files Are Just Files**: JSON devlog entries are regular project files in `.devlog/` directory
2. **Zero Configuration**: No repository setup, credentials, or sync configuration needed
3. **Git is Natural**: Files are automatically versioned through existing project git repository
4. **Clear Separation**: Storage handles files, integrations handle external systems
5. **Simple & Intuitive**: Developers understand files better than complex storage abstractions

### Storage Provider Types

```typescript
type StorageStrategy = 
  | 'local-sqlite'    // Fast local database (existing)
  | 'local-json'      // Simple JSON files in project (new, default)
  | 'postgres'        // Production database
  | 'mysql'           // Production database
```

### Integration vs Storage Separation

**Storage Providers** (handle data persistence):
- `LocalJsonStorageProvider` - JSON files in `.devlog/` 
- `SQLiteStorageProvider` - Local SQLite database
- `PostgreSQLStorageProvider` - PostgreSQL database
- `MySQLStorageProvider` - MySQL database

**Integration Services** (handle external systems):
- `GitIntegrationService` - Git repository operations (future)
- `GitHubIntegrationService` - GitHub API integration
- `JiraIntegrationService` - Jira API integration  
- `AdoIntegrationService` - Azure DevOps integration

### Local JSON Storage Provider

The `LocalJsonStorageProvider` writes devlog entries as JSON files in the project's `.devlog/` directory:

```
project-root/
├── .devlog/
│   ├── entries/
│   │   ├── 0001-implement-local-storage.json    # Individual devlog entries
│   │   ├── 0002-refactor-git-design.json
│   │   ├── 0003-update-documentation.json
│   │   └── 1000-large-project-entry.json       # Auto-scales to 4+ digits
│   └── metadata.json                            # Index and metadata
├── src/
├── .git/                                        # Existing project git repo
└── package.json
```

> **Note**: File numbering automatically scales from 3-digit (001-999) to 4+ digits (1000+) as needed, ensuring consistent alphabetical ordering regardless of project size.

#### File Structure

**Entry Files** (`entries/0001-<slug>.json`):
```json
{
  "id": "implement-local-storage",
  "title": "Implement Local JSON Storage",
  "type": "feature",
  "description": "Add support for local JSON file storage",
  "status": "in-progress",
  "priority": "high",
  "created": "2025-01-23T10:00:00Z",
  "updated": "2025-01-23T14:30:00Z",
  "notes": [...],
  "decisions": [...],
  "aiContext": {...}
}
```

**Metadata File** (`.devlog/metadata.json`):
```json
{
  "version": "1.0.0",
  "created": "2025-01-23T10:00:00Z",
  "updated": "2025-01-23T14:30:00Z",
  "totalEntries": 3,
  "activeEntries": 2,
  "entries": [
    {
      "id": "implement-local-storage",
      "file": "entries/0001-implement-local-storage.json",
      "status": "in-progress",
      "updated": "2025-01-23T14:30:00Z"
    }
  ]
}
```

### Git Benefits (Automatic)

Since entries are regular files in the project repository:

1. **Version Control**: Every change is tracked automatically
2. **Branching**: Entries follow git branch workflows naturally  
3. **Collaboration**: Team members can share entries through normal git push/pull
4. **History**: Full history of all changes available via git log
5. **Conflict Resolution**: Standard git merge tools handle conflicts
6. **Backup**: Remote repositories provide natural backup

### Configuration

#### Default Configuration (Zero Setup)

```typescript
// devlog.config.json - defaults to local-json
{
  "storage": {
    "strategy": "local-json"  // No additional config needed
  }
}
```

#### Advanced Configuration (Optional)

```typescript
interface LocalJsonConfig {
  baseDir?: string;       // Default: '.devlog'
  pretty?: boolean;       // Default: true (formatted JSON)
  backup?: boolean;       // Default: false (git is backup)
  minPadding?: number;    // Default: 3 (minimum digits for numbering)
}

// devlog.config.json - with optional customization
{
  "storage": {
    "strategy": "local-json",
    "config": {
      "baseDir": ".devlogs",      // Custom directory
      "pretty": true,             // Formatted JSON
      "backup": false,            // No additional backup
      "minPadding": 4             // Start with 4-digit numbering (0001)
    }
  }
}
```

## Implementation Details

The `LocalJsonStorageProvider` class provides full CRUD operations for devlog entries as JSON files, with automatic metadata management and zero-configuration setup. See the implementation in `packages/core/src/storage/local-json-storage.ts`.

### Key Features

- **Automatic Directory Creation**: Creates `.devlog/entries/` structure on first use
- **Smart File Naming**: Files named as `0001-<slug>.json` with dynamic padding that grows as needed
- **Scalable Numbering**: Starts with 3-digit padding (001-999), automatically expands to 4+ digits for larger projects
- **Metadata Management**: Maintains index file for fast queries and statistics
- **Error Handling**: Proper handling of file system errors and missing files
- **Type Safety**: Full TypeScript support with proper interfaces
- **Performance**: Efficient file operations with minimal overhead

## Migration Guide

### From Git Storage Provider

**Old Configuration (Remove)**:
```json
{
  "storage": {
    "strategy": "git",
    "config": {
      "repositoryUrl": "https://github.com/user/devlogs.git",
      "branch": "main",
      "syncStrategy": "auto",
      "credentials": {...}
    }
  }
}
```

**New Configuration**:
```json
{
  "storage": {
    "strategy": "local-json"
  }
}
```

### Migration Steps

1. **Update Configuration**: Change `strategy` to `'local-json'`
2. **Remove Git Config**: Delete repository URL, credentials, sync settings
3. **Initialize Storage**: Provider will create `.devlog/` directory automatically
4. **Commit Files**: Add `.devlog/` directory to git with your next commit

## Future Integration Services

### Git Integration Service (Future)

For advanced git automation (separate from storage):

```typescript
interface GitIntegrationService {
  // Repository discovery and management
  discoverRepositories(): Promise<Repository[]>;
  cloneRepository(url: string, path: string): Promise<void>;
  
  // Branch and commit automation  
  createFeatureBranch(devlogId: string): Promise<string>;
  commitDevlogChanges(devlogId: string, message: string): Promise<string>;
  
  // Cross-repository devlog discovery
  findRelatedDevlogs(keywords: string[]): Promise<DevlogEntry[]>;
  syncAcrossRepositories(): Promise<void>;
}
```

### Benefits of Separation

1. **Storage Simplicity**: Files are just files, no git complexity
2. **Integration Flexibility**: Advanced git features as optional services
3. **Clear Boundaries**: Storage handles persistence, integrations handle workflows
4. **Easy Testing**: File operations are easier to test than git operations
5. **Reduced Dependencies**: No git libraries required for basic storage

## Success Criteria

### Phase 1: Core Implementation ✅

- [x] `LocalJsonStorageProvider` implementation
- [x] Configuration manager support for `'local-json'`
- [x] Storage factory integration
- [x] Basic file operations (CRUD)
- [x] Metadata management
- [x] Zero-configuration setup

### Phase 2: Production Features

- [ ] Migration utilities from other storage providers
- [ ] File watching for external changes
- [ ] Concurrent access safety (file locking)
- [ ] Performance optimization for large datasets
- [ ] Schema validation and versioning

### Phase 3: Advanced Integration

- [ ] Git integration service for advanced workflows
- [ ] Cross-repository devlog discovery
- [ ] Automated branch and commit creation
- [ ] Repository synchronization across projects

## Conclusion

The Local JSON Storage Provider offers a dramatically simplified approach that leverages existing project infrastructure. By treating devlog entries as regular project files, we eliminate configuration complexity while gaining all the benefits of git versioning and collaboration naturally.

This design represents a fundamental shift from the original git-specific storage approach to a file-based approach that works seamlessly with git through the existing project repository. The result is a more intuitive, maintainable, and user-friendly solution that developers can understand and trust.
