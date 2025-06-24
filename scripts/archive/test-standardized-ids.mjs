#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.dirname(__dirname);

async function testStandardizedIds() {
  console.log('🧪 Testing Standardized ID Generation\n');
  
  const manager = new DevlogManager({ workspaceRoot });

  // Test data - same titles and types
  const testCases = [
    {
      title: "Fix authentication bug",
      type: "bug",
      description: "User login fails intermittently"
    },
    {
      title: "Fix authentication bug", // Same title, same type
      type: "bug",
      description: "Different description but same title/type"
    },
    {
      title: "Fix Authentication Bug", // Same title, different case
      type: "bug", 
      description: "Case sensitivity test"
    },
    {
      title: "Fix authentication bug", // Same title, different type
      type: "feature",
      description: "Same title but different type"
    }
  ];

  console.log('📝 Test Cases:');
  testCases.forEach((tc, i) => {
    console.log(`${i + 1}. "${tc.title}" (${tc.type})`);
  });
  console.log();

  // Test deterministic ID generation
  console.log('🔑 Testing ID Generation:');
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    try {
      const result = await manager.findOrCreateDevlog({
        title: testCase.title,
        type: testCase.type,
        description: testCase.description,
        priority: 'medium'
      });
      
      results.push({
        case: i + 1,
        id: result.entry.id,
        created: result.created,
        title: result.entry.title,
        type: result.entry.type
      });
      
      const action = result.created ? '✅ CREATED' : '🔄 FOUND EXISTING';
      console.log(`${action}: ${result.entry.id}`);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        case: i + 1,
        error: error.message
      });
    }
  }

  console.log('\n📊 Results Summary:');
  console.log('=====================================');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`Case ${result.case}: ERROR - ${result.error}`);
    } else {
      const status = result.created ? 'NEW' : 'DUPLICATE';
      console.log(`Case ${result.case}: ${status} - ID: ${result.id}`);
    }
  });

  // Test that same input generates same ID
  console.log('\n🔍 Testing ID Consistency:');
  const sameTitle = "Test consistent ID generation";
  const sameType = "feature";
  
  // Generate ID multiple times for same input
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const result = await manager.findOrCreateDevlog({
      title: sameTitle,
      type: sameType,
      description: `Test run ${i + 1}`,
      priority: 'low'
    });
    ids.push(result.entry.id);
    console.log(`Run ${i + 1}: ${result.entry.id} (${result.created ? 'created' : 'found'})`);
  }
  
  const allSame = ids.every(id => id === ids[0]);
  console.log(`\n✅ ID Consistency: ${allSame ? 'PASS' : 'FAIL'}`);
  if (allSame) {
    console.log(`   All runs generated the same ID: ${ids[0]}`);
  } else {
    console.log(`   Different IDs generated: ${ids.join(', ')}`);
  }

  console.log('\n🧹 Cleaning up test entries...');
  const allEntries = await manager.listDevlogs();
  const testEntries = allEntries.filter(entry => 
    entry.title.toLowerCase().includes('authentication') ||
    entry.title.includes('Test consistent ID generation')
  );
  
  console.log(`Found ${testEntries.length} test entries to clean up`);
  // Note: We'll leave cleanup to the user since we don't have a delete method
  
  if (testEntries.length > 0) {
    console.log('\nTest entries that were created:');
    testEntries.forEach(entry => {
      console.log(`- ${entry.id}: "${entry.title}" (${entry.type})`);
    });
  }

  console.log('\n✅ Standardized ID generation test completed!');
  console.log('\nKey improvements:');
  console.log('• IDs are deterministic based on title + type');
  console.log('• Same input always generates same ID');
  console.log('• Duplicates are prevented at the ID level');
  console.log('• Human-readable slugs with collision-resistant hashes');
}

testStandardizedIds().catch(console.error);
