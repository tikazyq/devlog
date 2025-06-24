# Devlog Project - Copilot Instructions

## Early Development Stage Guidelines

**IMPORTANT**: This project is in early development. We prioritize clean, modern architecture over backwards compatibility.

### Legacy Code Management
- **Remove obsolete code**: Don't preserve legacy implementations when refactoring
- **Modernize aggressively**: Prefer current best practices over maintaining old patterns  
- **Clean slate approach**: It's better to rewrite than to patch outdated code
- **Breaking changes are acceptable**: We're not bound by API compatibility during this phase
- **Focus on the future**: Design for where we want to be, not where we've been

### Development Philosophy
- **Quality over continuity**: A well-architected solution is more valuable than preserving broken legacy code
- **Rapid iteration**: Make bold changes to improve the codebase structure
- **Technical debt elimination**: Actively remove code that doesn't serve the current vision
- **Modern tooling**: Always use the latest stable versions and best practices
- **Proper testing over temp scripts**: Use structured test cases (Vitest) instead of creating temporary scripts for testing functionality

## Dogfooding Guidelines

This project uses **itself** for development tracking. When working on devlog features, ALWAYS:

### 1. Use Devlog for All Development Work
- Create devlog entries for new features, bugs, or improvements using `@devlog/mcp`
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

### 5. Architecture Principles
- **Standardized IDs**: All devlog entries use deterministic hash-based IDs for consistency
- **MCP Integration**: Primary interface for AI assistants is through MCP server tools
- **Storage Flexibility**: Support for both local JSON files and enterprise integrations
- **Duplicate Prevention**: Built-in safeguards against creating duplicate entries

### 6. When Adding New Features
1. Create devlog entry for the feature using MCP server
2. Use the feature to track its own development
3. Update the entry as you implement via MCP functions
4. Document the feature in the entry notes using MCP tools
5. Demo the feature by using it through the MCP interface

This ensures the devlog system is continuously tested and improved through real-world usage.

## Testing Best Practices

### 1. Prefer Structured Tests Over Temporary Scripts
- **Use Vitest framework**: Create proper test cases instead of ad-hoc scripts for testing functionality
- **Avoid temp scripts in tracked directories**: Don't create temporary `.mjs` files in `scripts/`, `src/`, or other tracked locations
- **Use `tmp/` for debugging only**: When debugging or quick testing is needed, use the `tmp/` directory (gitignored)
- **Comprehensive test coverage**: Write unit tests, integration tests, and end-to-end tests as needed
- **Maintainable testing**: Tests should be part of the CI/CD pipeline and easily runnable
- **Clean up legacy**: Remove temporary scripts once proper tests are in place

### 2. Test Organization
- **Unit tests**: Test individual functions and classes in isolation
- **Integration tests**: Test interactions between components and external services
- **E2E tests**: Use Playwright MCP tools for web application testing
- **Test data management**: Use proper fixtures and test data setup/teardown
- **Descriptive test names**: Tests should clearly describe what they're validating

### 3. Testing Workflow
1. **Primary approach**: Write proper test cases using Vitest framework
2. **For debugging only**: Use `tmp/` directory for temporary debugging scripts (gitignored)
3. **Test organization**: Ensure tests can be run with standard npm/pnpm scripts
4. **Cleanup**: Remove any temporary debugging files from `tmp/` when no longer needed
5. **Structured over ad-hoc**: Always prefer structured tests over temporary scripts

### 4. File Management for Testing
- **Proper tests**: `packages/*/src/__tests__/` directories using Vitest
- **Debugging files**: `tmp/` directory (temporary, gitignored)
- **Never create**: Temporary scripts in `scripts/`, `src/`, or other tracked directories
- **Clean codebase**: Keep the main codebase free of debugging artifacts