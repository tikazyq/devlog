# Devlog Project - Copilot Instructions

## 🚨 CRITICAL: Devlog Creation Workflow (READ FIRST!)

**This project uses ITSELF for development tracking. ALWAYS follow this workflow:**

### ⚠️ MANDATORY FIRST STEP: Always Discover Before Creating

🔍 BEFORE creating ANY devlog entry, ALWAYS run: `discover_related_devlogs`

**Why this matters:**
- Prevents duplicate work and entries  
- Builds upon existing insights and progress
- Maintains project continuity and context

### ✅ Required Devlog Creation Steps
1. **🔍 DISCOVER FIRST**: Use `discover_related_devlogs` to find existing relevant work
2. **📖 REVIEW**: Analyze discovered entries to understand context and avoid overlaps  
3. **✅ CREATE ONLY IF NEEDED**: Create new devlog entry using MCP tools only if no overlapping work exists
4. **📝 TRACK PROGRESS**: Update entries with notes and status changes via MCP functions
5. **🔗 LINK WORK**: Reference devlog IDs in commits and documentation

## Development Philosophy (Brief)

**IMPORTANT**: This project is in early development. We prioritize clean, modern architecture over backwards compatibility.

- **Quality over continuity**: Well-architected solutions over preserving broken legacy code
- **Rapid iteration**: Make bold changes to improve codebase structure  
- **Modern tooling**: Always use latest stable versions and best practices
- **Breaking changes acceptable**: Not bound by API compatibility during this phase

## Quick Reference Links

📋 **Detailed Guidelines:**
- [Devlog Workflow Guide](guides/devlog-workflow.md) - Detailed MCP operations and workflows
- [Development Guidelines](guides/development-guidelines.md) - Development philosophy and practices
- [Testing Guidelines](guides/testing-guidelines.md) - Testing best practices and file management
- [Error Checking](guides/error-checking.md) - Error checking workflows and tools
- [Git Workflow](guides/git-workflow.md) - Git operations using MCP tools

## Essential SOPs

### Before Any Work
1. **🔍 ALWAYS** run `discover_related_devlogs` first
2. **🔧 CHECK ERRORS** using `problems` tool before building/running
3. **📊 CHECK STATUS** using `git_status` to understand repo state
4. **🧪 VALIDATE CHANGES** using appropriate testing method (formal tests, temp scripts, or Playwright MCP)

### Git Operations Priority
**Use Git MCP tools as primary method:**
- `git_status`, `git_add`, `git_commit`, `git_push`
- **Fallback to terminal only when MCP tools unavailable**

### Testing Requirements
**⚠️ EARLY DEVELOPMENT: Flexible testing approach for rapid prototyping**
- **Preferred**: Use Vitest for formal test cases in `packages/*/src/__tests__/` directories when appropriate
- **⚠️ Formal test modifications**: Only update existing formal test cases when you are confident about the correct approach and test logic
- **Temporary scripts**: Allowed in `tmp/` directory (gitignored) for quick validation and debugging
- **Browser-based testing**: Use Playwright MCP tools for UI and integration testing (clicking, typing, etc.)
- **Web application**: By default, it should be started by myself with the address `http://localhost:3000` (DO NOT run it yourself!)
- **Prohibited**: Never create test scripts in tracked directories (`.` root, `src/`, `scripts/`, etc.)
- **Run formal tests**: Use `pnpm test` or `pnpm test:watch` when formal tests exist
- **Clean up**: Remove temporary files from `tmp/` when done

### Commit Early and Often
- After completing features/fixes
- Before risky operations  
- At session milestones
- When tests pass

---
*For detailed instructions on any topic, see the linked guides above.*
