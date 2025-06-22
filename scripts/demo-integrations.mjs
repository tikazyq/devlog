#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';

async function demonstrateIntegrations() {
  console.log('🔗 Devlog Enterprise Integrations Demo');
  console.log('=====================================\n');

  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    // Get our integration devlog
    const entries = await devlog.searchDevlogs('Enterprise Platform Integrations');
    if (entries.length === 0) {
      console.log('❌ No integration devlog found. Run create-integration-devlog.mjs first.');
      return;
    }

    const integrationDevlog = entries[0];
    console.log(`📋 Found devlog: ${integrationDevlog.title}`);
    console.log(`📊 Status: ${integrationDevlog.status}`);
    console.log(`🎯 Priority: ${integrationDevlog.priority}`);
    console.log(`📅 Last Updated: ${integrationDevlog.updatedAt}\n`);

    // Show the AI context
    console.log('🤖 AI Context Summary:');
    console.log('======================');
    console.log(`📝 Summary: ${integrationDevlog.aiContext.currentSummary}\n`);
    
    console.log('💡 Key Insights:');
    integrationDevlog.aiContext.keyInsights.forEach(insight => {
      console.log(`  • ${insight}`);
    });
    console.log('');

    console.log('🎯 Next Steps:');
    integrationDevlog.aiContext.suggestedNextSteps.forEach(step => {
      console.log(`  • ${step}`);
    });
    console.log('');

    // Show acceptance criteria
    console.log('✅ Acceptance Criteria:');
    integrationDevlog.context.acceptanceCriteria.forEach(criteria => {
      console.log(`  • ${criteria}`);
    });
    console.log('');

    // Demo the integration methods (these would fail without real configs)
    console.log('🚀 Available Integration Methods:');
    console.log('=================================');
    console.log('• syncWithJira(id) - Sync devlog with Jira issue');
    console.log('• syncWithADO(id) - Sync devlog with Azure DevOps work item');
    console.log('• syncWithGitHub(id) - Sync devlog with GitHub issue');
    console.log('• syncAllIntegrations(id) - Sync with all configured platforms');
    console.log('');

    console.log('⚙️  To use integrations:');
    console.log('1. Copy devlog-integrations.config.template.json');
    console.log('2. Fill in your platform credentials');
    console.log('3. Rename to devlog-integrations.config.json');
    console.log('4. Run: await devlog.syncWithJira(entry.id)');
    console.log('');

    console.log('📊 Current Stats:');
    const stats = await devlog.getStats();
    console.log(`Total Entries: ${stats.totalEntries}`);
    console.log(`In Progress: ${stats.byStatus["in-progress"] || 0}`);
    console.log(`Features: ${stats.byType.feature || 0}`);
    console.log(`High Priority: ${stats.byPriority.high || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demonstrateIntegrations();
