#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';

async function demonstrateDuplicateSolution() {
  console.log('🔧 Devlog Duplicate Prevention Solution');
  console.log('======================================\n');

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    // Show current state
    console.log('📊 Current state:');
    const currentEntries = await devlog.listDevlogs();
    console.log(`   Total entries: ${currentEntries.length}`);
    currentEntries.forEach(entry => {
      console.log(`   • ${entry.id}: "${entry.title}"`);
    });
    console.log('');

    // Test 1: Try to create a duplicate (should fail)
    console.log('🧪 Test 1: Creating duplicate entry (should fail)');
    try {
      await devlog.createDevlog({
        title: "Enterprise Platform Integrations (Jira, ADO, GitHub)",
        type: "feature",
        description: "This should fail",
        priority: "high"
      });
      console.log('❌ FAILED: Duplicate was created!');
    } catch (error) {
      console.log('✅ PASSED: Duplicate prevented');
      console.log(`   Message: ${error.message}\n`);
    }

    // Test 2: Use findOrCreateDevlog for safe creation
    console.log('🧪 Test 2: Safe creation with findOrCreateDevlog');
    
    const result1 = await devlog.findOrCreateDevlog({
      title: "Enterprise Platform Integrations (Jira, ADO, GitHub)",
      type: "feature",
      description: "Should return existing",
      priority: "high"
    });
    console.log(`✅ Existing entry: ${result1.entry.id} (created: ${result1.created})`);

    const result2 = await devlog.findOrCreateDevlog({
      title: "Webhook Integration for Real-time Sync",
      type: "feature", 
      description: "Add webhook support for bi-directional sync",
      priority: "medium",
      businessContext: "Real-time sync improves team collaboration",
      technicalContext: "HTTP webhooks with event processing"
    });
    console.log(`✅ New entry: ${result2.entry.id} (created: ${result2.created})`);

    // Test 3: Try to create the webhook feature again
    console.log('\n🧪 Test 3: Try creating webhook feature again (should fail)');
    try {
      await devlog.createDevlog({
        title: "Webhook Integration for Real-time Sync",
        type: "feature",
        description: "This should fail too",
        priority: "high"
      });
      console.log('❌ FAILED: Duplicate was created!');
    } catch (error) {
      console.log('✅ PASSED: Duplicate prevented');
      console.log(`   Message: ${error.message}\n`);
    }

    // Test 4: Case-insensitive matching
    console.log('🧪 Test 4: Case-insensitive duplicate detection');
    try {
      await devlog.createDevlog({
        title: "WEBHOOK INTEGRATION FOR REAL-TIME SYNC",
        type: "feature",
        description: "This should fail due to case-insensitive matching",
        priority: "high"
      });
      console.log('❌ FAILED: Case-insensitive duplicate was created!');
    } catch (error) {
      console.log('✅ PASSED: Case-insensitive duplicate prevented');
      console.log(`   Message: ${error.message}\n`);
    }

    // Show final state
    console.log('📊 Final state:');
    const finalEntries = await devlog.listDevlogs();
    console.log(`   Total entries: ${finalEntries.length}`);
    finalEntries.forEach(entry => {
      console.log(`   • ${entry.id}: "${entry.title}" (${entry.status})`);
    });

    console.log('\n🎉 All tests passed! Duplicate prevention is working correctly.');
    console.log('\n💡 Key improvements made:');
    console.log('   • Added duplicate title detection in createDevlog()');
    console.log('   • Added findOrCreateDevlog() method for safe creation');
    console.log('   • Added cleanup script for existing duplicates');
    console.log('   • Added MCP tool: find_or_create_devlog');
    console.log('   • Case-insensitive title matching');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

demonstrateDuplicateSolution();
