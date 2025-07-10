# Integration Services Design Document

**Status:** Design Draft 📋  
**Related:** [storage-design.md](./storage-design.md)  
**Created:** June 25, 2025  
**Author:** AI Agent  
**Priority:** Medium  
**Devlog ID:** 1

## Overview

This document outlines the design for integration services that connect devlog entries with external systems like git repositories, GitHub, Jira, and Azure DevOps. Integration services operate separately from storage providers, maintaining clear separation of concerns.

## Architecture Principles

### Separation of Concerns

**Storage Providers** (handle data persistence):
- Focus solely on reading/writing devlog data
- No knowledge of external systems
- Simple, reliable file or database operations

**Integration Services** (handle external systems):
- Sync devlog data with external systems
- Provide workflow automation
- Handle authentication and API interactions

### Design Benefits

1. **Clear Boundaries**: Storage handles persistence, integrations handle workflows
2. **Modular Architecture**: Add/remove integrations without affecting storage
3. **Testability**: Each layer can be tested independently
4. **Flexibility**: Multiple integrations can work with any storage provider
5. **Maintainability**: Changes to external APIs don't affect core storage

## Integration Service Types

### Git Integration Service

Provides advanced git automation for devlog workflows:

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
  
  // Workflow automation
  createPullRequest(devlogId: string, options: PROptions): Promise<string>;
  autoTagRelease(version: string, devlogIds: string[]): Promise<void>;
}
```

### GitHub Integration Service

Connects devlogs with GitHub issues, pull requests, and projects:

```typescript
interface GitHubIntegrationService {
  // Issue management
  createIssueFromDevlog(devlogId: string): Promise<Issue>;
  linkDevlogToIssue(devlogId: string, issueNumber: number): Promise<void>;
  syncIssueStatus(devlogId: string): Promise<void>;
  
  // Pull request integration
  createPRFromDevlog(devlogId: string): Promise<PullRequest>;
  linkDevlogToPR(devlogId: string, prNumber: number): Promise<void>;
  
  // Project board integration
  addToProject(devlogId: string, projectId: string): Promise<void>;
  syncProjectStatus(devlogId: string): Promise<void>;
  
  // Release management
  includeInRelease(devlogIds: string[], tag: string): Promise<void>;
}
```

### Jira Integration Service

Synchronizes devlogs with Jira tickets and projects:

```typescript
interface JiraIntegrationService {
  // Ticket management
  createTicketFromDevlog(devlogId: string): Promise<JiraTicket>;
  linkDevlogToTicket(devlogId: string, ticketKey: string): Promise<void>;
  syncTicketStatus(devlogId: string): Promise<void>;
  
  // Project integration
  addToSprint(devlogId: string, sprintId: string): Promise<void>;
  syncSprintProgress(devlogId: string): Promise<void>;
  
  // Time tracking
  logTimeFromDevlog(devlogId: string): Promise<void>;
  syncTimeEntries(devlogId: string): Promise<void>;
}
```

### Azure DevOps Integration Service

Integrates with Azure DevOps work items and boards:

```typescript
interface AdoIntegrationService {
  // Work item management
  createWorkItemFromDevlog(devlogId: string): Promise<WorkItem>;
  linkDevlogToWorkItem(devlogId: string, workItemId: number): Promise<void>;
  syncWorkItemStatus(devlogId: string): Promise<void>;
  
  // Board integration
  addToBoard(devlogId: string, boardId: string): Promise<void>;
  syncBoardStatus(devlogId: string): Promise<void>;
  
  // Pipeline integration
  triggerPipelineFromDevlog(devlogId: string): Promise<void>;
  linkToDeployment(devlogId: string, deploymentId: string): Promise<void>;
}
```

## Configuration

Integration services are configured separately from storage:

```typescript
// devlog.config.json
{
  "storage": {
    "strategy": "local-json"
  },
  "integrations": {
    "git": {
      "enabled": true,
      "autoCommit": true,
      "branchPrefix": "devlog/",
      "commitTemplate": "feat: {title} (devlog-{id})"
    },
    "github": {
      "enabled": true,
      "token": "${GITHUB_TOKEN}",
      "repository": "owner/repo",
      "autoCreateIssues": false,
      "projectId": "123"
    },
    "jira": {
      "enabled": false,
      "baseUrl": "https://company.atlassian.net",
      "token": "${JIRA_TOKEN}",
      "projectKey": "DEV"
    },
    "ado": {
      "enabled": false,
      "organization": "company",
      "project": "DevProject",
      "token": "${ADO_TOKEN}"
    }
  }
}
```

## Workflow Examples

### Git Workflow Automation

```typescript
// Create feature branch and commit devlog changes
const gitService = new GitIntegrationService(config.integrations.git);

// When devlog is created
await gitService.createFeatureBranch(devlogId);

// When devlog is updated
await gitService.commitDevlogChanges(devlogId, "Update devlog progress");

// When devlog is completed
await gitService.createPullRequest(devlogId, {
  title: devlog.title,
  description: devlog.description,
  assignees: [devlog.assignee]
});
```

### GitHub Issue Sync

```typescript
// Sync devlog with GitHub issues
const githubService = new GitHubIntegrationService(config.integrations.github);

// Create issue from devlog
const issue = await githubService.createIssueFromDevlog(devlogId);

// Keep status in sync
await githubService.syncIssueStatus(devlogId);

// Close issue when devlog is completed
if (devlog.status === 'done') {
  await githubService.closeIssue(issue.number);
}
```

### Cross-Repository Discovery

```typescript
// Find related devlogs across repositories
const gitService = new GitIntegrationService(config.integrations.git);

const relatedDevlogs = await gitService.findRelatedDevlogs([
  "authentication", "user-management", "api"
]);

// Sync insights across repositories
await gitService.syncAcrossRepositories();
```

## Implementation Strategy

### Phase 1: Core Integration Framework
- Base integration service interface
- Configuration management for integrations
- Plugin system for adding new integrations
- Basic git integration service

### Phase 2: External Service Integrations
- GitHub integration service
- Jira integration service
- Azure DevOps integration service
- Webhook support for real-time sync

### Phase 3: Advanced Workflows
- Multi-repository synchronization
- Automated workflow triggers
- Custom integration plugins
- Advanced reporting and analytics

## Benefits

### For Storage Layer
- **Simplicity**: Storage remains focused on data persistence
- **Reliability**: No external dependencies in core storage operations
- **Performance**: Fast operations without network calls
- **Testability**: Easy to test storage operations in isolation

### For Integration Layer
- **Flexibility**: Add/remove integrations without affecting storage
- **Scalability**: Each integration can be optimized independently
- **Maintainability**: Changes to external APIs isolated to integration layer
- **Extensibility**: Easy to add new integration services

### For Users
- **Optional Complexity**: Use only the integrations you need
- **Consistent Interface**: All integrations follow same patterns
- **Reliable Core**: Storage always works, integrations are additive
- **Powerful Workflows**: Automation across multiple external systems

## Conclusion

By separating integration services from storage providers, we create a clean, maintainable architecture that provides powerful workflow automation while keeping the core storage layer simple and reliable. This design allows users to adopt integrations incrementally while ensuring the core devlog functionality remains fast and dependable.
