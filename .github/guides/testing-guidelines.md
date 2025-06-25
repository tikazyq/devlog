# Testing Guidelines

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
