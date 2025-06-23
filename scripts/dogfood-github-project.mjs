#!/usr/bin/env node

/**
 * GitHub Project Dogfooding Demo Script
 * 
 * This script demonstrates how to use the new GitHub project integration
 * to sync devlog entries with your GitHub project board.
 */

import { DevlogManager } from '../packages/core/build/devlog-manager.js';
import path from 'path';

async function dogfoodGitHubProject() {
  console.log('🐕 GitHub Project Dogfooding Demo');
  console.log('====================================\n');

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    // Show current devlog entries that could be synced
    console.log('📋 Current In-Progress Devlog Entries:');
    const inProgressEntries = await devlog.listDevlogs({ status: ['in-progress'] });
    
    inProgressEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.title} (${entry.type})`);
      console.log(`   ID: ${entry.id}`);
      console.log(`   Priority: ${entry.priority}`);
      console.log(`   Updated: ${entry.updatedAt}\n`);
    });

    console.log('🔧 Available GitHub Project Integration Methods:');
    console.log('• syncWithGitHubProject(id) - Sync devlog entry to GitHub project');
    console.log('• importGitHubProjectItems() - Import project items as devlog entries');
    console.log('');

    console.log('📚 MCP Tools Available:');
    console.log('• sync_with_github_project - For AI assistants');
    console.log('• import_github_project_items - For AI assistants');
    console.log('');

    console.log('⚙️  To test with your GitHub project:');
    console.log('1. Create devlog.config.json with your GitHub token');
    console.log('2. Update projectId/projectNumber for your project');
    console.log('3. Run: await devlog.syncWithGitHubProject("dogfood-github-project-tracki-a1b2c3d4")');
    console.log('');

    console.log('🎯 Example Configuration:');
    console.log(JSON.stringify({
      "integrations": {
        "github": {
          "owner": "tikazyq",
          "repo": "devlog", 
          "token": "your-token-here",
          "projectNumber": 2,
          "projectId": "your-project-id"
        }
      }
    }, null, 2));

    console.log('\n✨ Ready for real-world dogfooding!');
    console.log('The integration code is complete and ready to sync your devlog entries');
    console.log('with your GitHub project board at https://github.com/users/tikazyq/projects/2');

  } catch (error) {
    console.error('Error:', error);
  }
}

dogfoodGitHubProject();
