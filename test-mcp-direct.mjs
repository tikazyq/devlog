#!/usr/bin/env node

/**
 * Test script to verify MCP functionality works correctly
 */

import { MCPDevlogAdapter } from './packages/mcp-server/build/mcp-adapter.js';

async function testMCPFunctionality() {
  console.log('Testing MCP functionality...');
  
  const adapter = new MCPDevlogAdapter(process.cwd());
  
  try {
    console.log('Creating test devlog entry...');
    const result = await adapter.findOrCreateDevlog({
      title: 'Test MCP Server Functionality',
      type: 'task',
      description: 'Testing the MCP server to ensure it can create and manage devlog entries after the cleanup and build process',
      priority: 'medium'
    });
    
    console.log('Success!');
    console.log(result);
    
    console.log('\nListing active devlogs...');
    const activeResult = await adapter.getActiveContext();
    console.log(activeResult);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await adapter.dispose();
  }
}

testMCPFunctionality().catch(console.error);
