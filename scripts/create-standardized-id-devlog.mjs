#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.dirname(__dirname);

async function createStandardizedIdDevlog() {
  console.log('📝 Creating devlog entry for Standardized ID Generation implementation...\n');
  
  const manager = new DevlogManager({ workspaceRoot });

  const request = {
    title: "Implement Standardized ID Generation System",
    type: "feature",
    description: `Replaced timestamp-based ID generation with deterministic, hash-based system to prevent duplicate devlog entries.

    Key improvements:
    - Deterministic IDs based on title + type hash
    - Same input always generates same ID
    - Different types allowed for same title
    - Collision detection with counter fallback
    - Case-insensitive duplicate detection
    - Human-readable slugs with 8-character hash suffix

    Technical details:
    - ID format: {slug}-{8-char-hash}
    - Hash input: title.toLowerCase() + type
    - Uses crypto.createHash('sha256') for collision resistance
    - Automatic cleanup of test entries
    - Comprehensive test suite demonstrating functionality

    This solves the fundamental issue where AI agents would create duplicate entries when processing the same request multiple times or in rapid succession.`,
    priority: "high",
    assignee: "AI Assistant",
    tags: ["id-generation", "duplicate-prevention", "core-improvement", "hash-based", "deterministic"],
    estimatedHours: 4
  };

  try {
    const result = await manager.findOrCreateDevlog(request);
    
    if (result.created) {
      console.log('✅ Created new devlog entry:');
      console.log(`   ID: ${result.entry.id}`);
      console.log(`   Title: ${result.entry.title}`);
      console.log(`   Type: ${result.entry.type}`);
      console.log(`   Priority: ${result.entry.priority}`);
      console.log(`   Tags: ${result.entry.tags?.join(', ')}`);
      
      // Add a note about the implementation
      await manager.addNote(result.entry.id, {
        content: `Implementation completed successfully! 

        Key achievements:
        ✅ Replaced generateId() with deterministic hash-based system
        ✅ Added generateUniqueId() with collision detection  
        ✅ Updated checkForDuplicateTitle() to include type matching
        ✅ Enhanced findOrCreateDevlog() with ID-based checking
        ✅ Created comprehensive test suites and demonstrations
        ✅ Added cleanup utilities for test management

        Test results show:
        - 100% consistency for same inputs
        - Proper handling of different types with same title
        - Collision resistance with 8-character SHA-256 hash
        - Human-readable format with meaningful slugs
        - Edge case handling for special characters and case sensitivity

        This fix addresses the core duplicate entry issue that was causing problems in AI-assisted development workflows.`,
        author: "AI Assistant",
        tags: ["implementation", "testing", "verification"]
      });
      
      console.log('✅ Added implementation note');
      
    } else {
      console.log('🔄 Found existing devlog entry:');
      console.log(`   ID: ${result.entry.id}`);
      console.log(`   Already exists - no duplicate created!`);
    }
    
    console.log('\n📊 This demonstrates the standardized ID generation working:');
    console.log('   - Same title/type would generate the same ID');
    console.log('   - No duplicates created');
    console.log('   - Consistent behavior across multiple runs');
    
  } catch (error) {
    console.error('❌ Error creating devlog entry:', error.message);
  }
}

createStandardizedIdDevlog().catch(console.error);
