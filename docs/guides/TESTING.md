# Testing Guide for Devlog MCP Server

This guide explains how to test the devlog system comprehensively.

## 🧪 Test Types

### 1. Unit Tests (Vitest)
Tests individual components and functions in isolation.

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### 2. Integration Tests
Tests the complete workflow and MCP server functionality.

```bash
# Run integration tests (builds first)
pnpm test:integration
```

### 3. Manual Testing
Test the MCP server interactively with real MCP clients.

## 🏃‍♂️ Quick Testing

### Basic Functionality Test
```bash
# 1. Build the project
pnpm build

# 2. Run integration test
pnpm test:integration
```

### Full Test Suite
```bash
# Run all tests across the monorepo
pnpm test

# Run only MCP server tests
pnpm --filter @devlog/mcp test
```

## 🔧 Manual Testing with MCP Client

### Option 1: Using the built-in test script
```bash
cd packages/mcp-server
pnpm build
node build/test.js
```

### Option 2: Testing with Claude Desktop
1. Update your Claude Desktop config:
```json
{
  "mcpServers": {
    "devlog": {
      "command": "node",
      "args": ["/path/to/devlog-monorepo/packages/mcp-server/build/index.js"],
      "env": {
        "NODE_PATH": "/path/to/devlog-monorepo/node_modules"
      }
    }
  }
}
```

2. Restart Claude Desktop and test the devlog tools.

### Option 3: Using MCP Inspector
```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Start the MCP server and inspect it
npx @modelcontextprotocol/inspector packages/mcp-server/build/index.js
```

## 📝 Test Scenarios

### Basic CRUD Operations
1. **Create a devlog**
   - Test with all required fields
   - Test with custom ID
   - Test with optional fields

2. **Update a devlog**
   - Change status
   - Add progress notes
   - Update priority

3. **Retrieve devlogs**
   - Get specific devlog by ID
   - List all devlogs
   - Filter by status, type, priority

4. **Search functionality**
   - Search by title keywords
   - Search by description
   - Case-insensitive search

### Advanced Features
1. **Active context**
   - Get current work summary
   - Test with different limits

2. **Notes management**
   - Add notes with different categories
   - Include file references
   - Add code change summaries

3. **File system integration**
   - Verify `.devlog` directory creation
   - Test with different workspace paths
   - Check JSON file structure

## 🐛 Common Issues & Debugging

### Test Failures
If unit tests fail, check:
1. **Output format differences**: Tests expect specific text formats
2. **Timing issues**: Tests might need to account for async operations
3. **File system permissions**: Ensure test can create/delete directories

### Integration Issues
If integration tests fail:
1. **Build errors**: Ensure TypeScript compiles successfully
2. **Module resolution**: Check import paths and extensions
3. **Dependencies**: Verify all packages are installed

### TypeScript Configuration
The monorepo uses project references with separate TypeScript configurations:
- **Root config**: Coordinates project references, no source files
- **Package configs**: Handle their own source files and compilation
- **Test exclusion**: Test files are excluded from build output

### MCP Server Issues
If the server doesn't start:
1. **Check build output**: Ensure `build/index.js` exists
2. **Node.js version**: Ensure Node.js 18+ is installed
3. **Dependencies**: Run `pnpm install` to ensure all deps are present

## 📊 Test Coverage

Current test coverage focuses on:
- ✅ DevlogManager core functionality
- ✅ CRUD operations
- ✅ File system operations
- ✅ Search and filtering
- ✅ Integration workflow

Areas for improvement:
- 🔄 Error handling edge cases
- 🔄 Performance testing with large datasets
- 🔄 Concurrent access testing
- 🔄 MCP protocol compliance testing

## 🚀 Continuous Integration

The project includes GitHub Actions workflows:

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on every push/PR
- **Publish Workflow** (`.github/workflows/publish.yml`): Publishes to npm on tags

### Local CI Testing
```bash
# Run the same tests as CI
pnpm install
pnpm build
pnpm test
```

## 📚 Adding New Tests

### Unit Tests
Create test files in `packages/mcp-server/src/__tests__/`:
```typescript
import { describe, it, expect } from 'vitest';

describe('YourFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Tests
Add scenarios to `packages/mcp-server/src/test.ts` or create new integration test files.

## 🎯 Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data/files
3. **Descriptive names**: Test names should clearly describe what they test
4. **Edge cases**: Test both happy path and error conditions
5. **Documentation**: Update this guide when adding new test patterns
