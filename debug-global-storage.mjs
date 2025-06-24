#!/usr/bin/env node

import { ConfigurationManager } from './packages/core/build/configuration-manager.js';
import path from 'path';
import os from 'os';

async function debugGlobalStorage() {
  console.log('🔍 Debugging global storage system...');
  
  const homeDir = os.homedir();
  console.log('Home directory:', homeDir);
  console.log('Expected global devlog dir:', path.join(homeDir, '.devlog'));
  
  const configManager = new ConfigurationManager();
  
  // Test workspace detection
  console.log('\n🗂️  Testing workspace detection...');
  console.log('Current working directory:', process.cwd());
  
  // Access private methods through config generation
  const config = await configManager.loadConfig();
  
  console.log('\n📋 Generated configuration:');
  console.log(JSON.stringify(config, null, 2));
  
  // Check if global directories exist
  const globalDevlogDir = path.join(homeDir, '.devlog');
  const workspacesDir = path.join(globalDevlogDir, 'workspaces');
  const workspaceId = config.workspaceId;
  const expectedWorkspaceDir = path.join(workspacesDir, workspaceId);
  const expectedDbPath = path.join(expectedWorkspaceDir, 'devlog.db');
  
  console.log('\n🎯 Expected paths:');
  console.log('Global dir:', globalDevlogDir);
  console.log('Workspaces dir:', workspacesDir);
  console.log('Workspace ID:', workspaceId);
  console.log('Expected workspace dir:', expectedWorkspaceDir);
  console.log('Expected DB path:', expectedDbPath);
  
  console.log('\n🔍 Actual vs Expected:');
  console.log('Actual DB path:', config.storage.filePath);
  console.log('Expected DB path:', expectedDbPath);
  console.log('Paths match:', config.storage.filePath === expectedDbPath);
}

debugGlobalStorage().catch(console.error);
