#!/usr/bin/env node

/**
 * Check GitHub Repository Access
 */

import fs from 'fs';

async function checkGitHubRepo() {
  console.log('🔍 Checking GitHub Repository Access');
  console.log('=====================================\n');

  try {
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const github = config.integrations.github;
    
    console.log(`📦 Repository: ${github.owner}/${github.repo}`);
    console.log(`🔑 Token: ${github.token.substring(0, 20)}...`);
    
    // Check if repo exists and is accessible
    const response = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}`, {
      headers: {
        'Authorization': `token ${github.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const repo = await response.json();
      console.log(`✅ Repository found: ${repo.full_name}`);
      console.log(`📝 Description: ${repo.description || 'No description'}`);
      console.log(`🔒 Private: ${repo.private}`);
      
      // Check token permissions
      const permissionsResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}`, {
        headers: {
          'Authorization': `token ${github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (permissionsResponse.headers.get('x-oauth-scopes')) {
        console.log(`🔐 Token scopes: ${permissionsResponse.headers.get('x-oauth-scopes')}`);
      }
      
    } else if (response.status === 404) {
      console.log(`❌ Repository ${github.owner}/${github.repo} not found or not accessible`);
      console.log('💡 This might be a private repository or the repository name is incorrect');
    } else {
      console.log(`❌ Error accessing repository: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGitHubRepo();
