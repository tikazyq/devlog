# Contributing to Devlog Tools

This is a monorepo containing development logging tools and utilities. This document explains the project structure and development workflow.

## Project Structure

```
/
├── package.json                 # Root workspace configuration
├── packages/
│   ├── mcp-server/             # MCP server for development logging
│   │   ├── package.json        # Package-specific dependencies and scripts
│   │   ├── src/               # Source code
│   │   └── build/             # Compiled output
│   └── [future packages]/     # Space for additional packages
├── .vscode/                   # VS Code workspace configuration
└── README.md                  # Main documentation
```

## Development Workflow

### Initial Setup

```bash
# Install all dependencies for all packages
pnpm install

# Build all packages
pnpm build
```

### Working with Packages

```bash
# Build all packages
pnpm build

# Build only the MCP server
pnpm build:mcp

# Build only the core package  
pnpm build:core

# Build only the types package
pnpm build:types

# Start the MCP server
pnpm start

# Run the MCP server in development mode
pnpm dev

# Run tests for all packages
pnpm test

# Clean build artifacts from all packages
pnpm clean
```

### Working with Individual Packages

You can also work directly with individual packages using pnpm filters:

```bash
# Work on the MCP server package
pnpm --filter @devlog/mcp-server build
pnpm --filter @devlog/mcp-server dev

# Work on the core package
pnpm --filter @devlog/core build
pnpm --filter @devlog/core dev

# Work on the types package
pnpm --filter @devlog/types build
pnpm --filter @devlog/types dev

# Install dependencies for a specific package
pnpm --filter @devlog/mcp-server add some-dependency
```

## Adding New Packages

When adding a new package to the monorepo:

1. Create a new directory in `packages/`
2. Add a `package.json` with a scoped name (e.g., `@devlog/package-name`)
3. Add TypeScript configuration with `"composite": true`
4. Update the root `tsconfig.json` to include the new package reference
5. Update this document

## Architecture Decisions

### Monorepo Benefits

- **Shared tooling**: Common TypeScript, linting, and build configurations
- **Code sharing**: Easy to share types and utilities between packages
- **Atomic changes**: Changes across multiple packages can be made in single commits
- **Simplified dependency management**: Unified dependency resolution

### Package Structure

- `@devlog/types`: Shared TypeScript types and interfaces
- `@devlog/core`: Core devlog management functionality (file system operations, CRUD, etc.)
- `@devlog/mcp-server`: MCP server implementation that wraps the core functionality
- Future packages might include:
  - `@devlog/cli`: Command-line interface for devlog management
  - `@devlog/web`: Web interface for browsing devlogs
  - `@devlog/utils`: Shared utilities

## Build System

The project uses pnpm workspaces with TypeScript project references for efficient builds:

- `pnpm-workspace.yaml` defines the workspace structure
- Root `tsconfig.json` references all packages
- Each package has `"composite": true` for incremental builds
- `pnpm` manages dependencies and scripts efficiently

### pnpm Workspace Commands

- `pnpm -r <command>` - Run command in all packages
- `pnpm --filter <package> <command>` - Run command in specific package
- `pnpm --filter <pattern> <command>` - Run command in packages matching pattern

## Testing

Each package should include its own tests. The root workspace provides commands to run tests across all packages.
