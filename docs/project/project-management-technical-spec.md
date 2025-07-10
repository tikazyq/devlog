# AI-Native Project Management - Technical Specification

**Version**: 2.0  
**Created**: July 10, 2025

## Core Changes to DevlogEntry

```typescript
interface DevlogEntry {
  // ...existing fields...

  // Hierarchy (familiar terminology)
  parentId?: DevlogId;
  childIds: DevlogId[];
  hierarchyLevel: 'project' | 'epic' | 'task';

  // AI-native fields (replaces time-based planning)
  complexityEstimate?: 'trivial' | 'simple' | 'moderate' | 'complex' | 'research';
  contextRequirement?: 'local' | 'cross-file' | 'system-wide';
  expectedSessions?: number;
  knowledgePrerequisites?: string[];
  toolRequirements?: string[];
}
```

## Database Changes

```sql
-- Add to devlog_entries table
ALTER TABLE devlog_entries ADD COLUMN parent_id INTEGER REFERENCES devlog_entries(id);
ALTER TABLE devlog_entries ADD COLUMN hierarchy_level TEXT DEFAULT 'task';
ALTER TABLE devlog_entries ADD COLUMN complexity_estimate TEXT;
ALTER TABLE devlog_entries ADD COLUMN context_requirement TEXT;
ALTER TABLE devlog_entries ADD COLUMN expected_sessions INTEGER;
ALTER TABLE devlog_entries ADD COLUMN knowledge_prerequisites TEXT; -- JSON array

-- AI session tracking
CREATE TABLE ai_sessions (
  id TEXT PRIMARY KEY,
  devlog_id INTEGER REFERENCES devlog_entries(id),
  start_time TEXT,
  end_time TEXT,
  tokens_used INTEGER,
  problems_solved INTEGER,
  knowledge_gained TEXT -- JSON array
);
```

## Essential MCP Tools

1. `create_project` - Create project with AI assessment
2. `create_epic` - Create epic under project
3. `assess_complexity` - Analyze task complexity for AI
4. `build_session_context` - Prepare AI session context
5. `track_session_learnings` - Record knowledge gained
6. `get_project_hierarchy` - Get project structure
7. `analyze_knowledge_gaps` - Identify learning needs

## Core Classes

```typescript
class AIHierarchyManager {
  async createProject(params: CreateProjectParams): Promise<DevlogEntry>;
  async createEpic(params: CreateEpicParams): Promise<DevlogEntry>;
  async assessComplexity(devlogId: DevlogId): Promise<ComplexityAssessment>;
  async getProjectHierarchy(projectId: DevlogId): Promise<ProjectHierarchy>;
}

class AIContextManager {
  async buildSessionContext(devlogId: DevlogId): Promise<SessionContext>;
  async trackSessionLearning(sessionId: string, learnings: string[]): Promise<void>;
  async optimizeContextFlow(projectId: DevlogId): Promise<ContextOptimization>;
}
```

## Implementation Steps

1. **Update Types** - Add AI fields to DevlogEntry
2. **Database Migration** - Add hierarchy and AI tracking tables
3. **Core Classes** - Implement AIHierarchyManager and AIContextManager
4. **MCP Tools** - Create 7 essential tools
5. **Web UI** - Add complexity assessment to existing forms

## Success Metrics

- Context rebuilding < 30% of session time
- Problem resolution > 80% success rate
- Knowledge reuse > 70% across sessions
- Session estimates within ±1 actual sessions
