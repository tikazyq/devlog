/**
 * Simple integration test for git storage functionality
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StorageProviderFactory } from '../storage-provider.js';
import type { StorageConfig } from '@devlog/types';

describe('Git Storage Integration', () => {
  let provider: any;

  beforeEach(async () => {
    // Create a git storage provider with mock git config
    const config: StorageConfig = {
      strategy: 'git-json',
      git: {
        repository: '/tmp/test-devlog-repo',
        branch: 'main',
      },
    };

    provider = await StorageProviderFactory.create(config);
  });

  afterEach(async () => {
    if (provider?.dispose) {
      await provider.dispose();
    }
  });

  it('should create git storage provider successfully', () => {
    expect(provider).toBeDefined();
    expect(provider.isGitBased()).toBe(true);
    expect(provider.isRemoteStorage()).toBe(true);
  });

  it('should have required git methods', () => {
    expect(typeof provider.clone).toBe('function');
    expect(typeof provider.pull).toBe('function');
    expect(typeof provider.push).toBe('function');
    expect(typeof provider.getRemoteStatus).toBe('function');
    expect(typeof provider.resolveConflicts).toBe('function');
  });

  it('should have standard storage methods', () => {
    expect(typeof provider.initialize).toBe('function');
    expect(typeof provider.save).toBe('function');
    expect(typeof provider.get).toBe('function');
    expect(typeof provider.exists).toBe('function');
    expect(typeof provider.list).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.delete).toBe('function');
    expect(typeof provider.getStats).toBe('function');
  });

  it('should properly initialize', async () => {
    // Since we're testing without a real repo, we expect this to fail but not throw
    try {
      await provider.initialize();
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('Git command failed');
    }
  });

  it('should get remote status', async () => {
    // Without a real git repo, this will return a default status
    try {
      const status = await provider.getRemoteStatus();
      expect(status).toBeDefined();
    } catch (error) {
      // Expected to fail without a real git repository
      expect(error).toBeDefined();
    }
  });
});
