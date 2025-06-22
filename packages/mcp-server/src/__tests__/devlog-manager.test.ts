import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevlogManager } from '../devlog-manager.js';
import fs from 'fs/promises';
import path from 'path';

describe('DevlogManager', () => {
  let manager: DevlogManager;
  let testWorkspace: string;

  beforeEach(async () => {
    // Create a temporary test workspace
    testWorkspace = path.join(process.cwd(), 'test-workspace-' + Date.now());
    manager = new DevlogManager(testWorkspace);
  });

  afterEach(async () => {
    // Clean up test workspace
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createDevlog', () => {
    it('should create a new devlog entry', async () => {
      const result = await manager.createDevlog({
        title: 'Test Feature',
        type: 'feature',
        description: 'This is a test feature',
        priority: 'medium'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Created devlog entry:');
      expect(result.content[0].text).toContain('Test Feature');
    });

    it('should create devlog with custom ID', async () => {
      const customId = 'custom-test-id';
      const result = await manager.createDevlog({
        id: customId,
        title: 'Custom ID Test',
        type: 'task',
        description: 'Testing custom ID'
      });

      expect(result.content[0].text).toContain(customId);
    });

    it('should assign default priority if not provided', async () => {
      const result = await manager.createDevlog({
        title: 'No Priority Test',
        type: 'bugfix',
        description: 'Testing default priority'
      });

      expect(result.content[0].text).toContain('Priority: medium');
    });
  });

  describe('updateDevlog', () => {
    let devlogId: string;

    beforeEach(async () => {
      const createResult = await manager.createDevlog({
        title: 'Update Test',
        type: 'feature',
        description: 'Testing updates'
      });
      
      const idMatch = createResult.content[0].text.match(/Created devlog entry: (.+)/);
      devlogId = idMatch ? idMatch[1].split('\n')[0] : '';
      expect(devlogId).toBeTruthy();
    });

    it('should update devlog status', async () => {
      const result = await manager.updateDevlog({
        id: devlogId,
        status: 'in-progress'
      });

      expect(result.content[0].text).toContain('Updated devlog');
      expect(result.content[0].text).toContain('Status: in-progress');
    });

    it('should add progress note when updating', async () => {
      const result = await manager.updateDevlog({
        id: devlogId,
        status: 'in-progress',
        progress: 'Started implementation'
      });

      expect(result.content[0].text).toContain('Updated devlog entry');
    });

    it('should handle non-existent devlog', async () => {
      await expect(
        manager.updateDevlog({
          id: 'non-existent-id',
          status: 'done'
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('getDevlog', () => {
    let devlogId: string;

    beforeEach(async () => {
      const createResult = await manager.createDevlog({
        title: 'Get Test',
        type: 'task',
        description: 'Testing get functionality'
      });
      
      const idMatch = createResult.content[0].text.match(/Created devlog entry: (.+)/);
      devlogId = idMatch ? idMatch[1].split('\n')[0] : '';
    });

    it('should retrieve existing devlog', async () => {
      const result = await manager.getDevlog(devlogId);

      expect(result.content[0].text).toContain('Get Test');
      expect(result.content[0].text).toContain('Type: task');
      expect(result.content[0].text).toContain('Status: todo');
    });

    it('should handle non-existent devlog', async () => {
      await expect(
        manager.getDevlog('non-existent-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('listDevlogs', () => {
    beforeEach(async () => {
      // Create multiple devlogs for testing
      await manager.createDevlog({
        title: 'Feature 1',
        type: 'feature',
        description: 'First feature'
      });
      
      await manager.createDevlog({
        title: 'Bug Fix 1',
        type: 'bugfix',
        description: 'First bug fix',
        priority: 'high'
      });
    });

    it('should list all devlogs', async () => {
      const result = await manager.listDevlogs();
      
      expect(result.content[0].text).toContain('Feature 1');
      expect(result.content[0].text).toContain('Bug Fix 1');
      expect(result.content[0].text).toContain('Found 2 devlog entries');
    });

    it('should filter by status', async () => {
      // Update one devlog to in-progress
      const listResult = await manager.listDevlogs();
      const firstId = listResult.content[0].text.match(/ID: ([^\n]+)/)?.[1];
      
      if (firstId) {
        await manager.updateDevlog({
          id: firstId,
          status: 'in-progress'
        });

        const filteredResult = await manager.listDevlogs({ status: ['in-progress'] });
        expect(filteredResult.content[0].text).toContain('Found 1 devlog entries');
        expect(filteredResult.content[0].text).toContain('in-progress');
      }
    });

    it('should filter by type', async () => {
      const result = await manager.listDevlogs({ type: ['feature'] });
      
      expect(result.content[0].text).toContain('Feature 1');
      expect(result.content[0].text).not.toContain('Bug Fix 1');
    });
  });

  describe('searchDevlogs', () => {
    beforeEach(async () => {
      await manager.createDevlog({
        title: 'Authentication System',
        type: 'feature',
        description: 'Implement JWT authentication'
      });
      
      await manager.createDevlog({
        title: 'Login Bug',
        type: 'bugfix',
        description: 'Fix login form validation'
      });
    });

    it('should search by title keywords', async () => {
      const result = await manager.searchDevlogs('authentication');

      expect(result.content[0].text).toContain('Authentication System');
      expect(result.content[0].text).not.toContain('Login Bug');
    });

    it('should search by description keywords', async () => {
      const result = await manager.searchDevlogs('validation');

      expect(result.content[0].text).toContain('Login Bug');
      expect(result.content[0].text).not.toContain('Authentication System');
    });

    it('should handle case-insensitive search', async () => {
      const result = await manager.searchDevlogs('AUTHENTICATION');

      expect(result.content[0].text).toContain('Authentication System');
    });
  });

  describe('getActiveContext', () => {
    beforeEach(async () => {
      // Create devlogs with different statuses
      await manager.createDevlog({
        title: 'Active Feature',
        type: 'feature',
        description: 'Currently working on this'
      });

      const createResult = await manager.createDevlog({
        title: 'In Progress Task',
        type: 'task',
        description: 'Task in progress'
      });

      // Set one to in-progress
      const idMatch = createResult.content[0].text.match(/Created devlog entry: (.+)/);
      const devlogId = idMatch ? idMatch[1].split('\n')[0] : '';
      
      if (devlogId) {
        await manager.updateDevlog({
          id: devlogId,
          status: 'in-progress'
        });
      }
    });

    it('should return active devlogs', async () => {
      const result = await manager.getActiveContext();

      expect(result.content[0].text).toContain('Active Development Context');
      expect(result.content[0].text).toContain('In Progress Task');
    });

    it('should limit results', async () => {
      const result = await manager.getActiveContext(1);

      const lines = result.content[0].text.split('\n').filter((line: string) => line.includes('ID:'));
      expect(lines.length).toBeLessThanOrEqual(1);
    });
  });

  describe('addNote', () => {
    let devlogId: string;

    beforeEach(async () => {
      const createResult = await manager.createDevlog({
        title: 'Note Test',
        type: 'feature',
        description: 'Testing note functionality'
      });
      
      const idMatch = createResult.content[0].text.match(/Created devlog entry: (.+)/);
      devlogId = idMatch ? idMatch[1].split('\n')[0] : '';
    });

    it('should add note to existing devlog', async () => {
      const result = await manager.addNote({
        id: devlogId,
        note: 'This is a test note',
        category: 'progress'
      });

      expect(result.content[0].text).toContain('Added note to devlog');
      expect(result.content[0].text).toContain('This is a test note');
    });

    it('should add note with files', async () => {
      const result = await manager.addNote({
        id: devlogId,
        note: 'Updated configuration',
        category: 'progress',
        files: ['config/app.json', 'src/config.ts']
      });

      expect(result.content[0].text).toContain('Files: config/app.json, src/config.ts');
    });

    it('should handle different note categories', async () => {
      const categories = ['progress', 'issue', 'solution', 'idea', 'reminder'] as const;

      for (const category of categories) {
        const result = await manager.addNote({
          id: devlogId,
          note: `Test ${category} note`,
          category
        });

        expect(result.content[0].text).toContain(`Test ${category} note`);
      }
    });
  });
});
