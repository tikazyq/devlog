# Devlog Project - Copilot Instructions

## Dogfooding Guidelines

This project uses **itself** for development tracking. When working on devlog features, ALWAYS:

### 1. Use Devlog for All Development Work
- Create devlog entries for new features, bugs, or improvements
- Use `find_or_create_devlog` to prevent duplicates
- Track progress with notes and status updates

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
- **Always check existing entries** before creating new ones
- **Update progress** as work continues
- **Document decisions** and technical details in notes
- **Use enterprise integrations** when configured
- **Demonstrate new features** by using them

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
1. Create devlog entry for the feature
2. Use the feature to track its own development
3. Update the entry as you implement
4. Document the feature in the entry notes
5. Demo the feature by using it

This ensures the devlog system is continuously tested and improved through real-world usage.