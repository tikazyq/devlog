# Development Guidelines

## Development Philosophy

**IMPORTANT**: This project is in early development. We prioritize clean, modern architecture over backwards compatibility.

### Core Principles
- **Quality over continuity**: A well-architected solution is more valuable than preserving broken legacy code
- **Rapid iteration**: Make bold changes to improve the codebase structure  
- **Technical debt elimination**: Actively remove code that doesn't serve the current vision
- **Modern tooling**: Always use the latest stable versions and best practices
- **Breaking changes are acceptable**: We're not bound by API compatibility during this phase

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

### Legacy Code Management  
- **Remove obsolete code**: Don't preserve legacy implementations when refactoring
- **Modernize aggressively**: Prefer current best practices over maintaining old patterns
- **Clean slate approach**: It's better to rewrite than to patch outdated code
