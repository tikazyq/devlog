/**
 * Configuration manager for determining the best storage strategy
 */

// Load environment variables from .env file if available
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import * as os from "os";
import { EnterpriseIntegration } from "@devlog/types";
import { StorageConfig } from "./storage/storage-provider.js";

export interface SyncStrategy {
  sourceOfTruth: 'local' | 'external' | 'manual';
  conflictResolution: 'local-wins' | 'external-wins' | 'most-recent' | 'manual';
  syncInterval?: number; // minutes
  autoSync?: boolean;
}

export interface DevlogConfig {
  storage: StorageConfig;
  integrations?: EnterpriseIntegration;
  syncStrategy?: SyncStrategy;
  workspaceRoot?: string;
  workspaceId?: string; // Added for workspace identification
}

/**
 * Global devlog directory structure in ~/.devlog
 */
interface DevlogGlobalStructure {
  configPath: string;      // ~/.devlog/config.json
  workspacesDir: string;   // ~/.devlog/workspaces/
  cacheDir: string;        // ~/.devlog/cache/
  backupsDir: string;      // ~/.devlog/backups/
  logsDir: string;         // ~/.devlog/logs/
}

/**
 * Workspace-specific structure within ~/.devlog/workspaces/{workspaceId}/
 */
interface DevlogWorkspaceStructure {
  workspaceDir: string;    // ~/.devlog/workspaces/{workspaceId}/
  dbPath: string;          // ~/.devlog/workspaces/{workspaceId}/devlog.db
  metadataPath: string;    // ~/.devlog/workspaces/{workspaceId}/metadata.json
  attachmentsDir: string;  // ~/.devlog/workspaces/{workspaceId}/attachments/
}

export class ConfigurationManager {
  private readonly configPath: string;
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.configPath = path.join(workspaceRoot, "devlog.config.json");
  }

  /**
   * Load configuration from file or environment
   */
  async loadConfig(): Promise<DevlogConfig> {
    // Try to load from config file first
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      const config = JSON.parse(configData) as DevlogConfig;
      return this.validateAndEnhanceConfig(config);
    } catch {
      // Config file doesn't exist, create default configuration
      return this.createDefaultConfig();
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: DevlogConfig): Promise<void> {
    const configData = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath, configData);
  }

  /**
   * Detect the best storage configuration automatically
   */
  async detectBestStorage(): Promise<StorageConfig> {
    // Check for database environment variables
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      
      if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
        return {
          type: "postgres",
          connectionString: dbUrl
        };
      }
      
      if (dbUrl.startsWith("mysql://")) {
        return {
          type: "mysql",
          connectionString: dbUrl
        };
      }
    }

    // Check for specific database preferences
    if (process.env.DEVLOG_STORAGE_TYPE) {
      const storageType = process.env.DEVLOG_STORAGE_TYPE.toLowerCase();
      
      switch (storageType) {
        case "sqlite":
          return {
            type: "sqlite",
            filePath: process.env.DEVLOG_SQLITE_PATH || ":memory:"
          };
        case "postgres":
        case "postgresql":
          return {
            type: "postgres",
            connectionString: process.env.DEVLOG_POSTGRES_URL || "postgresql://localhost/devlog"
          };
        case "mysql":
          return {
            type: "mysql",
            connectionString: process.env.DEVLOG_MYSQL_URL || "mysql://localhost/devlog"
          };
      }
    }

    // Default to SQLite using global workspace structure
    const workspace = await this.getWorkspaceStructure();
    await this.initializeGlobalStructure();
    await this.initializeWorkspaceStructure(workspace);
    
    return {
      type: "sqlite",
      filePath: workspace.dbPath
    };
  }

  /**
   * Get storage recommendations based on use case
   */
  getStorageRecommendations(): Array<{
    type: StorageConfig["type"];
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    bestFor: string[];
  }> {
    return [
      {
        type: "sqlite",
        name: "SQLite Database",
        description: "Local SQLite database for efficient storage and querying",
        pros: [
          "Fast performance",
          "Full-text search",
          "ACID transactions",
          "No server required",
          "Works offline"
        ],
        cons: [
          "Single-user access",
          "Limited concurrent writes",
          "Not suitable for distributed teams"
        ],
        bestFor: [
          "Individual developers",
          "Local development",
          "Fast prototyping",
          "Offline work"
        ]
      },
      {
        type: "postgres",
        name: "PostgreSQL Database",
        description: "Production-grade PostgreSQL database",
        pros: [
          "Multi-user support",
          "Advanced querying",
          "Scalable",
          "Full ACID compliance",
          "Concurrent access"
        ],
        cons: [
          "Requires database server",
          "More complex setup",
          "Network dependency"
        ],
        bestFor: [
          "Team collaboration",
          "Production deployments",
          "Web applications",
          "Multi-user environments"
        ]
      },
      {
        type: "mysql",
        name: "MySQL Database",
        description: "Popular MySQL database for web applications",
        pros: [
          "Wide adoption",
          "Good performance",
          "Multi-user support",
          "Full-text search",
          "Mature ecosystem"
        ],
        cons: [
          "Requires database server",
          "Setup complexity",
          "Network dependency"
        ],
        bestFor: [
          "Web applications",
          "Existing MySQL infrastructure",
          "Team collaboration",
          "LAMP stack projects"
        ]
      }
    ];
  }

  /**
   * Detect the best sync strategy based on environment and integrations
   */
  async detectSyncStrategy(integrations?: EnterpriseIntegration): Promise<SyncStrategy> {
    // Default sync strategy
    const defaultStrategy: SyncStrategy = {
      sourceOfTruth: 'local',
      conflictResolution: 'local-wins',
      syncInterval: 15, // 15 minutes
      autoSync: true
    };

    // If no integrations configured, return minimal strategy
    if (!integrations || !this.hasEnterpriseIntegrations(integrations)) {
      return {
        sourceOfTruth: 'local',
        conflictResolution: 'local-wins',
        autoSync: false
      };
    }

    // Check for environment-specific sync preferences
    if (process.env.DEVLOG_SYNC_STRATEGY) {
      const strategy = process.env.DEVLOG_SYNC_STRATEGY.toLowerCase();
      switch (strategy) {
        case 'external':
          return {
            ...defaultStrategy,
            sourceOfTruth: 'external',
            conflictResolution: 'external-wins'
          };
        case 'manual':
          return {
            ...defaultStrategy,
            sourceOfTruth: 'manual',
            conflictResolution: 'manual',
            autoSync: false
          };
      }
    }

    // Configure sync interval from environment
    if (process.env.DEVLOG_SYNC_INTERVAL) {
      const interval = parseInt(process.env.DEVLOG_SYNC_INTERVAL);
      if (!isNaN(interval) && interval > 0) {
        defaultStrategy.syncInterval = interval;
      }
    }

    return defaultStrategy;
  }

  private async createDefaultConfig(): Promise<DevlogConfig> {
    const storage = await this.detectBestStorage();
    const integrations = await this.detectEnterpriseIntegrations();
    const syncStrategy = await this.detectSyncStrategy(integrations);
    const detectedRoot = await this.detectProjectRoot();
    const workspace = await this.getWorkspaceStructure(detectedRoot || undefined);
    
    return {
      storage,
      integrations,
      syncStrategy,
      workspaceRoot: detectedRoot || this.workspaceRoot,
      workspaceId: path.basename(workspace.workspaceDir)
    };
  }

  async detectEnterpriseIntegrations(): Promise<EnterpriseIntegration | undefined> {
    const integrations: EnterpriseIntegration = {};

    // Check for Jira configuration
    if (process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
      integrations.jira = {
        baseUrl: process.env.JIRA_BASE_URL,
        projectKey: process.env.JIRA_PROJECT_KEY || "",
        userEmail: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN
      };
    }

    // Check for Azure DevOps configuration
    if (process.env.ADO_ORGANIZATION && process.env.ADO_PROJECT && process.env.ADO_PAT) {
      integrations.ado = {
        organization: process.env.ADO_ORGANIZATION,
        project: process.env.ADO_PROJECT,
        personalAccessToken: process.env.ADO_PAT
      };
    }

    // Check for GitHub configuration
    if (process.env.GITHUB_OWNER && process.env.GITHUB_REPO && process.env.GITHUB_TOKEN) {
      integrations.github = {
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        token: process.env.GITHUB_TOKEN,
        projectNumber: process.env.GITHUB_PROJECT_NUMBER ? parseInt(process.env.GITHUB_PROJECT_NUMBER) : undefined,
        projectId: process.env.GITHUB_PROJECT_ID
      };
    }

    return Object.keys(integrations).length > 0 ? integrations : undefined;
  }

  private hasEnterpriseIntegrations(integrations: EnterpriseIntegration): boolean {
    return !!(integrations.jira || integrations.ado || integrations.github);
  }

  private async validateAndEnhanceConfig(config: DevlogConfig): Promise<DevlogConfig> {
    // Add any missing fields or validate existing ones
    if (!config.storage) {
      throw new Error("Storage configuration is required");
    }

    // Detect and set workspace information
    const detectedRoot = await this.detectProjectRoot();
    const workspace = await this.getWorkspaceStructure(detectedRoot || undefined);
    
    return {
      ...config,
      workspaceRoot: detectedRoot || this.workspaceRoot,
      workspaceId: path.basename(workspace.workspaceDir)
    };
  }

  /**
   * Get the global devlog directory structure
   */
  private getGlobalStructure(): DevlogGlobalStructure {
    const homeDir = os.homedir();
    const devlogDir = path.join(homeDir, '.devlog');
    
    return {
      configPath: path.join(devlogDir, 'config.json'),
      workspacesDir: path.join(devlogDir, 'workspaces'),
      cacheDir: path.join(devlogDir, 'cache'),
      backupsDir: path.join(devlogDir, 'backups'),
      logsDir: path.join(devlogDir, 'logs')
    };
  }

  /**
   * Generate a deterministic workspace ID based on project path
   */
  private generateWorkspaceId(projectPath: string): string {
    // Use first 12 characters of SHA-256 hash for short, deterministic ID
    const hash = crypto.createHash('sha256').update(projectPath).digest('hex');
    return hash.substring(0, 12);
  }

  /**
   * Detect the actual project root (where .git, package.json, etc. exist)
   */
  private async detectProjectRoot(startPath: string = this.workspaceRoot): Promise<string | null> {
    let currentDir = path.resolve(startPath);
    
    while (currentDir !== path.dirname(currentDir)) {
      // Check for common project root indicators
      const indicators = [
        path.join(currentDir, '.git'),
        path.join(currentDir, 'package.json'),
        path.join(currentDir, 'pyproject.toml'),
        path.join(currentDir, 'Cargo.toml'),
        path.join(currentDir, 'go.mod'),
        path.join(currentDir, 'devlog.config.json')
      ];
      
      for (const indicator of indicators) {
        try {
          await fs.access(indicator);
          return currentDir;
        } catch {
          // Continue checking
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  /**
   * Get workspace structure for a given project path
   */
  private async getWorkspaceStructure(projectPath?: string): Promise<DevlogWorkspaceStructure> {
    const global = this.getGlobalStructure();
    
    // Use 'default' workspace by default for simplicity
    // Users can still override with environment variables if needed
    let workspaceId = 'default';
    
    // Only use project-specific workspace if explicitly requested via projectPath
    if (projectPath) {
      workspaceId = this.generateWorkspaceId(projectPath);
    }
    
    const workspaceDir = path.join(global.workspacesDir, workspaceId);
    
    return {
      workspaceDir,
      dbPath: path.join(workspaceDir, 'devlog.db'),
      metadataPath: path.join(workspaceDir, 'metadata.json'),
      attachmentsDir: path.join(workspaceDir, 'attachments')
    };
  }

  /**
   * Initialize the global devlog directory structure
   */
  private async initializeGlobalStructure(): Promise<void> {
    const global = this.getGlobalStructure();
    
    // Create all necessary directories
    await fs.mkdir(global.workspacesDir, { recursive: true });
    await fs.mkdir(global.cacheDir, { recursive: true });
    await fs.mkdir(global.backupsDir, { recursive: true });
    await fs.mkdir(global.logsDir, { recursive: true });
    
    // Create global config if it doesn't exist
    try {
      await fs.access(global.configPath);
    } catch {
      const defaultGlobalConfig = {
        version: "1.0.0",
        created: new Date().toISOString(),
        defaultStorage: "sqlite"
      };
      await fs.writeFile(global.configPath, JSON.stringify(defaultGlobalConfig, null, 2));
    }
  }

  /**
   * Initialize workspace-specific structure
   */
  private async initializeWorkspaceStructure(workspace: DevlogWorkspaceStructure, projectPath?: string): Promise<void> {
    // Create workspace directory
    await fs.mkdir(workspace.workspaceDir, { recursive: true });
    await fs.mkdir(workspace.attachmentsDir, { recursive: true });
    
    // Create workspace metadata if it doesn't exist
    try {
      await fs.access(workspace.metadataPath);
    } catch {
      const detectedRoot = projectPath || await this.detectProjectRoot();
      const metadata = {
        version: "1.0.0",
        created: new Date().toISOString(),
        projectPath: detectedRoot,
        workspaceId: path.basename(workspace.workspaceDir),
        lastAccessed: new Date().toISOString()
      };
      await fs.writeFile(workspace.metadataPath, JSON.stringify(metadata, null, 2));
    }
  }
}
