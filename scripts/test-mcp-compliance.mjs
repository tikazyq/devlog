#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

/**
 * Test MCP protocol compliance for the devlog MCP server
 */
class MCPComplianceTest {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.server = null;
  }

  log(message) {
    console.log(`[MCP-Test] ${message}`);
  }

  error(message) {
    console.error(`[MCP-Test ERROR] ${message}`);
  }

  async startServer() {
    this.log('Starting MCP server...');
    this.server = spawn('node', ['packages/mcp-server/build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let serverOutput = '';
    this.server.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });

    this.server.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (!stderr.includes('Loaded integrations config') && !stderr.includes('No integrations config found')) {
        this.error(`Server stderr: ${stderr}`);
      }
    });

    // Give server time to start
    await setTimeout(1000);
    
    if (this.server.exitCode !== null) {
      throw new Error(`Server exited with code ${this.server.exitCode}`);
    }

    this.log('Server started successfully');
    return serverOutput;
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      let response = '';
      let responseReceived = false;

      const timeout = setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('Request timeout'));
        }
      }, 5000);

      const onData = (data) => {
        response += data.toString();
        // Check if we have a complete JSON response
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === request.id) {
              responseReceived = true;
              clearTimeout(timeout);
              this.server.stdout.removeListener('data', onData);
              resolve(parsed);
              return;
            }
          }
        } catch (e) {
          // Continue collecting data
        }
      };

      this.server.stdout.on('data', onData);
      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testInitialize() {
    this.log('Testing initialize...');
    
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" }
      }
    };

    try {
      const response = await this.sendRequest(request);
      
      if (response.error) {
        throw new Error(`Initialize failed: ${response.error.message}`);
      }

      if (!response.result || !response.result.capabilities) {
        throw new Error('Initialize response missing capabilities');
      }

      this.log('✅ Initialize test passed');
      this.testsPassed++;
      return response.result;
    } catch (error) {
      this.error(`❌ Initialize test failed: ${error.message}`);
      this.testsFailed++;
      throw error;
    }
  }

  async testListTools() {
    this.log('Testing tools/list...');
    
    const request = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    };

    try {
      const response = await this.sendRequest(request);
      
      if (response.error) {
        throw new Error(`tools/list failed: ${response.error.message}`);
      }

      if (!response.result || !Array.isArray(response.result.tools)) {
        throw new Error('tools/list response missing tools array');
      }

      const tools = response.result.tools;
      const expectedTools = [
        'create_devlog',
        'find_or_create_devlog',
        'update_devlog',
        'get_devlog',
        'list_devlogs',
        'add_note',
        'get_active_context'
      ];

      for (const expectedTool of expectedTools) {
        if (!tools.find(tool => tool.name === expectedTool)) {
          throw new Error(`Expected tool '${expectedTool}' not found`);
        }
      }

      this.log(`✅ tools/list test passed (${tools.length} tools found)`);
      this.testsPassed++;
      return tools;
    } catch (error) {
      this.error(`❌ tools/list test failed: ${error.message}`);
      this.testsFailed++;
      throw error;
    }
  }

  async testCreateDevlog() {
    this.log('Testing create_devlog tool...');
    
    const request = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "create_devlog",
        arguments: {
          title: "Test CI Feature",
          type: "feature",
          description: "Testing devlog creation from CI",
          priority: "medium"
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      
      if (response.error) {
        throw new Error(`create_devlog failed: ${response.error.message}`);
      }

      if (!response.result || !response.result.content) {
        throw new Error('create_devlog response missing content');
      }

      const content = response.result.content[0];
      if (!content.text || !content.text.includes('Created devlog entry:')) {
        throw new Error('create_devlog response does not contain expected success message');
      }

      this.log('✅ create_devlog test passed');
      this.testsPassed++;
      return response.result;
    } catch (error) {
      this.error(`❌ create_devlog test failed: ${error.message}`);
      this.testsFailed++;
      throw error;
    }
  }

  async testListDevlogs() {
    this.log('Testing list_devlogs tool...');
    
    const request = {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "list_devlogs",
        arguments: {}
      }
    };

    try {
      const response = await this.sendRequest(request);
      
      if (response.error) {
        throw new Error(`list_devlogs failed: ${response.error.message}`);
      }

      if (!response.result || !response.result.content) {
        throw new Error('list_devlogs response missing content');
      }

      const content = response.result.content[0];
      if (!content.text || !content.text.includes('devlog')) {
        throw new Error('list_devlogs response does not contain expected devlog information');
      }

      this.log('✅ list_devlogs test passed');
      this.testsPassed++;
      return response.result;
    } catch (error) {
      this.error(`❌ list_devlogs test failed: ${error.message}`);
      this.testsFailed++;
      throw error;
    }
  }

  async cleanup() {
    if (this.server && this.server.exitCode === null) {
      this.log('Shutting down server...');
      this.server.kill('SIGTERM');
      
      // Give it time to shutdown gracefully
      await setTimeout(1000);
      
      if (this.server.exitCode === null) {
        this.server.kill('SIGKILL');
      }
    }
  }

  async run() {
    try {
      await this.startServer();
      
      // Run compliance tests
      await this.testInitialize();
      await this.testListTools();
      await this.testCreateDevlog();
      await this.testListDevlogs();
      
      this.log(`\n🎉 All tests completed!`);
      this.log(`✅ Passed: ${this.testsPassed}`);
      this.log(`❌ Failed: ${this.testsFailed}`);
      
      if (this.testsFailed > 0) {
        process.exit(1);
      } else {
        this.log('🎉 All MCP compliance tests passed!');
        process.exit(0);
      }
      
    } catch (error) {
      this.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new MCPComplianceTest();
tester.run().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
