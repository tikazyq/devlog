/**
 * Tests for StorageProviderFactory with new git storage support
 */

import { describe, expect, it, vi } from 'vitest';
import { StorageProviderFactory } from '../storage-provider.js';
import { StorageConfig } from '@devlog/types';

// Mock the storage providers
vi.mock('../sqlite-storage.js', () => ({
  SQLiteStorageProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    isGitBased: () => false,
    isRemoteStorage: () => false,
  })),
}));

vi.mock('../git-storage-provider.js', () => ({
  GitStorageProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    isGitBased: () => true,
    isRemoteStorage: () => true,
  })),
}));

vi.mock('../hybrid-storage-provider.js', () => ({
  HybridStorageProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    isGitBased: () => true,
    isRemoteStorage: () => true,
  })),
}));

describe('StorageProviderFactory', () => {
  describe('new storage strategies', () => {
    it('should create local-sqlite storage provider', async () => {
      const config: StorageConfig = {
        strategy: 'local-sqlite',
        sqlite: {
          filePath: '/tmp/test.db',
        },
      };

      const provider = await StorageProviderFactory.create(config);
      expect(provider.isGitBased()).toBe(false);
      expect(provider.isRemoteStorage()).toBe(false);
    });

    it('should create git-json storage provider', async () => {
      const config: StorageConfig = {
        strategy: 'git-json',
        git: {
          repository: 'test/repo',
          branch: 'main',
        },
      };

      const provider = await StorageProviderFactory.create(config);
      expect(provider.isGitBased()).toBe(true);
      expect(provider.isRemoteStorage()).toBe(true);
    });

    it('should create hybrid-git storage provider', async () => {
      const config: StorageConfig = {
        strategy: 'hybrid-git',
        git: {
          repository: 'test/repo',
          branch: 'main',
        },
        cache: {
          type: 'sqlite',
          filePath: '/tmp/cache.db',
        },
      };

      const provider = await StorageProviderFactory.create(config);
      expect(provider.isGitBased()).toBe(true);
      expect(provider.isRemoteStorage()).toBe(true);
    });
  });

  describe('legacy storage configurations', () => {
    it('should handle legacy sqlite configuration', async () => {
      const config: StorageConfig = {
        type: 'sqlite',
        filePath: '/tmp/legacy.db',
        strategy: 'local-sqlite',
      };

      const provider = await StorageProviderFactory.create(config);
      expect(provider.isGitBased()).toBe(false);
    });

    it('should throw error for unsupported legacy types', async () => {
      const config: StorageConfig = {
        type: 'unsupported' as any,
        strategy: 'local-sqlite',
      };

      await expect(StorageProviderFactory.create(config)).rejects.toThrow(
        'Unsupported storage type',
      );
    });

    it('should throw error for unsupported strategies', async () => {
      const config: StorageConfig = {
        strategy: 'unsupported' as any,
      };

      await expect(StorageProviderFactory.create(config)).rejects.toThrow(
        'Unsupported storage strategy',
      );
    });

    it('should throw error for git-json without git config', async () => {
      const config: StorageConfig = {
        strategy: 'git-json',
        // Missing git configuration
      };

      await expect(StorageProviderFactory.create(config)).rejects.toThrow();
    });

    it('should throw error for hybrid-git without cache config', async () => {
      const config: StorageConfig = {
        strategy: 'hybrid-git',
        git: {
          repository: 'test/repo',
        },
        // Missing cache configuration
      };

      await expect(StorageProviderFactory.create(config)).rejects.toThrow();
    });
  });
});
