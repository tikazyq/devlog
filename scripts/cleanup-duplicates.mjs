#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';
import * as fs from 'fs';

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate devlog entries');
  console.log('=====================================\n');

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    // Get all devlog entries
    const entries = await devlog.listDevlogs();
    console.log(`Found ${entries.length} total entries`);

    // Group by title to find duplicates
    const titleGroups = {};
    entries.forEach(entry => {
      const normalizedTitle = entry.title.toLowerCase().trim();
      if (!titleGroups[normalizedTitle]) {
        titleGroups[normalizedTitle] = [];
      }
      titleGroups[normalizedTitle].push(entry);
    });

    // Find and handle duplicates
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    for (const [title, group] of Object.entries(titleGroups)) {
      if (group.length > 1) {
        duplicatesFound += group.length - 1;
        console.log(`\n📋 Found ${group.length} entries for: "${group[0].title}"`);
        
        // Sort by updated date to keep the most recent
        group.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        const keepEntry = group[0];
        const removeEntries = group.slice(1);
        
        console.log(`✅ Keeping: ${keepEntry.id} (updated: ${keepEntry.updatedAt})`);
        
        for (const entry of removeEntries) {
          console.log(`🗑️  Removing: ${entry.id} (updated: ${entry.updatedAt})`);
          await devlog.deleteDevlog(entry.id);
          duplicatesRemoved++;
        }
      }
    }

    if (duplicatesFound === 0) {
      console.log('\n✨ No duplicates found!');
    } else {
      console.log(`\n🎉 Cleanup complete!`);
      console.log(`   Duplicates found: ${duplicatesFound}`);
      console.log(`   Duplicates removed: ${duplicatesRemoved}`);
      
      // Show final stats
      const finalEntries = await devlog.listDevlogs();
      console.log(`   Remaining entries: ${finalEntries.length}`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupDuplicates();
