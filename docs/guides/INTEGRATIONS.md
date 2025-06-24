# Enterprise Integrations Setup Guide

This guide helps you configure devlog to sync with enterprise project management tools like Jira, Azure DevOps, and GitHub.

## Configuration File Setup

Create a configuration file named `devlog.config.json` in one of these locations:
- Your project root directory
- `~/.devlog.config.json` (global config)
- `.devlog/integrations.config.json` (workspace-specific)

Copy the template from `devlog.config.template.json` and fill in your credentials.

## Platform-Specific Setup

### Jira Integration

1. **Get your Jira API Token:**
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the generated token

2. **Configuration:**
   ```json
   {
     "integrations": {
       "jira": {
         "baseUrl": "https://your-company.atlassian.net",
         "projectKey": "PROJ",
         "apiToken": "your-jira-api-token",
         "userEmail": "your-email@company.com"
       }
     }
   }
   ```

3. **Required Permissions:**
   - Browse projects
   - Create issues
   - Edit issues
   - View development tools (optional, for linking commits)

### Azure DevOps Integration

1. **Get your Personal Access Token (PAT):**
   - Go to https://dev.azure.com/{organization}/_usersSettings/tokens
   - Click "New Token"
   - Select scopes: Work Items (Read & write)
   - Copy the generated token

2. **Configuration:**
   ```json
   {
     "integrations": {
       "ado": {
         "organization": "your-organization",
         "project": "your-project",
         "personalAccessToken": "your-ado-pat"
       }
     }
   }
   ```

3. **Required Permissions:**
   - Work Items: Read & Write
   - Project and Team: Read (for project access)

### GitHub Integration

1. **Get your GitHub Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
   - Copy the generated token

2. **Configuration:**
   ```json
   {
     "integrations": {
       "github": {
         "owner": "your-github-username",
         "repo": "your-repository",
         "token": "your-github-token"
       }
     }
   }
   ```

3. **Required Permissions:**
   - Issues: Read & Write
   - Repository contents: Read (for context)

## Usage Examples

### Creating and Syncing a Devlog

```typescript
// Create a devlog entry
const entry = await devlog.createDevlog({
  title: "Implement user authentication",
  type: "feature",
  description: "Add JWT-based authentication system",
  priority: "high",
  businessContext: "Users need secure login to access protected features",
  technicalContext: "Using JWT tokens with refresh mechanism"
});

// Sync with all configured platforms
await devlog.syncAllIntegrations(entry.id);

// Or sync with specific platforms
await devlog.syncWithJira(entry.id);
await devlog.syncWithGitHub(entry.id);
await devlog.syncWithADO(entry.id);
```

### MCP Tools

The following MCP tools are available for integrations:

- `sync_with_jira` - Sync devlog entry with Jira
- `sync_with_ado` - Sync devlog entry with Azure DevOps  
- `sync_with_github` - Sync devlog entry with GitHub
- `sync_all_integrations` - Sync with all configured platforms

## Field Mappings

### Devlog Type to External Systems

| Devlog Type | Jira Issue Type | ADO Work Item Type | GitHub Labels |
|-------------|----------------|-------------------|---------------|
| feature     | Story          | User Story        | feature       |
| bugfix      | Bug            | Bug               | bugfix        |
| task        | Task           | Task              | task          |
| refactor    | Task           | Task              | refactor      |
| docs        | Task           | Task              | docs          |

### Priority Mappings

| Devlog Priority | Jira Priority | ADO Priority | GitHub Labels |
|-----------------|---------------|--------------|---------------|
| low             | Low           | 4            | -             |
| medium          | Medium        | 3            | -             |
| high            | High          | 2            | priority-high |
| critical        | Highest       | 1            | priority-high |

## Security Considerations

1. **Never commit credentials to version control**
2. **Use environment variables for sensitive data**
3. **Regularly rotate API tokens and PATs**
4. **Use the principle of least privilege for permissions**
5. **Consider using organizational secrets management**

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Verify API tokens/PATs are correct and not expired
   - Check that email matches Jira account (for Jira)
   - Ensure permissions are correctly set

2. **Network Issues:**
   - Verify URLs are accessible from your network
   - Check for corporate firewall restrictions
   - Confirm SSL/TLS certificates are valid

3. **Permission Errors:**
   - Verify account has required permissions on the target system
   - Check project access permissions
   - Ensure work item types exist (for ADO)

### Debug Mode

Set environment variable `DEBUG=devlog:*` to enable debug logging:

```bash
DEBUG=devlog:* pnpm start
```

## Advanced Configuration

### Custom Field Mappings

You can extend the field mappings by modifying the mapping functions in `devlog-manager.ts`:

- `mapDevlogTypeToJiraIssueType()`
- `mapDevlogTypeToADOWorkItemType()`
- `mapDevlogPriorityToJiraPriority()`
- `mapDevlogPriorityToADOPriority()`

### Webhook Integration (Future)

Future versions will support webhooks for real-time synchronization:

- Jira → Devlog updates
- ADO → Devlog updates  
- GitHub → Devlog updates

## Environment Variables

Alternative to config file, you can use environment variables:

```bash
# Jira
DEVLOG_JIRA_BASE_URL=https://your-company.atlassian.net
DEVLOG_JIRA_PROJECT_KEY=PROJ
DEVLOG_JIRA_API_TOKEN=your-token
DEVLOG_JIRA_USER_EMAIL=your-email@company.com

# Azure DevOps
DEVLOG_ADO_ORGANIZATION=your-org
DEVLOG_ADO_PROJECT=your-project
DEVLOG_ADO_PAT=your-pat

# GitHub
DEVLOG_GITHUB_OWNER=your-username
DEVLOG_GITHUB_REPO=your-repo
DEVLOG_GITHUB_TOKEN=your-token
```
