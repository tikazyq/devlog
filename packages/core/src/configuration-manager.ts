/**
 * Configuration manager for determining the best storage strategy
 */

// Load environment variables from .env file if available
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { StorageConfig } from '@devlog/types';
import { getWorkspaceRoot } from './storage/utils';

dotenv.config({ path: ['.env.local', '.env'] });

export interface DevlogConfig {
  storage: StorageConfig;
  // TODO: Uncomment when integrations are implemented
  // integrations?: EnterpriseIntegration;
  // syncStrategy?: SyncStrategy;
}

export class ConfigurationManager {
  private workspaceRoot: string | null = null;
  private configPath: string | null = null;

  async initialize(): Promise<void> {
    this.workspaceRoot = getWorkspaceRoot();
    this.configPath = path.resolve(this.workspaceRoot, 'devlog.config.json');
  }

  /**
   * Load configuration from file or environment
   */
  async loadConfig(): Promise<DevlogConfig> {
    await this.ensureInitialized();
    // Try to load from config file first
    try {
      const configData = await fs.readFile(this.configPath!, 'utf-8');
      return JSON.parse(configData) as DevlogConfig;
    } catch {
      // Config file doesn't exist, create default configuration
      return this.createDefaultConfig();
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: DevlogConfig): Promise<void> {
    await this.ensureInitialized();
    const configData = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath!, configData);
  }

  /**
   * Detect the best storage configuration automatically
   */
  getDefaultStorageConfig(): StorageConfig {
    return {
      type: 'json',
      json: {
        directory: '.devlog',
        filePattern: `{id:auto}-{slug}.json`,
        minPadding: 3,
        global: true,
      },
    };
  }

  private async createDefaultConfig(): Promise<DevlogConfig> {
    const storage = this.getDefaultStorageConfig();
    // const integrations = await this.detectEnterpriseIntegrations();
    // const syncStrategy = await this.detectSyncStrategy(integrations);

    return {
      storage,
      // integrations,
      // syncStrategy,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.workspaceRoot || !this.configPath) {
      await this.initialize();
    }
  }
}
