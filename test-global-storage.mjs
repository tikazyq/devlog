#!/usr/bin/env node

import { ConfigurationManager } from './packages/core/build/configuration-manager.js';

async function testGlobalStorage() {
  console.log('🧪 Testing new global storage system...');
  
  const configManager = new ConfigurationManager();
  const config = await configManager.loadConfig();
  
  console.log('\n📋 Generated configuration:');
  console.log(JSON.stringify(config, null, 2));
  
  console.log('\n🗂️  Storage details:');
  console.log('Database path:', config.storage.filePath);
  console.log('Workspace ID:', config.workspaceId);
  console.log('Workspace root:', config.workspaceRoot);
  
  console.log('\n✅ Global storage test completed');
}

testGlobalStorage().catch(console.error);
