# GitHub Issues Storage: Native Features Integration

The devlog GitHub Issues storage provider now supports better integration with GitHub's native features, reducing reliance on custom labels and leveraging built-in functionality.

## Configuration Options

The GitHub storage provider supports two approaches for mapping devlog fields to GitHub Issues:

### 1. Native GitHub Features (Recommended)

Uses GitHub's built-in fields and standard labels for better integration:

```json
{
  "storage": {
    "type": "github",
    "github": {
      "owner": "your-org",
      "repo": "your-repo", 
      "token": "ghp_your_github_token",
      "mapping": {
        "useNativeType": true,
        "useNativeLabels": true,
        "useStateReason": true
      }
    }
  }
}
```

### 2. Traditional Custom Labels

Uses custom prefixed labels for all devlog fields:

```json
{
  "storage": {
    "type": "github",
    "github": {
      "owner": "your-org",
      "repo": "your-repo",
      "token": "ghp_your_github_token", 
      "mapping": {
        "useNativeType": false,
        "useNativeLabels": false,
        "useStateReason": false
      }
    }
  }
}
```

## Field Mapping

### Type Field

| Devlog Type | Native Type (useNativeType: true) | Native Label (useNativeLabels: true) | Custom Label (traditional) |
|-------------|-----------------------------------|--------------------------------------|----------------------------|
| `feature`   | `enhancement`                     | `enhancement`                        | `devlog-type:feature`     |
| `bugfix`    | `bug`                            | `bug`                                | `devlog-type:bugfix`      |
| `docs`      | `documentation`                   | `documentation`                      | `devlog-type:docs`        |
| `refactor`  | `refactor`                       | `refactor`                           | `devlog-type:refactor`    |
| `task`      | `task`                           | `task`                               | `devlog-type:task`        |

### Status Field

| Devlog Status | Native State + Reason (useStateReason: true) | Native Label | Custom Label |
|---------------|---------------------------------------------|--------------|--------------|
| `new`         | `state: open`                               | -            | -            |
| `in-progress` | `state: open`                               | `status: in-progress` | `devlog-status:in-progress` |
| `blocked`     | `state: open`                               | `status: blocked` | `devlog-status:blocked` |
| `in-review`   | `state: open`                               | `status: in-review` | `devlog-status:in-review` |
| `testing`     | `state: open`                               | `status: testing` | `devlog-status:testing` |
| `done`        | `state: closed, state_reason: completed`   | -            | -            |
| `closed`      | `state: closed, state_reason: not_planned`  | -            | -            |

### Priority Field

Priority is always mapped to labels since GitHub doesn't have a native priority field:

| Devlog Priority | Native Label | Custom Label |
|-----------------|--------------|--------------|
| `low`          | `priority: low` | `devlog-priority:low` |
| `medium`       | `priority: medium` | `devlog-priority:medium` |
| `high`         | `priority: high` | `devlog-priority:high` |
| `critical`     | `priority: critical` | `devlog-priority:critical` |

### Always Native

These fields always use GitHub's native functionality:

- **Assignees**: Uses GitHub's built-in assignee system
- **Milestone**: Uses GitHub's milestone feature for project/epic grouping
- **Created/Updated dates**: Uses GitHub's native timestamps

## Benefits of Native Integration

### 1. Better GitHub UI Integration
- Issue types appear in GitHub's native type dropdown
- State reasons show in the GitHub UI with proper context
- Standard labels are recognized by GitHub's automation

### 2. Reduced Label Clutter
- Fewer custom labels to manage
- Uses GitHub's established label conventions
- Better integration with existing GitHub workflows

### 3. Enhanced Filtering
- GitHub's native search supports type and state filters
- Better integration with GitHub Projects
- More intuitive for teams already using GitHub

### 4. Improved Compatibility
- Works better with GitHub Actions and automations
- Compatible with GitHub's roadmap and project features
- Future-proof as GitHub adds more native fields

## Migration Guide

### From Traditional to Native

1. **Update Configuration**: Change your `devlog.config.json` to enable native features
2. **Label Cleanup**: Remove old custom labels if desired (optional)
3. **Re-sync**: Existing issues will be read correctly, new issues will use native features

### Hybrid Approach

You can mix and match features:

```json
{
  "mapping": {
    "useNativeType": true,      // Use native type field
    "useNativeLabels": false,   // Keep custom priority labels
    "useStateReason": true      // Use native state tracking
  }
}
```

## GitHub Projects Integration (Future)

The configuration supports GitHub Projects v2 integration:

```json
{
  "mapping": {
    "projectId": 123,
    "projectFieldMappings": {
      "priority": "Priority",
      "status": "Status", 
      "type": "Type"
    }
  }
}
```

This will map devlog fields to custom fields in a GitHub Project board (implementation pending).

## Backward Compatibility

All existing devlog repositories using custom labels will continue to work without changes. The native features are opt-in and can be enabled gradually.
