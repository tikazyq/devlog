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

## Web Testing Guidelines with Playwright MCP

When working with the `@devlog/web` application, use Playwright MCP tools for comprehensive testing:

### 7. Testing Setup
- Start the web application with the `Web: Dev (Full Stack)` task before testing
- Use `browser_navigate` to access the local development server
- Default development URL: `http://localhost:3000` (Vite dev server)
- Always take a snapshot with `browser_snapshot` before interacting with elements

### 8. Core Testing Patterns
- **Navigation Testing**: Verify routes and page transitions work correctly
- **Form Testing**: Test devlog entry creation, editing, and deletion
- **Data Validation**: Ensure data persists correctly across operations
- **UI Responsiveness**: Test different screen sizes and interactions
- **Error Handling**: Verify error messages and edge cases

### 9. Common Test Scenarios
```javascript
// Start web app first
// Navigate to devlog web interface
// Take snapshot to see current state
// Test creating a new devlog entry
// Test editing existing entries  
// Test filtering and search functionality
// Test responsive design on different screen sizes
// Verify data persistence
```

### 10. Playwright MCP Best Practices
- **Always snapshot first**: Use `browser_snapshot` to see the current page state
- **Use descriptive selectors**: Target elements by role, label, or test IDs when possible  
- **Verify interactions**: Take snapshots after interactions to confirm expected changes
- **Handle async operations**: Use `browser_wait_for` for dynamic content
- **Test error states**: Verify error messages and validation feedback
- **Clean up test data**: Remove any test entries created during testing

### 11. Web App Testing Checklist
- [ ] Home page loads correctly
- [ ] Navigation menu works
- [ ] Create new devlog entry form
- [ ] Edit existing devlog entries
- [ ] Delete devlog entries
- [ ] Search and filter functionality
- [ ] Responsive design on mobile/tablet
- [ ] Error handling for invalid inputs
- [ ] Data persistence after page refresh
- [ ] Integration with backend API

### 12. Debugging Failed Tests
- Use `mcp_playwright_browser_console_messages` to check for JavaScript errors
- Take screenshots with `mcp_playwright_browser_take_screenshot` for visual debugging
- Check network requests with `mcp_playwright_browser_network_requests`
- Verify element states before interactions using snapshots