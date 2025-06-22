#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/index.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.dirname(__dirname);

async function cleanupAllTestEntries() {
  console.log('🧹 Cleaning up all test entries...\n');
  
  const manager = new DevlogManager({ workspaceRoot });
  const devlogDir = await manager.getDevlogDir();
  
  try {
    const allEntries = await manager.listDevlogs();
    const testEntries = allEntries.filter(entry => 
      entry.title.toLowerCase().includes('authentication') ||
      entry.title.includes('Test consistent ID generation') ||
      entry.title.includes('user authentication') ||
      entry.title.includes('password reset') ||
      entry.title.includes('auth-service') ||
      entry.title.toLowerCase().includes('test')
    );
    
    console.log(`Found ${testEntries.length} test entries to clean up`);
    
    for (const entry of testEntries) {
      try {
        const filePath = path.join(devlogDir, `${entry.id}.json`);
        await fs.unlink(filePath);
        console.log(`✅ Deleted: ${entry.id} - "${entry.title}"`);
      } catch (error) {
        console.log(`❌ Failed to delete ${entry.id}: ${error.message}`);
      }
    }
    
    // Update index
    try {
      const indexPath = path.join(devlogDir, 'index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      
      for (const entry of testEntries) {
        delete index[entry.id];
      }
      
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
      console.log('✅ Updated index file');
    } catch (error) {
      console.log(`❌ Failed to update index: ${error.message}`);
    }
    
    console.log('\n✅ All test entries cleaned up!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupAllTestEntries().catch(console.error);
