# Devlog Project - Copilot Instructions

## Dogfooding Guidelines

This project uses **itself** for development tracking. When working on devlog features, ALWAYS:

### 1. Use Devlog for All Development Work
- Create devlog entries for new features, bugs, or improvements using `@devlog/mcp-server`
- Use `find_or_create_devlog` to prevent duplicates
- Track progress with notes and status updates through the MCP server tools

### 2. Standard Entry Format
```json
{
  "title": "Brief, descriptive title",
  "type": "feature|bug|task|refactor|docs",
  "description": "Detailed description with context",
  "priority": "low|medium|high|critical",
  "tags": ["relevant", "tags"]
}
```

### 3. Key Practices
- **Always check existing entries** before creating new ones using MCP server tools
- **Update progress** as work continues through devlog MCP functions
- **Document decisions** and technical details in notes using `add_devlog_note`
- **Use enterprise integrations** when configured via MCP sync functions
- **Demonstrate new features** by using them through the MCP interface

### 4. Duplicate Prevention
- Use `find_or_create_devlog` instead of `create_devlog`
- Same title + same type = same entry (by design)
- Different types can have same title (different IDs)

### 5. Current Major Features
- ✅ Standardized ID generation (hash-based, deterministic)
- ✅ Enterprise integrations (Jira, ADO, GitHub)
- ✅ Duplicate prevention system
- ✅ MCP server for AI assistant integration

### 6. When Adding New Features
1. Create devlog entry for the feature using MCP server
2. Use the feature to track its own development
3. Update the entry as you implement via MCP functions
4. Document the feature in the entry notes using MCP tools
5. Demo the feature by using it through the MCP interface

This ensures the devlog system is continuously tested and improved through real-world usage.