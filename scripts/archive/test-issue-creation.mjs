#!/usr/bin/env node

/**
 * Test GitHub Issue Creation
 */

import fs from 'fs';

async function testIssueCreation() {
  console.log('🧪 Testing GitHub Issue Creation');
  console.log('=================================\n');

  try {
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const github = config.integrations.github;
    
    const issueData = {
      title: 'Test Issue from Devlog Integration',
      body: 'This is a test issue created by the devlog GitHub integration system.',
      labels: ['test', 'devlog-integration']
    };
    
    console.log('📝 Creating test issue...');
    
    const response = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${github.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(issueData)
    });
    
    if (response.ok) {
      const issue = await response.json();
      console.log(`✅ Issue created successfully!`);
      console.log(`🔗 URL: ${issue.html_url}`);
      console.log(`🆔 Number: #${issue.number}`);
      console.log(`📊 State: ${issue.state}`);
    } else {
      const error = await response.text();
      console.log(`❌ Failed to create issue: ${response.status} ${response.statusText}`);
      console.log(`📄 Response: ${error}`);
      
      if (response.status === 403) {
        console.log('\n💡 This suggests the token needs "repo" or "public_repo" permissions');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testIssueCreation();
