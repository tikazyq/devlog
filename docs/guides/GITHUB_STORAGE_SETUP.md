# GitHub Issues Storage Provider Setup Guide

This guide walks you through setting up the GitHub Issues Storage Provider to use GitHub Issues as your primary devlog storage backend.

## Overview

The GitHub storage provider stores devlog entries directly as GitHub Issues in a specified repository. This enables:

- **Native GitHub Integration**: Use GitHub's issue tracking, labels, assignees, and search
- **Team Collaboration**: Team members can comment and collaborate on devlog entries natively
- **Reduced Tool Fragmentation**: Keep devlog entries in the same system as code and PRs
- **Leveraging GitHub Features**: Benefits from GitHub's robust search, notifications, and API

## Prerequisites

1. **GitHub Repository**: A GitHub repository where you have write access
2. **GitHub Token**: A Personal Access Token with appropriate permissions
3. **Devlog**: The devlog system installed and configured

## Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Devlog Storage Token"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories) - if using public repos only
5. Click "Generate token"
6. **Important**: Copy and save the token immediately - you won't be able to see it again

### Required Permissions

Your token needs the following permissions on the target repository:
- **Issues**: Read and Write (to create, update, read issues)
- **Repository**: Read (to access repository metadata)
- **Pull Requests**: Read (optional, for linking to PRs)

## Step 2: Configure Environment Variables

Set up your environment variables to securely store your GitHub token:

```bash
# Required
export GITHUB_TOKEN="ghp_your_personal_access_token_here"

# Optional - defaults shown
export GITHUB_API_URL="https://api.github.com"  # For GitHub Enterprise
export GITHUB_LABELS_PREFIX="devlog"
```

For production environments, consider using:
- **Docker secrets**
- **Kubernetes secrets**
- **Cloud provider secret managers** (AWS Secrets Manager, Azure Key Vault, etc.)
- **Environment-specific configuration files**

## Step 3: Create Configuration File

Create a `devlog.config.json` file in your project root:

```json
{
  "storage": {
    "type": "github",
    "github": {
      "owner": "myorg",
      "repo": "my-project",
      "token": "${GITHUB_TOKEN}",
      "labelsPrefix": "devlog",
      "rateLimit": {
        "requestsPerHour": 4000,
        "retryDelay": 1000,
        "maxRetries": 3
      },
      "cache": {
        "enabled": true,
        "ttl": 300000
      }
    }
  }
}
```

### Configuration Options

#### Required Settings

- `owner`: GitHub repository owner (username or organization)
- `repo`: Repository name
- `token`: GitHub Personal Access Token

#### Optional Settings

- `apiUrl`: GitHub API URL (default: `https://api.github.com`)
  - For GitHub Enterprise: `https://your-github-enterprise.com/api/v3`
- `branch`: Repository branch (default: `main`)
- `labelsPrefix`: Prefix for devlog labels (default: `devlog`)
- `rateLimit`: Rate limiting configuration
  - `requestsPerHour`: Maximum requests per hour (default: `5000`)
  - `retryDelay`: Initial retry delay in ms (default: `1000`)
  - `maxRetries`: Maximum retry attempts (default: `3`)
- `cache`: Caching configuration
  - `enabled`: Enable caching (default: `true`)
  - `ttl`: Cache time-to-live in ms (default: `300000` = 5 minutes)

## Step 4: Initialize the Storage Provider

The first time you use the GitHub storage provider, it will:

1. **Verify API Access**: Test that your token has the required permissions
2. **Create Required Labels**: Automatically create devlog-specific labels:
   - `devlog-type:feature`, `devlog-type:bugfix`, `devlog-type:task`, etc.
   - `devlog-priority:low`, `devlog-priority:medium`, `devlog-priority:high`, `devlog-priority:critical`
   - `devlog-status:in-progress`, `devlog-status:blocked`, `devlog-status:in-review`, `devlog-status:testing`

## Step 5: Test the Configuration

Test your configuration by creating a devlog entry:

```typescript
import { DevlogManager } from '@devlog/core';

const manager = new DevlogManager();

// This will create a GitHub issue
const entry = await manager.createDevlog({
  title: 'Test GitHub Storage',
  type: 'feature',
  description: 'Testing the GitHub storage provider integration',
  priority: 'medium',
  businessContext: 'Verify GitHub storage is working correctly',
  technicalContext: 'Uses GitHub Issues API to store devlog data',
});

console.log('Created devlog entry:', entry);
console.log('GitHub Issue URL:', `https://github.com/${owner}/${repo}/issues/${entry.id}`);
```

## Data Structure

### How Devlog Entries Map to GitHub Issues

| Devlog Field | GitHub Field | Implementation |
|-------------|--------------|----------------|
| `id` | Issue number | GitHub's auto-generated issue numbers |
| `title` | Issue title | Direct mapping |
| `assignee` | Issue assignee | GitHub's native assignee field |
| `status` | Issue state + labels | `open/closed` + status labels |
| `type` | Labels | `devlog-type:feature` etc. |
| `priority` | Labels | `devlog-priority:high` etc. |
| `description` | Issue body | Human-readable section |
| Complex data | Issue body | Structured JSON metadata |

### Issue Body Structure

GitHub issues created by the devlog system have a structured format:

```markdown
<!-- DEVLOG_METADATA_START -->
## Description
User-provided description here...

## Technical Context
Technical context details...

## Business Context  
Business context details...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

<!-- DEVLOG_DATA -->
```json
{
  "version": "1.0.0",
  "devlogKey": "implement-auth-system",
  "notes": [...],
  "decisions": [...],
  "context": {...},
  "aiContext": {...},
  "files": [...],
  "relatedDevlogs": [...],
  "externalReferences": [...]
}
```
<!-- DEVLOG_METADATA_END -->
```

This structure ensures:
- **Human-readable content** is visible in the GitHub UI
- **Structured metadata** is preserved for the devlog system
- **GitHub native features** work naturally (comments, reactions, etc.)

## Best Practices

### Repository Organization

1. **Dedicated Repository**: Consider using a dedicated repository for devlog entries
2. **Clear Naming**: Use descriptive repository names like `my-project-devlog`
3. **Access Control**: Set appropriate repository permissions for your team

### Label Management

1. **Consistent Prefixes**: Use consistent `labelsPrefix` across your organization
2. **Label Colors**: The system automatically creates labels with meaningful colors
3. **Custom Labels**: You can add additional labels manually for organization-specific needs

### Performance Optimization

1. **Rate Limiting**: Keep `requestsPerHour` below GitHub's limits (5000/hour for authenticated users)
2. **Caching**: Enable caching to reduce API calls for read operations
3. **Batch Operations**: The system automatically batches label creation and other operations

### Security

1. **Token Rotation**: Regularly rotate your GitHub tokens
2. **Minimal Permissions**: Use tokens with the minimum required permissions
3. **Environment Variables**: Never commit tokens to version control
4. **Audit Access**: Regularly audit who has access to your devlog repository

## Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: GitHub API access verification failed: Bad credentials
```
**Solution**: Check that your `GITHUB_TOKEN` is set correctly and has the required permissions.

#### Repository Access Errors
```
Error: Not Found
```
**Solution**: Verify that:
- The repository exists
- Your token has access to the repository
- The `owner` and `repo` in your config are correct

#### Rate Limiting
```
Error: Rate limit exceeded
```
**Solution**: 
- Reduce `requestsPerHour` in your configuration
- Enable caching to reduce API calls
- Wait for the rate limit to reset (1 hour)

#### Label Creation Errors
```
Error: Validation Failed
```
**Solution**: This usually means labels already exist. The system will continue normally.

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
export DEBUG=devlog:github*
```

This will log all GitHub API requests and responses.

## GitHub Enterprise

For GitHub Enterprise installations:

```json
{
  "storage": {
    "type": "github",
    "github": {
      "owner": "myorg",
      "repo": "my-project", 
      "token": "${GITHUB_TOKEN}",
      "apiUrl": "https://your-github-enterprise.com/api/v3"
    }
  }
}
```

Make sure to:
1. Use the correct API URL for your GitHub Enterprise instance
2. Ensure your token has the required permissions in your enterprise
3. Check that your GitHub Enterprise version supports the required API endpoints

## Migration

### From Other Storage Types

To migrate from another storage type to GitHub:

1. **Export existing data** using your current storage provider
2. **Set up GitHub storage** as described above
3. **Import data** using the devlog migration tools (coming soon)
4. **Update configuration** to use GitHub storage

### Between GitHub Repositories

To move devlog entries between GitHub repositories:

1. Export from the source repository
2. Configure the target repository
3. Import to the target repository
4. Update any external references

## Support

For questions and support:

1. **Documentation**: Check the [devlog documentation](../README.md)
2. **Issues**: Create an issue in the devlog repository
3. **Discussions**: Use GitHub Discussions for questions and feedback

## Next Steps

Once your GitHub storage is set up:

1. **Create your first devlog entries** and see them appear as GitHub issues
2. **Explore GitHub's features** like labels, assignees, and milestones
3. **Set up team workflows** using GitHub's native collaboration features
4. **Consider automation** using GitHub Actions for devlog-related workflows
