#!/usr/bin/env node

/**
 * GitHub REST API Project Management Implementation
 * 
 * Enhanced project management using GitHub Issues, Labels, and Milestones
 * with REST API only (no GraphQL or special project permissions needed).
 */

import fs from 'fs';

class GitHubProjectManager {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  // Create or update project milestone
  async createProjectMilestone(title, description, dueDate = null) {
    const milestoneData = {
      title,
      description,
      due_on: dueDate,
      state: 'open'
    };

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/milestones`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(milestoneData)
      }
    );

    if (response.status === 201) {
      const milestone = await response.json();
      console.log(`✅ Created milestone: ${milestone.title} (#${milestone.number})`);
      return milestone;
    } else {
      console.log(`❌ Failed to create milestone: ${response.status} ${response.statusText}`);
      return null;
    }
  }

  // Get or create project status labels
  async ensureProjectLabels() {
    const requiredLabels = [
      { name: 'status-todo', color: 'ededed', description: 'Task not started' },
      { name: 'status-in-progress', color: 'fbca04', description: 'Task in progress' },
      { name: 'status-review', color: 'ff9500', description: 'Task in review' },
      { name: 'status-testing', color: '0075ca', description: 'Task in testing' },
      { name: 'status-blocked', color: 'd73a4a', description: 'Task blocked' },
      { name: 'status-done', color: '0e8a16', description: 'Task completed' },
      { name: 'priority-critical', color: 'b60205', description: 'Critical priority' },
      { name: 'priority-high', color: 'd93f0b', description: 'High priority' },
      { name: 'priority-medium', color: 'fbca04', description: 'Medium priority' },
      { name: 'priority-low', color: '0075ca', description: 'Low priority' },
      { name: 'type-feature', color: 'a2eeef', description: 'New feature' },
      { name: 'type-bug', color: 'd73a4a', description: 'Bug fix' },
      { name: 'type-task', color: 'ededed', description: 'General task' },
      { name: 'type-refactor', color: 'b60205', description: 'Code refactoring' },
      { name: 'type-docs', color: '0075ca', description: 'Documentation' }
    ];

    console.log('🏷️  Ensuring project management labels...');
    
    for (const label of requiredLabels) {
      try {
        // Try to create the label
        const response = await fetch(
          `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/labels`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(label)
          }
        );

        if (response.status === 201) {
          console.log(`  ✅ Created label: ${label.name}`);
        } else if (response.status === 422) {
          console.log(`  ⚠️  Label exists: ${label.name}`);
        } else {
          console.log(`  ❌ Failed to create label ${label.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error creating label ${label.name}: ${error.message}`);
      }
    }
  }

  // Create project board using milestone + labels
  async createProjectBoard(projectName, description) {
    console.log(`🚀 Creating REST API Project Board: ${projectName}`);
    
    // Create milestone for the project
    const milestone = await this.createProjectMilestone(
      projectName,
      description,
      null // No due date for now
    );

    // Ensure all project labels exist
    await this.ensureProjectLabels();

    if (milestone) {
      console.log(`\n📋 Project Board Created Successfully!`);
      console.log(`   📌 Milestone: ${milestone.title} (#${milestone.number})`);
      console.log(`   🔗 URL: ${milestone.html_url}`);
      console.log(`   🎯 Strategy: Use issues with milestone + status labels`);
      
      return {
        milestone,
        strategy: 'issues-with-milestone-and-labels'
      };
    }

    return null;
  }

  // Add devlog entry to project (create issue with milestone + labels)
  async addDevlogToProject(devlogEntry, milestoneNumber = null) {
    const labels = [
      `type-${devlogEntry.type}`,
      `priority-${devlogEntry.priority}`,
      `status-${devlogEntry.status}`
    ];

    const issueData = {
      title: devlogEntry.title,
      body: this.formatDevlogForGitHub(devlogEntry),
      labels: labels,
      milestone: milestoneNumber
    };

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(issueData)
      }
    );

    if (response.status === 201) {
      const issue = await response.json();
      console.log(`✅ Added to project: Issue #${issue.number} - ${issue.title}`);
      return issue;
    } else {
      console.log(`❌ Failed to add to project: ${response.status} ${response.statusText}`);
      return null;
    }
  }

  // Update project item status (update issue labels)
  async updateProjectItemStatus(issueNumber, newStatus) {
    // Get current labels
    const issueResponse = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
      { headers: this.headers }
    );

    if (!issueResponse.ok) {
      console.log(`❌ Failed to get issue: ${issueResponse.status}`);
      return false;
    }

    const issue = await issueResponse.json();
    const currentLabels = issue.labels.map(l => l.name);
    
    // Remove old status labels and add new one
    const updatedLabels = currentLabels
      .filter(label => !label.startsWith('status-'))
      .concat([`status-${newStatus}`]);

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ labels: updatedLabels })
      }
    );

    if (response.ok) {
      console.log(`✅ Updated issue #${issueNumber} status to: ${newStatus}`);
      return true;
    } else {
      console.log(`❌ Failed to update status: ${response.status} ${response.statusText}`);
      return false;
    }
  }

  // Get project overview (milestone + issues)
  async getProjectOverview(milestoneNumber = null) {
    let url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`;
    if (milestoneNumber) {
      url += `?milestone=${milestoneNumber}`;
    }

    const response = await fetch(url, { headers: this.headers });
    
    if (response.ok) {
      const issues = await response.json();
      return this.analyzeProjectIssues(issues);
    } else {
      console.log(`❌ Failed to get project overview: ${response.status}`);
      return null;
    }
  }

  // Analyze project issues for dashboard
  analyzeProjectIssues(issues) {
    const analysis = {
      total: issues.length,
      byStatus: {},
      byPriority: {},
      byType: {}
    };

    issues.forEach(issue => {
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
    
    body += `---\n*Synced from devlog entry: ${entry.id}*`;
    
    return body;
  }
}

// Demo usage
async function demoGitHubRestProjectManagement() {
  console.log('🎯 GitHub REST API Project Management Demo');
  console.log('==========================================\n');

  try {
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const projectManager = new GitHubProjectManager(config.integrations.github);

    // Create project board
    const project = await projectManager.createProjectBoard(
      'Devlog Development Sprint',
      'Current development sprint for devlog features and integrations'
    );

    if (project) {
      console.log('\n📊 Project Board Setup Complete!');
      console.log('   🎯 Use milestone + labels for project management');
      console.log('   🔄 Update issue labels to change status');
      console.log('   📈 View project progress via milestone page');
    }

    // Get current project overview
    console.log('\n📋 Current Project Status:');
    const overview = await projectManager.getProjectOverview();
    if (overview) {
      console.log(`   Total Issues: ${overview.total}`);
      console.log(`   By Status:`, overview.byStatus);
      console.log(`   By Priority:`, overview.byPriority);
      console.log(`   By Type:`, overview.byType);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoGitHubRestProjectManagement();
}

export { GitHubProjectManager };
