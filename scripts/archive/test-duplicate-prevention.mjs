#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';

async function testDuplicatePrevention() {
  console.log('🧪 Testing Duplicate Prevention');
  console.log('===============================\n');

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    // Try to create the same integration devlog again
    console.log('1️⃣ Attempting to create duplicate entry...');
    
    try {
      const entry = await devlog.createDevlog({
        title: "Enterprise Platform Integrations (Jira, ADO, GitHub)",
        type: "feature",
        description: "This should fail because it's a duplicate",
        priority: "high"
      });
      console.log('❌ ERROR: Duplicate was created! This should not happen.');
    } catch (error) {
      console.log('✅ SUCCESS: Duplicate prevention worked!');
      console.log(`   Error message: ${error.message}\n`);
    }

    // Test the findOrCreateDevlog method
    console.log('2️⃣ Testing findOrCreateDevlog method...');
    
    const result1 = await devlog.findOrCreateDevlog({
      title: "Enterprise Platform Integrations (Jira, ADO, GitHub)",
      type: "feature", 
      description: "This should return the existing entry",
      priority: "high"
    });
    
    console.log(`✅ Found existing entry: ${result1.entry.id} (created: ${result1.created})`);
    
    const result2 = await devlog.findOrCreateDevlog({
      title: "New Feature That Doesn't Exist Yet",
      type: "feature",
      description: "This should create a new entry",
      priority: "medium"
    });
    
    console.log(`✅ Created new entry: ${result2.entry.id} (created: ${result2.created})`);

    // Clean up the test entry
    await devlog.deleteDevlog(result2.entry.id);
    console.log('🧹 Cleaned up test entry');

    // Show current stats
    console.log('\n📊 Current devlog stats:');
    const stats = await devlog.getStats();
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Features: ${stats.byType.feature || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDuplicatePrevention();
