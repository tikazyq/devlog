/**
 * Tests for GitStorageProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitStorageProvider } from '../git-storage-provider.js';
import { DevlogEntry } from '@devlog/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock child_process spawn
vi.mock('child_process');

describe('GitStorageProvider', () => {
  let provider: GitStorageProvider;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devlog-test-'));
    
    // Mock git operations
    vi.doMock('../utils/git-operations.js', () => ({
      GitOperations: vi.fn().mockImplementation(() => ({
        clone: vi.fn().mockResolvedValue(undefined),
        pull: vi.fn().mockResolvedValue(undefined),
        push: vi.fn().mockResolvedValue(undefined),
        getStatus: vi.fn().mockResolvedValue({ status: 'synced' })
      }))
    }));

    // Mock conflict resolver
    vi.doMock('../utils/conflict-resolver.js', () => ({
      ConflictResolver: vi.fn().mockImplementation(() => ({
        resolveConflicts: vi.fn().mockResolvedValue(undefined)
      }))
    }));

    provider = new GitStorageProvider({
      repository: 'test/repo',
      branch: 'main',
      path: '.devlog/',
      autoSync: false // Disable auto-sync for testing
    });
  });

  afterEach(async () => {
    await provider.dispose();
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be git-based storage', () => {
      expect(provider.isGitBased()).toBe(true);
    });

    it('should be remote storage', () => {
      expect(provider.isRemoteStorage()).toBe(true);
    });
  });

  describe('entry management', () => {
    const mockEntry: DevlogEntry = {
      id: 1,
      key: 'test-entry',
      title: 'Test Entry',
      type: 'feature',
      description: 'A test entry',
      status: 'todo',
      priority: 'medium',
      createdAt: '2025-06-25T10:00:00Z',
      updatedAt: '2025-06-25T10:00:00Z',
      tags: ['test'],
      notes: [],
      files: [],
      relatedDevlogs: [],
      context: {
        businessContext: 'Test context',
        technicalContext: 'Test technical context',
        dependencies: [],
        decisions: [],
        acceptanceCriteria: [],
        risks: []
      },
      aiContext: {
        currentSummary: 'Test summary',
        keyInsights: [],
        openQuestions: [],
        relatedPatterns: [],
        suggestedNextSteps: [],
        lastAIUpdate: '2025-06-25T10:00:00Z',
        contextVersion: 1
      }
    };

    it('should save and retrieve entries', async () => {
      // Mock file system operations
      const mockWriteFile = vi.spyOn(fs, 'writeFile').mockResolvedValue();
      const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockEntry));
      const mockAccess = vi.spyOn(fs, 'access').mockResolvedValue();

      await provider.save(mockEntry);
      const retrieved = await provider.get(1);

      expect(mockWriteFile).toHaveBeenCalled();
      expect(retrieved).toEqual(mockEntry);
    });

    it('should check if entries exist', async () => {
      // Mock file exists
      const mockAccess = vi.spyOn(fs, 'access').mockResolvedValue();
      
      const exists = await provider.exists(1);
      expect(exists).toBe(true);
    });

    it('should handle non-existent entries', async () => {
      // Mock file doesn't exist
      const mockAccess = vi.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
      
      const exists = await provider.exists(999);
      const entry = await provider.get(999);
      
      expect(exists).toBe(false);
      expect(entry).toBeNull();
    });

    it('should list entries with filtering', async () => {
      // Mock directory reading
      const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue(['001-entry.json'] as any);
      const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockEntry));

      const entries = await provider.list({ status: ['todo'] });
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(mockEntry);
    });

    it('should search entries by text', async () => {
      // Mock directory reading and file content
      const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue(['001-entry.json'] as any);
      const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockEntry));

      const results = await provider.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Entry');
    });

    it('should delete entries', async () => {
      const mockUnlink = vi.spyOn(fs, 'unlink').mockResolvedValue();
      const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({ entries: {}, nextId: 1 }));
      const mockWriteFile = vi.spyOn(fs, 'writeFile').mockResolvedValue();

      await provider.delete(1);
      expect(mockUnlink).toHaveBeenCalled();
    });
  });

  describe('git operations', () => {
    it('should support clone operation', async () => {
      await expect(provider.clone('test/repo', 'main')).resolves.not.toThrow();
    });

    it('should support pull operation', async () => {
      await expect(provider.pull()).resolves.not.toThrow();
    });

    it('should support push operation', async () => {
      await expect(provider.push('Test commit')).resolves.not.toThrow();
    });

    it('should get remote status', async () => {
      const status = await provider.getRemoteStatus();
      expect(status).toHaveProperty('status');
    });

    it('should resolve conflicts', async () => {
      await expect(provider.resolveConflicts('timestamp-wins')).resolves.not.toThrow();
    });
  });

  describe('statistics', () => {
    it('should generate stats from entries', async () => {
      // Mock directory reading and file content
      const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue(['001-entry.json'] as any);
      const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockEntry));

      const stats = await provider.getStats();
      
      expect(stats.totalEntries).toBe(1);
      expect(stats.byStatus.todo).toBe(1);
      expect(stats.byType.feature).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
    });
  });
});
