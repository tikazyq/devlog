# GitHub-First Storage Design Document

**Status:** In Development  
**Created:** June 25, 2025  
**Author:** AI Agent  
**Priority:** High  
**Devlog ID:** 7

## Overview

This document outlines the design for a flexible GitHub integration that transforms GitHub from a rigid sync target into a primary storage solution for devlog entries. The goal is to enable seamless cross-workspace access to devlog data while maintaining GitHub's collaboration and version control benefits.

## Problem Statement

### Current Issues
- **Rigid Sync Model**: GitHub treated as external sync target, not primary storage
- **Cross-Workspace Access**: No easy way to access devlog entries from multiple workspaces (home/work)
- **Complex Setup**: Requires manual token configuration and project setup
- **No Workspace Discovery**: Cannot discover existing devlog data when setting up new workspace
- **Poor Conflict Resolution**: Limited handling of multi-device scenarios

### User Need
> "I want to prioritize the integration to GitHub because I don't want to keep my devlog entries on local so that my workspace at home won't be able to access them."

## Solution Architecture

### Core Design Principles

1. **GitHub-First Mentality**: Treat GitHub as primary storage, not just a sync target
2. **Intuitive Setup**: One-command setup with automatic discovery
3. **Flexible Storage**: Support multiple storage strategies based on user needs
4. **Seamless Cross-Device**: Automatic workspace discovery and sync
5. **Backward Compatibility**: Maintain support for existing workflows

### Storage Strategy Types

```typescript
type StorageStrategy = 
  | 'local-only'           // Current SQLite-only approach
  | 'github-primary'       // GitHub repo as source of truth
  | 'hybrid-github'        // Local cache + GitHub sync
  | 'github-issues'        // Current approach (GitHub issues only)
```

## Implementation Plan

### Phase 1: Core Architecture (Priority: Critical)

#### 1.1 Storage Provider Interface Redesign

**Objective**: Abstract storage to support multiple backends

**Changes Required**:
- Extend `StorageProvider` interface to support GitHub repositories
- Add new `GitHubStorageProvider` class
- Implement `HybridStorageProvider` for local cache + GitHub sync

**New Interface**:
```typescript
interface StorageProvider {
  // Existing methods...
  
  // New methods for GitHub storage
  clone(repository: string, branch?: string): Promise<void>;
  pull(): Promise<void>;
  push(message: string): Promise<void>;
  getRemoteStatus(): Promise<'synced' | 'ahead' | 'behind' | 'diverged'>;
  resolveConflicts(strategy: ConflictResolution): Promise<void>;
}

interface GitHubStorageConfig {
  repository: string;      // "owner/repo"
  branch?: string;         // default: "main"
  path?: string;           // default: "devlog/"
  token?: string;          // GitHub token
  autoSync?: boolean;      // default: true
  conflictResolution?: ConflictResolution;
}

type ConflictResolution = 'local-wins' | 'remote-wins' | 'timestamp-wins' | 'interactive';
```

#### 1.2 Configuration Management Enhancement

**Objective**: Support GitHub storage configuration

**New Configuration Structure**:
```json
{
  "storage": {
    "type": "github",
    "repository": "username/my-devlog",
    "branch": "main",
    "path": "devlog/",
    "autoSync": true,
    "conflictResolution": "timestamp-wins"
  },
  "authentication": {
    "github": {
      "token": "github_pat_...",
      "scope": ["repo", "contents"]
    }
  }
}
```

**Multi-Workspace Configuration**:
```json
{
  "workspaces": {
    "personal": {
      "storage": {
        "type": "github",
        "repository": "username/personal-devlog"
      }
    },
    "work": {
      "storage": {
        "type": "github", 
        "repository": "company/team-devlog"
      }
    }
  },
  "defaultWorkspace": "personal"
}
```

### Phase 2: GitHub Repository Storage (Priority: High)

#### 2.1 Repository-Based Storage Implementation

**Objective**: Store devlog entries as JSON files in GitHub repository

**File Structure**:
```
devlog-repo/
├── devlog/
│   ├── entries/
│   │   ├── 001-feature-auth.json
│   │   ├── 002-bugfix-login.json
│   │   └── 003-task-documentation.json
│   ├── metadata/
│   │   ├── workspace-info.json
│   │   ├── counters.json
│   │   └── schema-version.json
│   └── .devlog-config.json
├── README.md
└── .gitignore
```

**Entry File Format**:
```json
{
  "id": 1,
  "title": "Implement user authentication",
  "type": "feature",
  "status": "in-progress",
  "priority": "high",
  "created": "2025-06-25T10:00:00Z",
  "updated": "2025-06-25T15:30:00Z",
  "description": "Add JWT-based authentication system",
  "context": {
    "businessContext": "Users need secure login...",
    "technicalContext": "Using JWT tokens...",
    "acceptanceCriteria": ["Login form", "Token validation"]
  },
  "notes": [
    {
      "id": "note-1",
      "timestamp": "2025-06-25T14:20:00Z",
      "category": "progress",
      "content": "Completed JWT integration"
    }
  ],
  "files": ["src/auth.ts", "src/middleware.ts"],
  "tags": ["auth", "security"],
  "gitCommit": "abc123def456"
}
```

#### 2.2 Setup and Discovery Flow

**Objective**: Automatic GitHub repo creation and existing devlog discovery

**Setup Commands**:
```bash
# Initialize new GitHub-backed devlog
devlog init --github username/repo-name

# Auto-discover existing devlog repos
devlog discover --github

# Create new repo automatically
devlog init --github --create-repo my-devlog

# Clone existing devlog to new workspace
devlog clone username/existing-devlog
```

**Discovery Process**:
1. Search user's GitHub repositories for devlog markers
2. Check repository topics for "devlog" tag
3. Look for `.devlog-config.json` in repository root
4. Present found repositories for selection
5. Clone and configure selected repository

#### 2.3 Conflict Resolution

**Objective**: Handle multi-device editing conflicts gracefully

**Conflict Resolution Strategies**:
1. **Timestamp-based**: Most recent update wins
2. **Interactive**: Prompt user to choose
3. **Merge-based**: Attempt to merge non-conflicting changes
4. **Local/Remote wins**: Simple override strategies

**Implementation**:
```typescript
class ConflictResolver {
  async resolveConflicts(
    local: DevlogEntry, 
    remote: DevlogEntry,
    strategy: ConflictResolution
  ): Promise<DevlogEntry> {
    switch (strategy) {
      case 'timestamp-wins':
        return local.updated > remote.updated ? local : remote;
      case 'interactive':
        return await this.promptUserChoice(local, remote);
      case 'merge-based':
        return await this.mergeEntries(local, remote);
      default:
        return local;
    }
  }
}
```

## Technical Implementation Details

### File Organization

**Entry Files**: `devlog/entries/{id:03d}-{slug}.json`
- Zero-padded sequential IDs for consistent ordering
- URL-safe slug derived from title
- JSON format for easy parsing and git diffs

**Metadata Files**:
- `workspace-info.json`: Workspace identification and settings
- `counters.json`: Next available ID counter
- `schema-version.json`: Data format version for migrations

### Git Operations

**Commit Strategy**:
- One commit per devlog operation (create, update, delete)
- Descriptive commit messages with devlog ID
- Automatic commit author attribution

**Branch Strategy**:
- Main branch for production devlog data
- Optional feature branches for experimental entries
- Support for multiple workspace branches

### Authentication

**GitHub Token Management**:
- Support for Personal Access Tokens (PAT)
- GitHub App authentication for organizations
- Automatic token validation and scope checking
- Secure token storage in OS keychain

**Required Scopes**:
- `repo`: Full repository access
- `contents`: Read/write repository contents
- `metadata`: Read repository metadata

## Migration Strategy

### From Current System

1. **Export existing entries** from SQLite to JSON format
2. **Create GitHub repository** with proper structure
3. **Import entries** with preserved timestamps and IDs
4. **Update configuration** to use GitHub storage
5. **Verify data integrity** and sync status

### Backward Compatibility

- Maintain existing MCP API interface
- Support fallback to local storage if GitHub unavailable
- Preserve existing devlog IDs and timestamps
- Continue to support current configuration format

## Success Metrics

### Phase 1 Success Criteria
- [ ] New storage provider interface implemented
- [ ] GitHub storage configuration support added
- [ ] Multi-workspace configuration working
- [ ] Backward compatibility maintained

### Phase 2 Success Criteria
- [ ] GitHub repository storage fully functional
- [ ] Automatic repository discovery working
- [ ] Conflict resolution strategies implemented
- [ ] One-command setup flow available
- [ ] Cross-workspace sync validated

## Security Considerations

### Data Protection
- GitHub tokens stored securely in OS keychain
- Repository access validation before operations
- Encrypted communication with GitHub API
- Audit trail through git commit history

### Access Control
- Support for private repositories
- Organization-level access controls
- Token scope validation
- Rate limiting compliance

## Future Enhancements (Phase 3+)

### GitHub Integration Features
- GitHub Discussions integration for collaborative entries
- GitHub Projects v2 integration for task management
- GitHub Actions for automated workflows
- Issue linking for external tracking

### Performance Optimizations
- Intelligent caching strategies
- Incremental sync operations
- Offline support with conflict resolution
- Large repository handling

### Collaboration Features
- Team devlog repositories
- Entry sharing and commenting
- Advanced conflict resolution
- Multi-author support

## Conclusion

This design transforms the GitHub integration from a rigid sync mechanism into a flexible, primary storage solution that naturally supports cross-workspace access while leveraging GitHub's powerful collaboration and version control features.

The phased approach ensures we can deliver immediate value (Phase 1-2) while maintaining a clear path for future enhancements. The focus on intuitive setup and automatic discovery addresses the core user need for seamless access across different work environments.
