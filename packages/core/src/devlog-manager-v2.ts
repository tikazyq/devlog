import * as path from "path";
import { 
  DevlogEntry, 
  DevlogNote, 
  DevlogStats,
  CreateDevlogRequest,
  UpdateDevlogRequest,
  DevlogFilter,
  EnterpriseIntegration
} from "@devlog/types";

import { FileSystemStorage } from "./storage/file-system-storage.js";
import { DevlogOperations } from "./operations/devlog-operations.js";
import { EnterpriseSync } from "./integrations/enterprise-sync.js";

export interface DevlogManagerOptions {
  workspaceRoot?: string;
  devlogDir?: string;
  integrations?: EnterpriseIntegration;
}

/**
 * Main DevlogManager class that orchestrates all devlog operations.
 * This is the primary API that clients should use.
 */
export class DevlogManager {
  private storage: FileSystemStorage;
  private operations: DevlogOperations;
  private enterpriseSync?: EnterpriseSync;

  constructor(options: DevlogManagerOptions = {}) {
    // Setup storage
    const root = options.workspaceRoot || process.cwd();
    const devlogDir = options.devlogDir || path.join(root, ".devlog");
    this.storage = new FileSystemStorage(devlogDir);

    // Setup enterprise integrations if provided
    if (options.integrations) {
      this.enterpriseSync = new EnterpriseSync(options.integrations);
    }

    // Setup operations with storage and integrations
    this.operations = new DevlogOperations(this.storage, this.enterpriseSync);
  }

  // Core CRUD Operations
  async createDevlog(request: CreateDevlogRequest): Promise<DevlogEntry> {
    return this.operations.createDevlog(request);
  }

  async updateDevlog(request: UpdateDevlogRequest): Promise<DevlogEntry> {
    return this.operations.updateDevlog(request);
  }

  async getDevlog(id: string): Promise<DevlogEntry | null> {
    return this.operations.getDevlog(id);
  }

  async listDevlogs(filters: DevlogFilter = {}): Promise<DevlogEntry[]> {
    return this.operations.listDevlogs(filters);
  }

  async searchDevlogs(query: string): Promise<DevlogEntry[]> {
    return this.operations.searchDevlogs(query);
  }

  async deleteDevlog(id: string): Promise<void> {
    return this.operations.deleteDevlog(id);
  }

  async findOrCreateDevlog(request: CreateDevlogRequest): Promise<{entry: DevlogEntry, created: boolean}> {
    return this.operations.findOrCreateDevlog(request);
  }

  // Note and Context Operations
  async addNote(id: string, note: Omit<DevlogNote, "id" | "timestamp">): Promise<DevlogEntry> {
    return this.operations.addNote(id, note);
  }

  async completeDevlog(id: string, summary?: string): Promise<DevlogEntry> {
    return this.operations.completeDevlog(id, summary);
  }

  async getActiveContext(limit: number = 10): Promise<DevlogEntry[]> {
    return this.operations.getActiveContext(limit);
  }

  async updateAIContext(args: {
    id: string;
    summary?: string;
    insights?: string[];
    questions?: string[];
    patterns?: string[];
    nextSteps?: string[];
  }): Promise<DevlogEntry> {
    return this.operations.updateAIContext(args);
  }

  async addDecision(args: {
    id: string;
    decision: string;
    rationale: string;
    alternatives?: string[];
    decisionMaker: string;
  }): Promise<DevlogEntry> {
    return this.operations.addDecision(args);
  }

  // Statistics and Analytics
  async getStats(): Promise<DevlogStats> {
    return this.operations.getStats();
  }

  // Enterprise Integration Methods
  async syncWithJira(id: string): Promise<DevlogEntry> {
    return this.operations.syncWithJira(id);
  }

  async syncWithADO(id: string): Promise<DevlogEntry> {
    return this.operations.syncWithADO(id);
  }

  async syncWithGitHub(id: string): Promise<DevlogEntry> {
    return this.operations.syncWithGitHub(id);
  }

  async syncAllIntegrations(id: string): Promise<DevlogEntry> {
    return this.operations.syncAllIntegrations(id);
  }

  // Utility Methods
  async getDevlogDir(): Promise<string> {
    return this.storage.getDevlogDir();
  }
}
