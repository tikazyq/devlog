# GitHub Integration Setup Guide

## 🔑 Required Token Permissions

Your GitHub Personal Access Token needs these permissions for full devlog integration:

### For Issues Integration:
- ✅ **repo** (Full control of private repositories)
  - OR **public_repo** (Access public repositories) if you only work with public repos

### For Projects Integration:
- ✅ **project** (Full control of projects)

## 🛠️ How to Update Your Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens
   - Find your existing token or create a new one

2. **Update Permissions**
   - Check the **repo** scope (for issues)
   - Check the **project** scope (for projects)
   - Save the token

3. **Update devlog.config.json**
   - Replace the token in your config file
   - Keep the same owner, repo, projectNumber settings

## 🧪 Test the Integration

Once you've updated the token permissions, test with:

```bash
# Test basic issue creation
node scripts/test-issue-creation.mjs

# Test full devlog integration
node scripts/test-github-integration.mjs

# Get the correct project ID for GraphQL
node scripts/get-github-project-id.mjs
```

## 📋 Current Status

- ✅ Repository `tikazyq/devlog` exists and is accessible
- ✅ Configuration file `devlog.config.json` is properly formatted
- ❌ Token needs additional permissions (repo + project)

## 🎯 Expected Results

After updating permissions, you should be able to:

1. **Sync devlog entries to GitHub issues**
   ```javascript
   await devlog.syncWithGitHub('your-devlog-id')
   ```

2. **Sync devlog entries to GitHub project**
   ```javascript
   await devlog.syncWithGitHubProject('your-devlog-id')
   ```

3. **Import existing project items**
   ```javascript
   await devlog.importGitHubProjectItems()
   ```

The integration will create GitHub issues with proper titles, descriptions, and labels based on your devlog entries, and link them to your project board.
