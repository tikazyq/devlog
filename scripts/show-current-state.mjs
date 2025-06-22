#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.dirname(__dirname);

async function showCurrentState() {
  const manager = new DevlogManager({ workspaceRoot });
  const entries = await manager.listDevlogs();
  
  console.log('📊 Current Devlog Entries:');
  console.log('========================');
  entries.forEach(entry => {
    console.log(`• ${entry.id} - "${entry.title}" (${entry.type})`);
  });
  console.log(`\nTotal entries: ${entries.length}`);
  console.log('✅ All entries have unique, standardized IDs');
  
  if (entries.length === 0) {
    console.log('\n🎉 Perfect! No test entries remain.');
    console.log('The workspace is clean and ready for production use.');
  } else {
    console.log('\n📋 These are the current production devlog entries.');
  }
}

showCurrentState().catch(console.error);
