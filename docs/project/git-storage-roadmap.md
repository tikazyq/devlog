# Git-Based Devlog Storage Implementation Roadmap

**Related Design Doc:** [git-storage-design.md](./git-storage-design.md)  
**Devlog ID:** 7  
**Target:** End of work session  

## Phase 1: Core Architecture ⚡

### 1.1 Storage Provider Interface Redesign
- [ ] Extend `StorageProvider` interface for git-based storage support
- [ ] Create `GitStorageProvider` class 
- [ ] Implement `HybridStorageProvider` class
- [ ] Add git-specific methods (clone, pull, push, etc.)

**Files to modify:**
- `packages/core/src/storage/storage-provider.ts`
- `packages/core/src/storage/git-storage-provider.ts` (new)
- `packages/core/src/storage/hybrid-storage-provider.ts` (new)

### 1.2 Configuration Management Enhancement  
- [ ] Add git storage configuration types
- [ ] Update `ConfigurationManager` to handle git-based storage configs
- [ ] Support multi-workspace configuration
- [ ] Add git authentication management (GitHub, GitLab, generic git)

**Files to modify:**
- `packages/types/src/storage.ts`
- `packages/core/src/configuration-manager.ts`
- `packages/core/src/types/configuration.ts`

## Phase 2: Git Repository Storage ⚡

### 2.1 Repository-Based Storage Implementation
- [ ] Implement JSON file-based entry storage in `.devlog/` folder
- [ ] Create repository file structure logic
- [ ] Add git operations wrapper (clone, pull, push, conflict resolution)
- [ ] Implement conflict resolution strategies
- [ ] Ensure SQLite cache files are stored locally in `~/.devlog/`

**Files to create:**
- `packages/core/src/storage/git-storage-provider.ts`
- `packages/core/src/utils/git-operations.ts`
- `packages/core/src/utils/conflict-resolver.ts`

### 2.2 Setup and Discovery Flow
- [ ] Add git repository discovery
- [ ] Implement automatic repo creation
- [ ] Create setup command handlers
- [ ] Add workspace cloning functionality

**Files to modify:**
- `packages/core/src/devlog-manager.ts`
- `packages/mcp/src/mcp-adapter.ts` (add new MCP tools)

### 2.3 Authentication Management
- [ ] Git authentication validation (GitHub tokens, SSH keys, etc.)
- [ ] Secure credential storage
- [ ] Scope verification for different git hosts
- [ ] Authentication error handling

**Files to create:**
- `packages/core/src/auth/git-auth.ts`

## Implementation Priority

**High Priority (Must Have)**:
1. Storage provider interface extension
2. Basic git storage provider (git-json strategy)
3. Repository file operations with proper `.devlog/` structure
4. Configuration management updates for multiple storage strategies

**Medium Priority (Should Have)**:
1. Conflict resolution strategies
2. Repository discovery
3. Git authentication management (GitHub, GitLab, generic)
4. Setup commands

**Low Priority (Nice to Have)**:
1. Hybrid storage provider (git-json + SQLite cache)
2. Advanced conflict resolution
3. Multi-workspace support
4. Repository auto-creation

## Testing Strategy

### Unit Tests
- [ ] Git storage provider tests
- [ ] Configuration management tests (all three strategies)
- [ ] Git operations tests
- [ ] Conflict resolution tests
- [ ] SQLite cache location validation tests

### Integration Tests
- [ ] End-to-end git storage flow
- [ ] Cross-workspace sync tests
- [ ] Authentication flow tests (GitHub, GitLab, generic git)
- [ ] Repository discovery tests
- [ ] Hybrid strategy tests (JSON + SQLite cache)

### Manual Testing
- [ ] Setup flow validation
- [ ] Multi-device sync testing
- [ ] Conflict resolution scenarios
- [ ] Performance with large repositories

## Success Criteria

**Phase 1 Complete When:**
- New storage provider interface supports git operations
- Git-based storage configuration is supported (all three strategies)
- Basic git storage provider functions with proper `.devlog/` structure
- SQLite cache files are properly isolated to local directories
- Existing functionality remains intact

**Phase 2 Complete When:**
- Can create devlog entries in git repositories (JSON format)
- Repository discovery works automatically  
- Basic conflict resolution handles multi-device edits
- Setup flow is intuitive and functional
- Hybrid strategy properly separates Git JSON from local SQLite cache

## Notes

- Focus on core functionality first, polish later
- Maintain backward compatibility throughout
- Use existing devlog for testing and validation
- Document any breaking changes clearly

## Critical Implementation Guidelines

### Storage Separation (IMPORTANT!)
- **Git Repository (`.devlog/` folder)**: JSON files, metadata, documentation - TRACKED
- **Local Cache (`~/.devlog/` directory)**: SQLite files, temp files - NEVER TRACKED
- Always verify SQLite files are in `~/.devlog/`, never in git repos
- Add proper `.gitignore` entries to prevent accidental SQLite commits

### Configuration Strategy Priority
1. **local-sqlite**: Traditional local-only storage (existing behavior)
2. **git-json**: Pure git-based JSON storage (new, GitHub/GitLab friendly)
3. **hybrid-git**: Best of both worlds (git JSON + local SQLite cache)

### File Structure Standards
```
# Git Repository
.devlog/
  entries/2024-01-15-feature.json    # Individual entry files
  index.json                         # Entry metadata and relationships
  config.json                        # Repository-specific config

# Local User Directory  
~/.devlog/
  cache/project-name.db              # SQLite cache for hybrid strategy
  local/local-project.db             # SQLite for local-only projects
```
