/**
 * Configuration manager for determining the best storage strategy
 */

import * as fs from "fs/promises";
import * as path from "path";
import { EnterpriseIntegration } from "@devlog/types";
import { StorageConfig } from "./storage/storage-provider.js";

export interface DevlogConfig {
  storage: StorageConfig;
  integrations?: EnterpriseIntegration;
  workspaceRoot?: string;
}

export class ConfigurationManager {
  private readonly configPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
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
    // Check for enterprise integrations first
    const integrations = await this.detectEnterpriseIntegrations();
    if (integrations && this.hasEnterpriseIntegrations(integrations)) {
      return {
        type: "enterprise",
        options: { integrations }
      };
    }

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
        case "json":
          return {
            type: "json",
            filePath: process.env.DEVLOG_JSON_PATH || ".devlog"
          };
      }
    }

    // Default to SQLite for local development
    return {
      type: "sqlite",
      filePath: process.env.DEVLOG_SQLITE_PATH || ".devlog/devlogs.db"
    };
  }

  /**
   * Check if current directory has existing JSON devlog data
   */
  async hasExistingJsonData(devlogDir: string = ".devlog"): Promise<boolean> {
    try {
      const indexPath = path.join(devlogDir, "index.json");
      await fs.access(indexPath);
      const indexData = await fs.readFile(indexPath, "utf-8");
      const index = JSON.parse(indexData);
      return Object.keys(index).length > 0;
    } catch {
      return false;
    }
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
        type: "enterprise",
        name: "Enterprise Integration",
        description: "Store devlogs directly in enterprise tools (Jira, ADO, GitHub)",
        pros: [
          "No local storage duplication",
          "Integrated with existing workflows",
          "Automatic synchronization",
          "Enterprise-grade security"
        ],
        cons: [
          "Requires enterprise tool access",
          "Limited offline capability",
          "Dependent on external services"
        ],
        bestFor: [
          "Teams using Jira, Azure DevOps, or GitHub Issues",
          "Enterprise environments",
          "Distributed teams"
        ]
      },
      {
        type: "sqlite",
        name: "SQLite Database",
        description: "Local SQLite database for efficient storage and querying",
        pros: [
          "Fast performance",
          "Full-text search",
          "ACID transactions",
          "No server required"
        ],
        cons: [
          "Single-user access",
          "Limited concurrent writes",
          "Not suitable for distributed teams"
        ],
        bestFor: [
          "Individual developers",
          "Local development",
          "Fast prototyping"
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
          "Full ACID compliance"
        ],
        cons: [
          "Requires database server",
          "More complex setup",
          "Network dependency"
        ],
        bestFor: [
          "Team collaboration",
          "Production deployments",
          "Web applications"
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
          "Full-text search"
        ],
        cons: [
          "Requires database server",
          "Setup complexity",
          "Network dependency"
        ],
        bestFor: [
          "Web applications",
          "Existing MySQL infrastructure",
          "Team collaboration"
        ]
      },
      {
        type: "json",
        name: "JSON Files (Legacy)",
        description: "Simple JSON file storage (backward compatibility)",
        pros: [
          "Simple setup",
          "Human-readable",
          "No dependencies",
          "Easy backup"
        ],
        cons: [
          "Poor performance with large datasets",
          "No concurrent access",
          "Limited querying capabilities"
        ],
        bestFor: [
          "Backward compatibility",
          "Simple use cases",
          "Migration scenarios"
        ]
      }
    ];
  }

  private async createDefaultConfig(): Promise<DevlogConfig> {
    const storage = await this.detectBestStorage();
    const integrations = await this.detectEnterpriseIntegrations();
    
    return {
      storage,
      integrations
    };
  }

  private async detectEnterpriseIntegrations(): Promise<EnterpriseIntegration | undefined> {
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

  private validateAndEnhanceConfig(config: DevlogConfig): DevlogConfig {
    // Add any missing fields or validate existing ones
    if (!config.storage) {
      throw new Error("Storage configuration is required");
    }

    return config;
  }
}
