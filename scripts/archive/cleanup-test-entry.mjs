#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';

const devlog = new DevlogManager({workspaceRoot: process.cwd()});
const entries = await devlog.searchDevlogs('Webhook Integration');
if (entries.length > 0) {
  await devlog.deleteDevlog(entries[0].id);
  console.log('🧹 Cleaned up webhook test entry');
} else {
  console.log('No webhook test entry found');
}
