#!/usr/bin/env node

/**
 * Get GitHub Project ID for GraphQL API
 * This script helps find the correct projectId for your GitHub project
 */

import fs from 'fs';

async function getGitHubProjectId() {
  console.log('🔍 Finding GitHub Project ID');
  console.log('============================\n');

  try {
    // Load config
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const github = config.integrations.github;
    
    console.log(`Looking for project #${github.projectNumber} for user ${github.owner}...\n`);

    // GraphQL query to get project ID
    const query = `
      query($owner: String!, $number: Int!) {
        user(login: $owner) {
          projectV2(number: $number) {
            id
            title
            url
            fields(first: 10) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      owner: github.owner,
      number: github.projectNumber
    };

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${github.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const project = result.data.user.projectV2;
    
    if (!project) {
      console.error(`❌ Project #${github.projectNumber} not found for user ${github.owner}`);
      return;
    }

    console.log('✅ Project found!');
    console.log(`📋 Title: ${project.title}`);
    console.log(`🆔 Project ID: ${project.id}`);
    console.log(`🔗 URL: ${project.url}\n`);

    console.log('📊 Available Fields:');
    project.fields.nodes.forEach(field => {
      console.log(`  • ${field.name} (${field.id})`);
      if (field.options) {
        field.options.forEach(option => {
          console.log(`    - ${option.name} (${option.id})`);
        });
      }
    });

    console.log('\n🔧 Update your devlog.config.json:');
    console.log(`"projectId": "${project.id}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    console.log('\n🔧 GitHub Personal Access Token Permissions Needed:');
    console.log('  • project:read (for reading project data)');
    console.log('  • project:write (for creating/updating items)');
    console.log('  • repo (for repository access)');
    console.log('\n📝 To update your token:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Edit your token or create a new one');
    console.log('3. Enable the "project" scopes');
    console.log('4. Update devlog.config.json with the new token');
    console.log('\n💡 Alternative: You can find the project ID by:');
    console.log('1. Open your project in browser');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Look for GraphQL requests in Network tab');
    console.log('4. Find the project ID in the request data');
  }
}

getGitHubProjectId();
