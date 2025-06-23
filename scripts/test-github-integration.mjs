#!/usr/bin/env node

/**
 * Test GitHub Integration
 * This script tests the GitHub integration with our devlog system
 */

import { DevlogManager } from '../packages/core/build/devlog-manager.js';
import fs from 'fs';
import path from 'path';

// Load integrations config
function loadIntegrationsConfig() {
  const configPaths = [
    "devlog.config.json",
    "devlog-integrations.config.json", // backward compatibility
    path.join(process.env.HOME || "~", ".devlog.config.json")
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

async function testGitHubIntegration() {
  console.log('🧪 Testing GitHub Integration');
  console.log('==============================\n');

  // Load integrations config
  const integrations = loadIntegrationsConfig();
  
  if (!integrations) {
    console.log('❌ No integration config found');
    console.log('📝 Create devlog.config.json with your GitHub credentials');
    return;
  }

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd(),
    integrations: integrations
  });

  try {
    console.log('📋 Testing with our dogfooding entry...');
    
    // Test basic GitHub issue sync first
    console.log('🔗 Testing GitHub issue sync...');
    const entry = await devlog.syncWithGitHub('dogfood-github-project-tracki-a1b2c3d4');
    
    console.log('✅ GitHub issue sync successful!');
    console.log(`📝 Entry: ${entry.title}`);
    
    if (entry.externalReferences) {
      const githubRef = entry.externalReferences.find(ref => ref.system === 'github');
      if (githubRef) {
        console.log(`🔗 GitHub Issue: ${githubRef.url}`);
        console.log(`📊 Status: ${githubRef.status}`);
      }
    }
    
    console.log('\n🎯 Next: Update GitHub PAT with project permissions for project sync');
    
  } catch (error) {
    console.error('❌ Error testing GitHub integration:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that devlog.config.json exists');
    console.log('2. Verify GitHub token has repo permissions');
    console.log('3. Ensure repository exists and is accessible');
  }
}

testGitHubIntegration();
