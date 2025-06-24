#!/usr/bin/env node

/**
 * GitHub REST API Project Integration - Live Demo
 * 
 * Demonstrates project management using GitHub REST API only,
 * integrating with existing devlog entries through issues and labels.
 */

import fs from 'fs';
import { DevlogManager } from '../packages/core/build/devlog-manager.js';

class GitHubRestProjectIntegration {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  // Sync devlog entry to GitHub project using REST API
  async syncDevlogToProject(devlogEntry, milestoneNumber = null) {
    console.log(`🔄 Syncing devlog entry: ${devlogEntry.title}`);
    
    const labels = [
      `type-${devlogEntry.type}`,
      `priority-${devlogEntry.priority}`,
      `status-${devlogEntry.status}`
    ];

    // Check if this devlog already has a GitHub issue
    const existingGitHubRef = devlogEntry.externalReferences?.find(ref => 
      ref.system === "github" && ref.url?.includes('/issues/')
    );

    if (existingGitHubRef) {
      // Update existing issue with project labels
      const issueNumber = existingGitHubRef.url.split('/').pop();
      console.log(`  📝 Updating existing issue #${issueNumber}`);
      
      const result = await this.updateIssueLabels(issueNumber, labels);
      if (result) {
        console.log(`  ✅ Updated issue #${result.number} with project labels`);
        return result;
      }
    } else {
      // Create new issue as project item
      console.log(`  🆕 Creating new issue for project management`);
      
      const issueData = {
        title: devlogEntry.title,
        body: this.formatDevlogForGitHub(devlogEntry),
        labels: labels,
        milestone: milestoneNumber
      };

      const result = await this.createIssue(issueData);
      if (result) {
        console.log(`  ✅ Created issue #${result.number} as project item`);
        return result;
      }
    }
    
    return null;
  }

  // Create new issue
  async createIssue(issueData) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(issueData)
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        console.log(`❌ Failed to create issue: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error creating issue: ${error.message}`);
      return null;
    }
  }

  // Update issue labels
  async updateIssueLabels(issueNumber, newLabels) {
    try {
      // Get current issue to preserve non-project labels
      const issueResponse = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
        { headers: this.headers }
      );

      if (!issueResponse.ok) {
        console.log(`❌ Failed to get issue: ${issueResponse.status}`);
        return null;
      }

      const issue = await issueResponse.json();
      const currentLabels = issue.labels.map(l => l.name);
      
      // Remove old project labels and add new ones
      const nonProjectLabels = currentLabels.filter(label => 
        !label.startsWith('type-') && 
        !label.startsWith('priority-') && 
        !label.startsWith('status-')
      );
      
      const updatedLabels = [...nonProjectLabels, ...newLabels];

      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
        {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify({ labels: updatedLabels })
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        console.log(`❌ Failed to update labels: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error updating labels: ${error.message}`);
      return null;
    }
  }

  // Get project overview using issues
  async getProjectOverview() {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues?state=all`,
        { headers: this.headers }
      );

      if (response.ok) {
        const issues = await response.json();
        return this.analyzeProjectIssues(issues);
      } else {
        console.log(`❌ Failed to get issues: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error getting project overview: ${error.message}`);
      return null;
    }
  }

  // Analyze issues for project metrics
  analyzeProjectIssues(issues) {
    const projectIssues = issues.filter(issue => 
      issue.labels.some(label => 
        label.name.startsWith('type-') || 
        label.name.startsWith('status-') || 
        label.name.startsWith('priority-')
      )
    );

    const analysis = {
      total: projectIssues.length,
      open: projectIssues.filter(i => i.state === 'open').length,
      closed: projectIssues.filter(i => i.state === 'closed').length,
      byStatus: {},
      byPriority: {},
      byType: {}
    };

    projectIssues.forEach(issue => {
      const labels = issue.labels.map(l => l.name);
      
      // Count by status
      const statusLabel = labels.find(l => l.startsWith('status-'));
      if (statusLabel) {
        const status = statusLabel.replace('status-', '');
        analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
      }

      // Count by priority
      const priorityLabel = labels.find(l => l.startsWith('priority-'));
      if (priorityLabel) {
        const priority = priorityLabel.replace('priority-', '');
        analysis.byPriority[priority] = (analysis.byPriority[priority] || 0) + 1;
      }

      // Count by type
      const typeLabel = labels.find(l => l.startsWith('type-'));
      if (typeLabel) {
        const type = typeLabel.replace('type-', '');
        analysis.byType[type] = (analysis.byType[type] || 0) + 1;
      }
    });

    return analysis;
  }

  formatDevlogForGitHub(entry) {
    let body = `${entry.description}\n\n`;
    
    if (entry.businessContext) {
      body += `## Business Context\n${entry.businessContext}\n\n`;
    }
    
    if (entry.technicalContext) {
      body += `## Technical Context\n${entry.technicalContext}\n\n`;
    }
    
    if (entry.acceptanceCriteria && entry.acceptanceCriteria.length > 0) {
      body += `## Acceptance Criteria\n${entry.acceptanceCriteria.map(c => `- ${c}`).join('\n')}\n\n`;
    }
    
    if (entry.notes && entry.notes.length > 0) {
      body += `## Recent Notes\n`;
      entry.notes.slice(-3).forEach(note => {
        body += `- **${note.category}** (${note.timestamp}): ${note.note}\n`;
      });
      body += '\n';
    }
    
    body += `---\n*Synced from devlog entry: \`${entry.id}\`*\n`;
    body += `*Status: ${entry.status} | Priority: ${entry.priority} | Type: ${entry.type}*`;
    
    return body;
  }
}

// Main demo function
async function demonstrateGitHubRestProjectIntegration() {
  console.log('🚀 GitHub REST API Project Integration Demo');
  console.log('============================================\n');

  try {
    // Load configuration
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const projectIntegration = new GitHubRestProjectIntegration(config.integrations.github);
    
    // Initialize devlog manager
    const devlog = new DevlogManager({
      workspaceRoot: process.cwd()
    });

    // Get current in-progress devlog entries
    console.log('📋 Getting current devlog entries...');
    const entries = await devlog.listDevlogs({ status: ['in-progress', 'review', 'testing'] });
    console.log(`Found ${entries.length} active entries\n`);

    // Sync each entry to GitHub project
    for (const entry of entries) {
      const result = await projectIntegration.syncDevlogToProject(entry);
      if (result) {
        console.log(`   🔗 GitHub Issue: ${result.html_url}`);
        console.log(`   🏷️  Labels: ${result.labels.map(l => l.name).join(', ')}`);
      }
      console.log('');
    }

    // Show project overview
    console.log('📊 Project Overview:');
    const overview = await projectIntegration.getProjectOverview();
    if (overview) {
      console.log(`   📈 Total Project Items: ${overview.total}`);
      console.log(`   📊 Open: ${overview.open}, Closed: ${overview.closed}`);
      console.log(`   🎯 By Status:`, overview.byStatus);
      console.log(`   ⭐ By Priority:`, overview.byPriority);
      console.log(`   🔧 By Type:`, overview.byType);
    }

    console.log('\n🎉 GitHub REST API Project Integration Complete!');
    console.log('   ✅ Uses only repo permissions (no project scopes needed)');
    console.log('   ✅ Issues serve as project items');
    console.log('   ✅ Labels provide status/priority/type tracking');
    console.log('   ✅ Compatible with existing GitHub Issues integration');
    console.log(`   🔗 View project: https://github.com/${config.integrations.github.owner}/${config.integrations.github.repo}/issues`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure devlog.config.json exists with valid GitHub configuration');
  }
}

// Run the demo
demonstrateGitHubRestProjectIntegration();
