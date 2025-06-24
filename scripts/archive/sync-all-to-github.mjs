#!/usr/bin/env node

/**
 * Sync Multiple Devlog Entries to GitHub
 */

import { DevlogManager } from '../packages/core/build/devlog-manager.js';
import fs from 'fs';
import path from 'path';

// Load integrations config
function loadIntegrationsConfig() {
  const configPaths = [
    "devlog.config.json",
    "devlog-integrations.config.json"
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configContent);
        console.log(`📄 Loaded config from: ${configPath}`);
        return config.integrations;
      }
    } catch (error) {
      console.log(`⚠️  Error loading ${configPath}:`, error.message);
    }
  }
  
  return undefined;
}

async function syncMultipleEntries() {
  console.log('🔄 Syncing Multiple Devlog Entries to GitHub');
  console.log('============================================\n');

  const integrations = loadIntegrationsConfig();
  
  if (!integrations) {
    console.log('❌ No integration config found');
    return;
  }

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd(),
    integrations: integrations
  });

  try {
    // Get all in-progress entries
    const inProgressEntries = await devlog.listDevlogs({ status: ['in-progress'] });
    
    console.log(`📋 Found ${inProgressEntries.length} in-progress entries to sync:\n`);
    
    for (const entry of inProgressEntries) {
      console.log(`🔄 Syncing: ${entry.title}`);
      
      try {
        const syncedEntry = await devlog.syncWithGitHub(entry.id);
        
        const githubRef = syncedEntry.externalReferences?.find(ref => ref.system === 'github');
        if (githubRef) {
          console.log(`  ✅ Synced to: ${githubRef.url}`);
        } else {
          console.log(`  ✅ Synced successfully`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for spacing
    }
    
    console.log('🎉 GitHub sync process complete!');
    console.log('Check your repository issues: https://github.com/tikazyq/devlog/issues');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

syncMultipleEntries();
