# Error Checking and Code Quality Guidelines

## Always Check for Problems Before Building or Running
- **Use get_errors tool**: Check for compilation errors, TypeScript issues, and linting problems before proceeding
- **Problems panel workflow**: Leverage VS Code's built-in error detection and reporting
- **Fix errors promptly**: Address compilation issues immediately rather than ignoring them
- **Validate after edits**: Always check for new errors after making code changes

## When to Check for Errors
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

## Error Handling Workflow
1. **Check for problems**: Use `get_errors` tool to identify issues
2. **Prioritize errors**: Address compilation errors before linting warnings
3. **Fix systematically**: Resolve errors one file at a time
4. **Verify fixes**: Re-check for errors after each fix
5. **Document complex issues**: Add notes to devlog entries for non-trivial problems

## Types of Problems to Address
- **TypeScript errors**: Type mismatches, missing imports, syntax errors
- **ESLint warnings**: Code style, unused variables, potential bugs
- **Build configuration issues**: Missing dependencies, incorrect paths
- **Import/export problems**: Circular dependencies, missing modules

## Tools and Commands
```bash
# Check specific files for errors (preferred method)
# Use get_errors tool with file paths

# Check overall project health
pnpm build --dry-run  # Check if build would succeed
pnpm type-check       # Run TypeScript compiler without emitting
```

## Integration with Development Workflow
- **Before major refactoring**: Ensure clean starting state with no existing errors
- **During development**: Check errors after each logical change
- **Before committing**: Include error check as part of pre-commit verification
- **In devlog entries**: Document any persistent or complex errors encountered
