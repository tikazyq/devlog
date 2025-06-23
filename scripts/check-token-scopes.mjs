#!/usr/bin/env node

/**
 * Check GitHub Token Scopes
 */

import fs from 'fs';

async function checkTokenScopes() {
  console.log('🔐 Checking GitHub Token Scopes');
  console.log('================================\n');

  try {
    const config = JSON.parse(fs.readFileSync('devlog.config.json', 'utf-8'));
    const github = config.integrations.github;
    
    // Check token scopes
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${github.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log(`✅ Authenticated as: ${user.login}`);
      
      const scopes = response.headers.get('x-oauth-scopes');
      console.log(`🔐 Current scopes: ${scopes || 'None visible'}`);
      
      const acceptedScopes = response.headers.get('x-accepted-oauth-scopes');
      console.log(`📋 Accepted scopes for this endpoint: ${acceptedScopes || 'None'}`);
      
      console.log('\n📊 Required Scopes for Full Integration:');
      console.log('  ✅ repo (for issues) - Current status: ' + (scopes?.includes('repo') ? '✅ Present' : '❌ Missing'));
      console.log('  ❓ project (for projects) - Current status: ' + (scopes?.includes('project') ? '✅ Present' : '❌ Missing'));
      
      // Test project access with GraphQL
      await testProjectAccess(github);
      
      if (!scopes?.includes('project')) {
        console.log('\n💡 To add project permissions:');
        console.log('1. Go to https://github.com/settings/tokens');
        console.log('2. Edit your token');
        console.log('3. Check the "project" scope checkbox');
        console.log('4. Update and regenerate token');
        console.log('5. Update devlog.config.json with the new token');
        console.log('\n📋 Required Project Scopes:');
        console.log('  • project:read - Read project data');
        console.log('  • project:write - Create/update project items');
      }
      
    } else {
      console.log(`❌ Error checking token: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testProjectAccess(github) {
  console.log('\n🧪 Testing Project Access...');
  
  const query = `
    query($owner: String!, $number: Int!) {
      user(login: $owner) {
        projectV2(number: $number) {
          id
          title
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${github.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        variables: { 
          owner: github.owner, 
          number: github.projectNumber 
        } 
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ Project access test failed:');
      result.errors.forEach(error => {
        console.log(`  • ${error.message}`);
        if (error.type === 'FORBIDDEN') {
          console.log('    🔒 This indicates missing project permissions');
        }
      });
    } else if (result.data?.user?.projectV2) {
      const project = result.data.user.projectV2;
      console.log(`✅ Project access successful: "${project.title}" (${project.id})`);
    } else {
      console.log(`❌ Project #${github.projectNumber} not found for user ${github.owner}`);
    }
  } catch (error) {
    console.log(`❌ Project access test error: ${error.message}`);
  }
}

checkTokenScopes();
