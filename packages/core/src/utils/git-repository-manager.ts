/**
 * Git repository manager for devlog initialization and discovery
 * Handles repository setup, discovery, and validation workflows
 */

import { GitStorageConfig } from '@devlog/types';
import { GitOperations } from './git-operations.js';
import { RepositoryStructure } from './repository-structure.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface RepositoryInfo {
  name: string;
  url: string;
  path: string;
  branch: string;
  isDevlogRepo: boolean;
  lastModified?: string;
  workspaceName?: string;
}

export interface RepositoryDiscoveryOptions {
  searchPaths?: string[];
  includeRemotes?: boolean;
  platforms?: ('github' | 'gitlab' | 'generic')[];
}

export class GitRepositoryManager {
  private config: GitStorageConfig;
  private basePath: string;

  constructor(config: GitStorageConfig) {
    this.config = config;
    this.basePath = path.join(os.homedir(), '.devlog', 'repos');
  }

  /**
   * Initialize a new devlog repository
   */
  async initializeRepository(workspaceName?: string): Promise<RepositoryInfo> {
    const repoName = this.extractRepoName(this.config.repository);
    const repoPath = path.join(this.basePath, repoName);

    try {
      // Create base directory
      await fs.mkdir(this.basePath, { recursive: true });

      // Check if repository already exists locally
      const repoExists = await this.repositoryExists(repoPath);

      if (!repoExists) {
        // Clone the repository
        const gitOps = new GitOperations(repoPath, this.config);
        await gitOps.clone(this.config.repository, this.config.branch);
      }

      // Initialize devlog structure
      const repoStructure = new RepositoryStructure(repoPath, this.config);
      await repoStructure.initialize(workspaceName);

      // Commit initial structure if it's a new setup
      if (!repoExists) {
        const gitOps = new GitOperations(repoPath, this.config);
        await gitOps.push(
          `Initialize devlog structure for workspace: ${workspaceName || 'default'}`,
        );
      }

      return {
        name: repoName,
        url: this.config.repository,
        path: repoPath,
        branch: this.config.branch || 'main',
        isDevlogRepo: true,
        workspaceName,
      };
    } catch (error) {
      throw new Error(`Failed to initialize repository: ${error}`);
    }
  }

  /**
   * Create a new repository on the remote platform (GitHub, GitLab, etc.)
   */
  async createRemoteRepository(
    repoName: string,
    options?: {
      description?: string;
      private?: boolean;
      platform?: 'github' | 'gitlab';
    },
  ): Promise<string> {
    // This would integrate with GitHub/GitLab APIs to create repositories
    // For now, we'll return a placeholder implementation
    const platform = options?.platform || 'github';

    switch (platform) {
      case 'github':
        return this.createGitHubRepository(repoName, options);
      case 'gitlab':
        return this.createGitLabRepository(repoName, options);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Discover existing devlog repositories
   */
  async discoverRepositories(options?: RepositoryDiscoveryOptions): Promise<RepositoryInfo[]> {
    const discovered: RepositoryInfo[] = [];

    // Search local repositories
    const localRepos = await this.discoverLocalRepositories();
    discovered.push(...localRepos);

    // Search remote repositories if requested
    if (options?.includeRemotes) {
      // This would integrate with platform APIs to discover remote repositories
      // Implementation would depend on authentication and API access
      console.log('Remote repository discovery not yet implemented');
    }

    return discovered;
  }

  /**
   * Validate that a repository is properly set up for devlog usage
   */
  async validateRepository(repoPath: string): Promise<{
    valid: boolean;
    issues: string[];
    canFix: boolean;
  }> {
    const issues: string[] = [];
    let canFix = true;

    try {
      // Check if it's a git repository
      await fs.access(path.join(repoPath, '.git'));
    } catch {
      issues.push('Not a git repository');
      canFix = false;
    }

    // Check devlog structure
    const repoStructure = new RepositoryStructure(repoPath, this.config);
    const structureValidation = await repoStructure.validate();

    if (!structureValidation.valid) {
      issues.push(...structureValidation.issues);
    }

    return {
      valid: issues.length === 0,
      issues,
      canFix,
    };
  }

  /**
   * Fix common repository issues
   */
  async fixRepository(repoPath: string): Promise<void> {
    const repoStructure = new RepositoryStructure(repoPath, this.config);

    // Reinitialize structure
    await repoStructure.initialize();

    // Commit fixes
    const gitOps = new GitOperations(repoPath, this.config);
    try {
      await gitOps.push('Fix devlog repository structure');
    } catch (error) {
      console.warn('Could not commit fixes:', error);
    }
  }

  /**
   * Clone an existing devlog repository to a new workspace
   */
  async cloneRepository(repositoryUrl: string, workspaceName?: string): Promise<RepositoryInfo> {
    const repoName = this.extractRepoName(repositoryUrl);
    const localName = workspaceName ? `${repoName}-${workspaceName}` : repoName;
    const repoPath = path.join(this.basePath, localName);

    try {
      // Clone repository
      const cloneConfig = { ...this.config, repository: repositoryUrl };
      const gitOps = new GitOperations(repoPath, cloneConfig);
      await gitOps.clone(repositoryUrl, this.config.branch);

      // Validate structure
      const validation = await this.validateRepository(repoPath);
      if (!validation.valid && validation.canFix) {
        await this.fixRepository(repoPath);
      }

      return {
        name: localName,
        url: repositoryUrl,
        path: repoPath,
        branch: this.config.branch || 'main',
        isDevlogRepo: true,
        workspaceName,
      };
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(repoPath: string): Promise<RepositoryInfo | null> {
    try {
      const gitOps = new GitOperations(repoPath, this.config);
      const repoStructure = new RepositoryStructure(repoPath, this.config);

      // Check if it's a devlog repository
      const isInitialized = await repoStructure.isInitialized();
      if (!isInitialized) {
        return null;
      }

      // Get repository name from path
      const repoName = path.basename(repoPath);

      // Try to get workspace name from index
      let workspaceName: string | undefined;
      try {
        const index = await repoStructure.readIndex();
        workspaceName = index.workspace;
      } catch {
        // Ignore if can't read index
      }

      return {
        name: repoName,
        url: this.config.repository,
        path: repoPath,
        branch: this.config.branch || 'main',
        isDevlogRepo: true,
        workspaceName,
      };
    } catch {
      return null;
    }
  }

  // Private helper methods

  private async repositoryExists(repoPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(repoPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  private extractRepoName(repositoryUrl: string): string {
    // Extract repository name from URL
    const parts = repositoryUrl.split('/');
    let repoName = parts[parts.length - 1];

    // Remove .git suffix if present
    if (repoName.endsWith('.git')) {
      repoName = repoName.slice(0, -4);
    }

    return repoName;
  }

  private async discoverLocalRepositories(): Promise<RepositoryInfo[]> {
    const repositories: RepositoryInfo[] = [];

    try {
      const repoDirectories = await fs.readdir(this.basePath);

      for (const dirName of repoDirectories) {
        const repoPath = path.join(this.basePath, dirName);
        const repoInfo = await this.getRepositoryInfo(repoPath);

        if (repoInfo) {
          repositories.push(repoInfo);
        }
      }
    } catch {
      // Base path doesn't exist yet
    }

    return repositories;
  }

  private async createGitHubRepository(
    repoName: string,
    options?: {
      description?: string;
      private?: boolean;
    },
  ): Promise<string> {
    // Placeholder for GitHub API integration
    // This would use the GitHub REST API to create a repository
    // Requires GitHub token authentication

    throw new Error(
      'GitHub repository creation not yet implemented. Please create the repository manually on GitHub.',
    );
  }

  private async createGitLabRepository(
    repoName: string,
    options?: {
      description?: string;
      private?: boolean;
    },
  ): Promise<string> {
    // Placeholder for GitLab API integration
    // This would use the GitLab REST API to create a repository
    // Requires GitLab token authentication

    throw new Error(
      'GitLab repository creation not yet implemented. Please create the repository manually on GitLab.',
    );
  }
}
