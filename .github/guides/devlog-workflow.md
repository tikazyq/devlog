# Devlog Workflow Guide

## Detailed Dogfooding Guidelines

### Core Principles
- **MCP Integration**: Primary interface for AI assistants is through MCP server tools
- **Duplicate Prevention**: Built-in safeguards against creating duplicate entries
- **Self-Documentation**: Use devlog features to track their own development

### When Adding New Features
1. **🔍 DISCOVER FIRST**: Use `discover_related_devlogs` to find existing relevant work
2. Create devlog entry using MCP server only if no overlapping work exists  
3. Use the feature to track its own development
4. Update the entry as you implement via MCP functions
5. Document the feature in the entry notes using MCP tools

## Standard Entry Format
```json
{
  "title": "Brief, descriptive title",
  "type": "feature|bug|task|refactor|docs", 
  "description": "Detailed description with context",
  "priority": "low|medium|high|critical"
}
```

## MCP Tools Reference
- `mcp_devlog_discover_related_devlogs()` - Find existing related work
- `mcp_devlog_create_devlog()` - Create new entry
- `mcp_devlog_update_devlog()` - Update entry progress
- `mcp_devlog_add_devlog_note()` - Add timestamped notes
- `mcp_devlog_get_context_for_ai()` - Get entry context
- `mcp_devlog_list_devlogs()` - List all entries
- `mcp_devlog_search_devlogs()` - Search entries
