/**
 * Integration tests for Phase 2 git storage functionality
 * Tests repository structure, file operations, and repository management
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DevlogContext, DevlogEntry } from '@devlog/types';
import { GitStorageProvider } from '../git-storage-provider.js';
import { RepositoryStructure } from '../../utils/repository-structure.js';
import { GitRepositoryManager } from '../../utils/git-repository-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Helper function to create empty context
const createEmptyContext = (): DevlogContext => ({
  businessContext: '',
  technicalContext: '',
  dependencies: [],
  decisions: [],
  acceptanceCriteria: [],
  risks: [],
});

// Helper function to create a test entry
const createTestEntry = (overrides: Partial<DevlogEntry> = {}): DevlogEntry => ({
  id: 1,
  key: 'test-key',
  title: 'Test Entry',
  type: 'task',
  status: 'todo',
  priority: 'medium',
  description: 'Test description',
  context: createEmptyContext(),
  notes: [],
  tags: [],
  files: [],
  relatedDevlogs: [],
  aiContext: {
    currentSummary: '',
    keyInsights: [],
    openQuestions: [],
    relatedPatterns: [],
    suggestedNextSteps: [],
    lastAIUpdate: new Date().toISOString(),
    contextVersion: 1,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('Phase 2 Git Storage Integration', () => {
  let tempDir: string;
  let repoPath: string;
  let gitConfig: any;
  let storage: GitStorageProvider;
  let repoStructure: RepositoryStructure;
  let repoManager: GitRepositoryManager;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devlog-phase2-test-'));
    repoPath = path.join(tempDir, 'test-repo');

    gitConfig = {
      repository: 'test/repo',
      branch: 'main',
      path: '.devlog/',
      autoSync: false, // Disable auto-sync for tests
      conflictResolution: 'timestamp-wins' as const,
    };

    // Initialize git repository manually (since we can't clone in tests)
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });

    repoStructure = new RepositoryStructure(repoPath, gitConfig);
    repoManager = new GitRepositoryManager(gitConfig);

    // Mock the repository path for testing
    storage = new GitStorageProvider(gitConfig);
    (storage as any).repositoryPath = repoPath;
    (storage as any).repoStructure = new RepositoryStructure(repoPath, gitConfig);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('Repository Structure', () => {
    it('should initialize complete .devlog directory structure', async () => {
      await repoStructure.initialize('test-workspace');

      // Check directory structure
      const devlogPath = path.join(repoPath, '.devlog');
      const entriesPath = path.join(devlogPath, 'entries');
      const metadataPath = path.join(devlogPath, 'metadata');
      const indexPath = path.join(devlogPath, 'index.json');
      const configPath = path.join(devlogPath, 'config.json');

      await expect(fs.access(devlogPath)).resolves.toBeUndefined();
      await expect(fs.access(entriesPath)).resolves.toBeUndefined();
      await expect(fs.access(metadataPath)).resolves.toBeUndefined();
      await expect(fs.access(indexPath)).resolves.toBeUndefined();
      await expect(fs.access(configPath)).resolves.toBeUndefined();

      // Check index.json content
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index).toMatchObject({
        version: '1.0',
        entries: {},
        nextId: 1,
        workspace: 'test-workspace',
      });

      // Check .gitignore
      const gitIgnorePath = path.join(repoPath, '.gitignore');
      await expect(fs.access(gitIgnorePath)).resolves.toBeUndefined();
      const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf-8');
      expect(gitIgnoreContent).toContain('*.db');
      expect(gitIgnoreContent).toContain('!.devlog/entries/');
    });

    it('should generate proper entry filenames with slugs', async () => {
      await repoStructure.initialize();

      const entry = createTestEntry({
        id: 1,
        title: 'Test Feature Implementation',
        type: 'feature',
        status: 'in-progress',
        priority: 'high',
      });

      const filename = repoStructure.generateEntryFilename(entry);
      expect(filename).toBe('001-test-feature-implementation.json');

      const entryPath = repoStructure.getEntryPath(entry);
      expect(entryPath).toContain('entries/001-test-feature-implementation.json');
    });

    it('should manage index properly', async () => {
      await repoStructure.initialize();

      const entry = createTestEntry({
        id: 1,
        title: 'Test Entry',
        type: 'task',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
      });

      await repoStructure.updateIndex(entry);

      const index = await repoStructure.readIndex();
      expect(index.entries[1]).toMatchObject({
        id: 1,
        title: 'Test Entry',
        type: 'task',
        status: 'todo',
        priority: 'medium',
        file: '001-test-entry.json',
        slug: 'test-entry',
      });
      expect(index.nextId).toBe(2);

      // Test removal
      await repoStructure.removeFromIndex(1);
      const updatedIndex = await repoStructure.readIndex();
      expect(updatedIndex.entries[1]).toBeUndefined();
    });

    it('should validate repository structure', async () => {
      // Test uninitialized repository
      let validation = await repoStructure.validate();
      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing .devlog directory structure');

      // Initialize and test valid repository
      await repoStructure.initialize();
      validation = await repoStructure.validate();
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('GitStorageProvider with Repository Structure', () => {
    beforeEach(async () => {
      // Initialize the repository structure
      await repoStructure.initialize('test-workspace');

      // Mock initialization for storage provider
      (storage as any).initialized = true;
    });

    it('should save entries as JSON files with proper structure', async () => {
      const entry = createTestEntry({
        id: 1,
        title: 'Test Feature',
        type: 'feature',
        status: 'in-progress',
        priority: 'high',
        description: 'Testing file-based storage',
        context: {
          businessContext: 'Test business context',
          technicalContext: 'Test technical context',
          dependencies: [],
          decisions: [],
          acceptanceCriteria: [],
          risks: [],
        },
        notes: [
          {
            id: 'note-1',
            timestamp: new Date().toISOString(),
            category: 'progress',
            content: 'Test note',
          },
        ],
        tags: ['test', 'storage'],
        files: ['test.ts'],
      });

      await storage.save(entry);

      // Check file was created
      const expectedPath = path.join(repoPath, '.devlog', 'entries', '001-test-feature.json');
      const fileContent = await fs.readFile(expectedPath, 'utf-8');
      const savedEntry = JSON.parse(fileContent);

      expect(savedEntry).toEqual(entry);

      // Check index was updated
      const indexPath = path.join(repoPath, '.devlog', 'index.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);

      expect(index.entries[1]).toMatchObject({
        id: 1,
        title: 'Test Feature',
        type: 'feature',
        status: 'in-progress',
        priority: 'high',
        file: '001-test-feature.json',
      });
    });

    it('should retrieve entries by ID', async () => {
      const entry = createTestEntry({
        id: 2,
        title: 'Another Test',
        type: 'bugfix',
        status: 'done',
        priority: 'low',
        description: 'Test retrieval',
      });

      await storage.save(entry);
      const retrieved = await storage.get(2);

      expect(retrieved).toEqual(entry);
    });

    it('should list all entries correctly', async () => {
      const entries = [
        createTestEntry({
          id: 1,
          title: 'First Entry',
          type: 'feature',
          status: 'todo',
          priority: 'high',
          description: 'First test entry',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }),
        createTestEntry({
          id: 2,
          title: 'Second Entry',
          type: 'bugfix',
          status: 'in-progress',
          priority: 'medium',
          description: 'Second test entry',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        }),
      ];

      for (const entry of entries) {
        await storage.save(entry);
      }

      const allEntries = await storage.list();
      expect(allEntries).toHaveLength(2);
      expect(allEntries[0].id).toBe(2); // Should be sorted by ID descending
      expect(allEntries[1].id).toBe(1);
    });

    it('should delete entries and update index', async () => {
      const entry = createTestEntry({
        id: 3,
        title: 'To Be Deleted',
        type: 'task',
        status: 'todo',
        priority: 'low',
        description: 'This will be deleted',
      });

      await storage.save(entry);

      // Verify entry exists
      expect(await storage.exists(3)).toBe(true);

      // Delete entry
      await storage.delete(3);

      // Verify entry is gone
      expect(await storage.exists(3)).toBe(false);

      // Verify file is deleted
      const entryPath = path.join(repoPath, '.devlog', 'entries', '003-to-be-deleted.json');
      await expect(fs.access(entryPath)).rejects.toThrow();

      // Verify index is updated
      const indexPath = path.join(repoPath, '.devlog', 'index.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.entries[3]).toBeUndefined();
    });
  });

  describe('Repository Discovery and Management', () => {
    it('should validate repository structure', async () => {
      // Test invalid repository
      let validation = await repoManager.validateRepository(repoPath);
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);

      // Initialize structure
      await repoStructure.initialize();

      // Test valid repository
      validation = await repoManager.validateRepository(repoPath);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect repository information', async () => {
      await repoStructure.initialize('test-workspace');

      const repoInfo = await repoManager.getRepositoryInfo(repoPath);
      expect(repoInfo).toMatchObject({
        name: 'test-repo',
        path: repoPath,
        isDevlogRepo: true,
        workspaceName: 'test-workspace',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing entries gracefully', async () => {
      await repoStructure.initialize();
      (storage as any).initialized = true;

      const entry = await storage.get(999);
      expect(entry).toBeNull();

      expect(await storage.exists(999)).toBe(false);
    });

    it('should handle corrupted index files', async () => {
      await repoStructure.initialize();

      // Corrupt the index file
      const indexPath = path.join(repoPath, '.devlog', 'index.json');
      await fs.writeFile(indexPath, 'invalid json');

      // Should handle gracefully
      await expect(repoStructure.readIndex()).rejects.toThrow('Index file not found or corrupted');
    });
  });
});
