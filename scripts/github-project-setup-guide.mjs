#!/usr/bin/env node

/**
 * GitHub Project Integration Setup Guide
 * 
 * This script provides step-by-step instructions for setting up
 * GitHub Projects integration with proper token permissions.
 */

console.log('🚀 GitHub Project Integration Setup Guide');
console.log('==========================================\n');

console.log('📋 Current Status:');
console.log('  ✅ GitHub Issues integration: WORKING');
console.log('  ❌ GitHub Projects integration: BLOCKED (missing token permissions)\n');

console.log('🔧 Required Steps to Fix:');
console.log('\n1. Update GitHub Personal Access Token:');
console.log('   • Go to: https://github.com/settings/tokens');
console.log('   • Click "Edit" on your existing token, or create a new one');
console.log('   • Enable these scopes:');
console.log('     ✅ repo (already working for issues)');
console.log('     🆕 project:read (to read project data)');
console.log('     🆕 project:write (to create/update project items)');
console.log('   • Click "Update token" or "Generate token"');
console.log('   • Copy the new token value\n');

console.log('2. Update devlog.config.json:');
console.log('   • Replace the token value with your new token');
console.log('   • Ensure projectNumber and projectId are correct\n');

console.log('3. Test the Integration:');
console.log('   • Run: node scripts/check-token-scopes.mjs');
console.log('   • Should show ✅ for both repo and project scopes');
console.log('   • Should show ✅ for project access test\n');

console.log('4. Sync Entries to GitHub Project:');
console.log('   • Run: node scripts/dogfood-github-project.mjs');
console.log('   • Or use MCP: mcp_devlog_find_or_create_devlog + sync methods\n');

console.log('🎯 What This Enables:');
console.log('  • Automatic project board updates');
console.log('  • Status tracking in GitHub Projects');
console.log('  • Visual kanban board workflow');
console.log('  • Team collaboration on devlog items');
console.log('  • Bidirectional sync capabilities\n');

console.log('💡 Architecture:');
console.log('  • Uses GitHub Projects V2 (GraphQL API)');
console.log('  • Creates draft issues in project boards');
console.log('  • Maps devlog status → project status');
console.log('  • Maps devlog priority → project priority');
console.log('  • Maintains references in devlog entries\n');

console.log('🔍 Troubleshooting:');
console.log('  • If scopes still show "None visible" but work, that\'s normal');
console.log('  • Focus on the project access test results');
console.log('  • GraphQL errors indicate permission issues');
console.log('  • REST API success + GraphQL failure = missing project scope\n');

console.log('📚 Available Integration Methods:');
console.log('  • devlog.syncWithGitHubProject(id) - Core API');
console.log('  • mcp_devlog_* tools - MCP interface for AI');
console.log('  • scripts/dogfood-github-project.mjs - Manual testing\n');

console.log('🚦 Ready to proceed? Run the token scope checker first!');
