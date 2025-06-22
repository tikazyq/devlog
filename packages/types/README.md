# @devlog/types

Shared TypeScript types and interfaces for the devlog tools ecosystem.

## Installation

```bash
npm install @devlog/types
```

## Usage

```typescript
import { DevlogEntry, DevlogType, DevlogStatus } from '@devlog/types';

const entry: DevlogEntry = {
  id: 'example-123',
  title: 'Implement user authentication',
  type: 'feature',
  status: 'in-progress',
  // ... other properties
};
```

## Types

### Core Types

- `DevlogType`: The type of work being done
- `DevlogStatus`: Current status of the devlog entry
- `DevlogPriority`: Priority level of the work
- `NoteCategory`: Category for devlog notes

### Interfaces

- `DevlogEntry`: Main devlog entry structure
- `DevlogNote`: Individual note within a devlog
- `DevlogFilter`: Filtering criteria for searching devlogs
- `DevlogStats`: Statistics about devlog entries
- `CreateDevlogRequest`: Request payload for creating devlogs
- `UpdateDevlogRequest`: Request payload for updating devlogs
