# Devlog Project - Copilot Instructions

## 🚨 CRITICAL: Devlog Creation Workflow (READ FIRST!)

**This project uses ITSELF for development tracking. ALWAYS follow this workflow:**

### ⚠️ MANDATORY FIRST STEP: Always Discover Before Creating
```
🔍 BEFORE creating ANY devlog entry, ALWAYS run:
mcp_devlog_discover_related_devlogs()
```

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

### 🎯 Standard Entry Format
```json
{
  "title": "Brief, descriptive title",
  "type": "feature|bug|task|refactor|docs", 
  "description": "Detailed description with context",
  "priority": "low|medium|high|critical"
}
```

## Early Development Stage Guidelines

**IMPORTANT**: This project is in early development. We prioritize clean, modern architecture over backwards compatibility.

### Development Philosophy
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

## Testing Best Practices

### 1. Prefer Structured Tests Over Temporary Scripts
- **Use Vitest framework**: Create proper test cases instead of ad-hoc scripts  
- **Use `tmp/` for debugging only**: When debugging is needed, use the `tmp/` directory (gitignored)
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

## Error Checking and Code Quality Guidelines

### 1. Always Check for Problems Before Building or Running
- **Use get_errors tool**: Check for compilation errors, TypeScript issues, and linting problems before proceeding
- **Problems panel workflow**: Leverage VS Code's built-in error detection and reporting
- **Fix errors promptly**: Address compilation issues immediately rather than ignoring them
- **Validate after edits**: Always check for new errors after making code changes

### 2. When to Check for Errors
**ALWAYS check before:**
- ✅ **Running build commands** (`pnpm build`, `npm run build`, etc.)
- ✅ **Starting development servers** (`pnpm dev`, `npm start`, etc.)
- ✅ **Running tests** (`pnpm test`, `npm test`, etc.)
- ✅ **Committing changes** (as part of pre-commit workflow)
- ✅ **After making significant code edits**

**Also check after:**
- 📝 **Installing new dependencies**
- 🔄 **Switching branches or pulling changes**
- ⚙️ **Modifying configuration files** (tsconfig.json, package.json, etc.)

### 3. Error Handling Workflow
1. **Check for problems**: Use `get_errors` tool to identify issues
2. **Prioritize errors**: Address compilation errors before linting warnings
3. **Fix systematically**: Resolve errors one file at a time
4. **Verify fixes**: Re-check for errors after each fix
5. **Document complex issues**: Add notes to devlog entries for non-trivial problems

### 4. Types of Problems to Address
- **TypeScript errors**: Type mismatches, missing imports, syntax errors
- **ESLint warnings**: Code style, unused variables, potential bugs
- **Build configuration issues**: Missing dependencies, incorrect paths
- **Import/export problems**: Circular dependencies, missing modules

### 5. Tools and Commands
```bash
# Check specific files for errors (preferred method)
# Use get_errors tool with file paths

# Check overall project health
pnpm build --dry-run  # Check if build would succeed
pnpm type-check       # Run TypeScript compiler without emitting
```

### 6. Integration with Development Workflow
- **Before major refactoring**: Ensure clean starting state with no existing errors
- **During development**: Check errors after each logical change
- **Before committing**: Include error check as part of pre-commit verification
- **In devlog entries**: Document any persistent or complex errors encountered

## Git Workflow Guidelines

### 1. Commit Early and Often
- **After completing logical units**: Commit after implementing complete features, fixing bugs, or making significant refactors
- **Before risky operations**: Always commit stable state before attempting complex changes
- **At session milestones**: Commit when reaching significant progress points
- **During interruptions**: If work might be interrupted, commit incomplete but stable progress

### 2. Commit Message Format
Use the conventional commit format for consistency:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code restructuring without behavior changes  
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `style`: Code formatting changes

**Examples:**
```
feat(devlog): add git commit guidelines to copilot instructions

docs: update README with installation steps

fix(mcp): resolve duplicate entry creation issue

refactor(core): modernize storage layer architecture
```

### 3. When to Commit
**ALWAYS commit in these situations:**
- ✅ **After completing a feature or bug fix**
- ✅ **Before starting major refactoring**
- ✅ **When tests are passing**
- ✅ **At the end of a productive session**
- ✅ **Before switching contexts or tasks**
- ✅ **When code reaches a stable intermediate state**

**DON'T commit:**
- ❌ Broken or non-compiling code (unless explicitly marked as WIP)
- ❌ Temporary debugging code or console.log statements
- ❌ Files in `tmp/` directory or other gitignored locations
- ❌ Large binary files or build artifacts

### 4. Git Commands for AI Agents
Use these commands through the `run_in_terminal` tool:

```bash
# Check status before committing
git status

# Stage specific files (preferred over git add .)
git add path/to/specific/file.ts

# Commit with descriptive message
git commit -m "feat(scope): descriptive message about changes"

# Push changes to remote (when appropriate)
git push
```

### 5. Recovery and Safety
- **Check git status regularly**: Always verify what files are staged/unstaged
- **Use git diff**: Review changes before committing
- **Stash when switching contexts**: Use `git stash` for temporary work
- **Create branches for experiments**: Use feature branches for risky changes

### 6. Integration with Devlog Workflow
- **Link commits to devlog entries**: Reference devlog IDs in commit messages when relevant
- **Update devlog after commits**: Add notes about committed changes to corresponding devlog entries
- **Commit devlog updates**: Don't forget to commit changes to devlog files themselves

**Example workflow:**
```bash
# 1. Make code changes
# 2. Test changes
git add src/feature.ts
git commit -m "feat(core): implement new feature as described in devlog #4"

# 3. Update devlog entry
# 4. Commit devlog updates
git add devlog/entries/
git commit -m "docs(devlog): update entry #4 with implementation progress"
```

This ensures both code changes and development tracking are properly versioned and never lost.