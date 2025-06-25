/**
 * Git operations wrapper for devlog storage
 * Handles git commands for cloning, pulling, pushing, and status checking
 */

import { GitStorageConfig, GitSyncStatus } from "@devlog/types";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";

export class GitOperations {
  private repositoryPath: string;
  private config: GitStorageConfig;

  constructor(repositoryPath: string, config: GitStorageConfig) {
    this.repositoryPath = repositoryPath;
    this.config = config;
  }

  async clone(repository: string, branch?: string): Promise<void> {
    const targetBranch = branch || this.config.branch || "main";
    
    try {
      // Ensure parent directory exists
      const parentDir = path.dirname(this.repositoryPath);
      await fs.mkdir(parentDir, { recursive: true });
      
      // Clone the repository
      await this.executeGitCommand([
        "clone",
        "--branch", targetBranch,
        "--single-branch",
        repository,
        this.repositoryPath
      ], path.dirname(this.repositoryPath));
      
      // Configure git user if credentials are provided
      if (this.config.credentials?.username) {
        await this.executeGitCommand([
          "config", "user.name", this.config.credentials.username
        ], this.repositoryPath);
      }
      
      console.log(`Successfully cloned ${repository} to ${this.repositoryPath}`);
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  async pull(): Promise<void> {
    try {
      await this.executeGitCommand(["pull", "origin", this.config.branch || "main"], this.repositoryPath);
      console.log("Successfully pulled latest changes");
    } catch (error) {
      throw new Error(`Failed to pull changes: ${error}`);
    }
  }

  async push(message: string): Promise<void> {
    try {
      // Add all changes
      await this.executeGitCommand(["add", "."], this.repositoryPath);
      
      // Check if there are changes to commit
      const status = await this.executeGitCommand(["status", "--porcelain"], this.repositoryPath);
      if (!status.trim()) {
        console.log("No changes to commit");
        return;
      }
      
      // Commit changes
      await this.executeGitCommand(["commit", "-m", message], this.repositoryPath);
      
      // Push to remote
      await this.executeGitCommand(["push", "origin", this.config.branch || "main"], this.repositoryPath);
      
      console.log(`Successfully pushed changes: ${message}`);
    } catch (error) {
      throw new Error(`Failed to push changes: ${error}`);
    }
  }

  async getStatus(): Promise<GitSyncStatus> {
    try {
      // Fetch latest info from remote
      await this.executeGitCommand(["fetch", "origin"], this.repositoryPath);
      
      // Get local and remote commit counts
      const branch = this.config.branch || "main";
      const ahead = await this.executeGitCommand([
        "rev-list", "--count", `origin/${branch}..HEAD`
      ], this.repositoryPath);
      
      const behind = await this.executeGitCommand([
        "rev-list", "--count", `HEAD..origin/${branch}`
      ], this.repositoryPath);
      
      const localCommits = parseInt(ahead.trim());
      const remoteCommits = parseInt(behind.trim());
      
      let status: GitSyncStatus['status'];
      if (localCommits > 0 && remoteCommits > 0) {
        status = 'diverged';
      } else if (localCommits > 0) {
        status = 'ahead';
      } else if (remoteCommits > 0) {
        status = 'behind';
      } else {
        status = 'synced';
      }
      
      return {
        status,
        localCommits: localCommits || undefined,
        remoteCommits: remoteCommits || undefined,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: `Failed to get git status: ${error}`
      };
    }
  }

  async hasChanges(): Promise<boolean> {
    try {
      const status = await this.executeGitCommand(["status", "--porcelain"], this.repositoryPath);
      return status.trim().length > 0;
    } catch (error) {
      console.error("Failed to check git status:", error);
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.executeGitCommand(["branch", "--show-current"], this.repositoryPath);
      return branch.trim();
    } catch (error) {
      return this.config.branch || "main";
    }
  }

  async getLastCommitHash(): Promise<string> {
    try {
      const hash = await this.executeGitCommand(["rev-parse", "HEAD"], this.repositoryPath);
      return hash.trim();
    } catch (error) {
      return "";
    }
  }

  private async executeGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const git = spawn("git", args, { 
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          // Add authentication if using token
          ...(this.config.credentials?.token && {
            GIT_ASKPASS: "echo",
            GIT_USERNAME: this.config.credentials.username || "token",
            GIT_PASSWORD: this.config.credentials.token
          })
        }
      });

      let stdout = "";
      let stderr = "";

      git.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      git.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      git.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Git command failed: ${stderr || stdout}`));
        }
      });

      git.on("error", (error) => {
        reject(new Error(`Failed to execute git command: ${error.message}`));
      });
    });
  }
}
