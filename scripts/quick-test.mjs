#!/usr/bin/env node

/**
 * Quick test script for manual testing of the devlog system
 * Usage: node scripts/quick-test.js
 */

import { DevlogManager } from '../packages/mcp-server/build/devlog-manager.js';
import path from 'path';

async function quickTest() {
  console.log('🧪 Quick Devlog Test');
  console.log('===================\n');

  const testWorkspace = path.join(process.cwd(), 'quick-test-workspace');
  const manager = new DevlogManager(testWorkspace);

  try {
    // Test 1: Create a feature
    console.log('1️⃣ Creating a feature...');
    const feature = await manager.createDevlog({
      title: 'User Authentication',
      type: 'feature',
      description: 'Implement JWT-based authentication system',
      priority: 'high'
    });
    console.log('✅ Feature created\n');

    // Test 2: Create a bug fix
    console.log('2️⃣ Creating a bug fix...');
    const bugfix = await manager.createDevlog({
      title: 'Login Form Validation',
      type: 'bugfix',
      description: 'Fix validation issues on login form',
      priority: 'medium'
    });
    console.log('✅ Bug fix created\n');

    // Test 3: Update the feature status
    console.log('3️⃣ Starting work on feature...');
    const featureId = feature.content[0].text.match(/Created devlog entry: (.+)/)?.[1]?.split('\n')[0];
    if (featureId) {
      await manager.updateDevlog({
        id: featureId,
        status: 'in-progress',
        progress: 'Set up authentication middleware'
      });
      console.log('✅ Feature status updated\n');
    }

    // Test 4: Add a note with files
    console.log('4️⃣ Adding progress note...');
    if (featureId) {
      await manager.addNote({
        id: featureId,
        note: 'Implemented JWT token generation and validation',
        category: 'progress',
        files: ['src/auth/jwt.ts', 'src/middleware/auth.ts'],
        codeChanges: 'Added JWT utility functions and authentication middleware'
      });
      console.log('✅ Note added\n');
    }

    // Test 5: Search functionality
    console.log('5️⃣ Testing search...');
    const searchResult = await manager.searchDevlogs('authentication');
    console.log('✅ Search completed\n');

    // Test 6: Get active context
    console.log('6️⃣ Getting active context...');
    const context = await manager.getActiveContext(5);
    console.log('✅ Active context retrieved\n');

    // Test 7: List all devlogs
    console.log('7️⃣ Listing all devlogs...');
    const allDevlogs = await manager.listDevlogs();
    console.log('✅ All devlogs listed\n');

    console.log('🎉 All tests completed successfully!');
    console.log(`📁 Test data saved in: ${testWorkspace}`);
    console.log('🗑️  You can delete the test workspace when done testing');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1].endsWith('quick-test.mjs')) {
  quickTest();
}

export { quickTest };
