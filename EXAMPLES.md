# Devlog MCP Examples

This file contains example usage patterns for the Devlog MCP server.

## Common Workflows

### Starting a New Feature

1. **Create the devlog entry:**
```json
{
  "tool": "create_devlog",
  "arguments": {
    "title": "Add dark mode support",
    "type": "feature",
    "description": "Implement dark mode toggle with theme persistence",
    "priority": "medium"
  }
}
```

2. **Update progress as you work:**
```json
{
  "tool": "update_devlog",
  "arguments": {
    "id": "add-dark-mode-support-1703123456789",
    "status": "in-progress",
    "progress": "Created theme context and basic toggle component",
    "files_changed": ["src/contexts/ThemeContext.tsx", "src/components/ThemeToggle.tsx"],
    "next_steps": "Add CSS variables for dark mode colors"
  }
}
```

3. **Add notes during development:**
```json
{
  "tool": "add_devlog_note",
  "arguments": {
    "id": "add-dark-mode-support-1703123456789",
    "note": "Need to test color contrast ratios for accessibility",
    "category": "reminder"
  }
}
```

### Tracking a Bug Fix

1. **Create bug report:**
```json
{
  "tool": "create_devlog",
  "arguments": {
    "title": "Fix memory leak in WebSocket connection",
    "type": "bugfix",
    "description": "WebSocket connections are not being properly closed, causing memory leaks",
    "priority": "high"
  }
}
```

2. **Document investigation:**
```json
{
  "tool": "add_devlog_note",
  "arguments": {
    "id": "fix-memory-leak-websocket-1703123456790",
    "note": "Found that event listeners are not removed on component unmount",
    "category": "issue"
  }
}
```

3. **Document solution:**
```json
{
  "tool": "add_devlog_note",
  "arguments": {
    "id": "fix-memory-leak-websocket-1703123456790",
    "note": "Added cleanup function in useEffect return to remove listeners and close connection",
    "category": "solution"
  }
}
```

### Getting Context for AI Assistant

When working with an AI assistant, use `get_active_context` to provide current work status:

```json
{
  "tool": "get_active_context",
  "arguments": {
    "limit": 5
  }
}
```

This returns a formatted summary of your active work that the AI can use to understand:
- What you're currently working on
- Recent progress and blockers
- Files that have been modified
- Next steps for each task

### Daily Workflow

1. **Morning: Check active work**
```json
{
  "tool": "list_devlogs",
  "arguments": {
    "status": "in-progress"
  }
}
```

2. **During work: Update progress**
```json
{
  "tool": "update_devlog",
  "arguments": {
    "id": "current-task-id",
    "progress": "Completed user authentication, working on authorization",
    "files_changed": ["src/auth/login.ts", "src/middleware/auth.ts"]
  }
}
```

3. **End of day: Add summary notes**
```json
{
  "tool": "add_devlog_note",
  "arguments": {
    "id": "current-task-id",
    "note": "Good progress today. Tomorrow: finish authorization middleware and add tests",
    "category": "progress"
  }
}
```

### Project Handoff

When handing off work to another developer or AI assistant:

```json
{
  "tool": "get_active_context",
  "arguments": {
    "limit": 10
  }
}
```

This provides a comprehensive overview of all active work, including:
- Task descriptions and priorities
- Current status and progress
- Known blockers or issues
- Files that have been modified
- Recent notes and observations

### Completing Work

```json
{
  "tool": "complete_devlog",
  "arguments": {
    "id": "task-id",
    "summary": "Feature fully implemented, tested, and deployed. Documentation updated."
  }
}
```

## Search and Discovery

### Find related work:
```json
{
  "tool": "search_devlogs",
  "arguments": {
    "query": "authentication JWT"
  }
}
```

### Filter by criteria:
```json
{
  "tool": "list_devlogs",
  "arguments": {
    "type": "bugfix",
    "priority": "high"
  }
}
```

## Tips

1. **Use descriptive titles** - They help with searching and context
2. **Update regularly** - Keep progress notes current for better AI assistance
3. **Tag files** - Track which files are affected by each task
4. **Use notes categorically** - Separate progress, issues, solutions, ideas, and reminders
5. **Complete tasks** - Mark finished work as done to keep active context clean
