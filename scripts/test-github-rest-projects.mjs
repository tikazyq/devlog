#!/usr/bin/env node

/**
 * GitHub REST API Project Integration Test
 * 
 * Tests GitHub project management using REST API instead of GraphQL
 * to avoid complex project scope permissions.
 */

import fs from 'fs';

async function testGitHubRestProjects() {
  console.log('🔍 Testing GitHub REST API Project Options');
  console.log('==========================================\n');

  try {
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const github = config.integrations.github;
    
    console.log(`Testing repository: ${github.owner}/${github.repo}\n`);

    // Test 1: List repository projects (Classic Projects)
    console.log('🎯 Test 1: Repository Projects (Classic)');
    try {
      const projectsResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/projects`, {
        headers: {
          'Authorization': `token ${github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        console.log(`✅ Found ${projects.length} classic projects:`);
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
          console.log(`     State: ${project.state}, URL: ${project.html_url}`);
        });
      } else {
        console.log(`❌ Classic projects error: ${projectsResponse.status} ${projectsResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Classic projects error: ${error.message}`);
    }

    console.log('\n🎯 Test 2: Repository Issues (for Project Management)');
    try {
      const issuesResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/issues`, {
        headers: {
          'Authorization': `token ${github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (issuesResponse.ok) {
        const issues = await issuesResponse.json();
        console.log(`✅ Found ${issues.length} issues (can be used for project management)`);
        issues.slice(0, 3).forEach((issue, index) => {
          console.log(`  ${index + 1}. #${issue.number}: ${issue.title}`);
          console.log(`     State: ${issue.state}, Labels: ${issue.labels.map(l => l.name).join(', ')}`);
        });
      } else {
        console.log(`❌ Issues error: ${issuesResponse.status} ${issuesResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Issues error: ${error.message}`);
    }

    console.log('\n🎯 Test 3: Repository Milestones (for Project Tracking)');
    try {
      const milestonesResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/milestones`, {
        headers: {
          'Authorization': `token ${github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (milestonesResponse.ok) {
        const milestones = await milestonesResponse.json();
        console.log(`✅ Found ${milestones.length} milestones:`);
        milestones.forEach((milestone, index) => {
          console.log(`  ${index + 1}. ${milestone.title} (${milestone.open_issues} open, ${milestone.closed_issues} closed)`);
          console.log(`     Due: ${milestone.due_on || 'No due date'}`);
        });
      } else {
        console.log(`❌ Milestones error: ${milestonesResponse.status} ${milestonesResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Milestones error: ${error.message}`);
    }

    console.log('\n🎯 Test 4: Repository Labels (for Categorization)');
    try {
      const labelsResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/labels`, {
        headers: {
          'Authorization': `token ${github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (labelsResponse.ok) {
        const labels = await labelsResponse.json();
        console.log(`✅ Found ${labels.length} labels for project organization:`);
        labels.slice(0, 10).forEach((label, index) => {
          console.log(`  ${index + 1}. ${label.name} (${label.color})`);
        });
      } else {
        console.log(`❌ Labels error: ${labelsResponse.status} ${labelsResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Labels error: ${error.message}`);
    }

    console.log('\n💡 REST API Project Management Strategy:');
    console.log('  🎯 Use Issues as Project Items');
    console.log('  🏷️  Use Labels for Status/Priority/Type');
    console.log('  🎖️  Use Milestones for Project Phases');
    console.log('  📋 Use Classic Projects (if available)');
    console.log('  🔗 Link devlog entries to issues');
    console.log('\n✅ This approach uses only repo permissions!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGitHubRestProjects();
