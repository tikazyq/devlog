# Git Workflow Guidelines

## Commit Early and Often
- **After completing logical units**: Commit after implementing complete features, fixing bugs, or making significant refactors
- **Before risky operations**: Always commit stable state before attempting complex changes
- **At session milestones**: Commit when reaching significant progress points
- **During interruptions**: If work might be interrupted, commit incomplete but stable progress

## Commit Message Format
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

## When to Commit
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

## Git Operations
**Use Git MCP tools as the primary method:**
- `mcp_git_git_status()` - Check repository status
- `mcp_git_git_add()` - Stage files  
- `mcp_git_git_commit()` - Commit changes
- `mcp_git_git_push()` - Push to remote
- `mcp_git_git_diff()` - Review changes

**Fallback to terminal commands only when MCP tools are unavailable.**

## Integration with Devlog
- **Link commits to devlog entries**: Reference devlog IDs in commit messages when relevant
- **Update devlog after commits**: Add notes about committed changes to corresponding devlog entries
- **Commit devlog updates**: Don't forget to commit changes to devlog files themselves

**Example workflow:**
```bash
# 1. Make code changes
# 2. Test changes
# 3. Use MCP tools to commit
mcp_git_git_add({ files: ["src/feature.ts"] })
mcp_git_git_commit({ message: "feat(core): implement new feature as described in devlog #4" })

# 4. Update devlog entry
# 5. Commit devlog updates
mcp_git_git_add({ files: ["devlog/entries/"] })
mcp_git_git_commit({ message: "docs(devlog): update entry #4 with implementation progress" })
```

This ensures both code changes and development tracking are properly versioned and never lost.
