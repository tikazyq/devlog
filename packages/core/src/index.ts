export { 
  DevlogManager, 
  type DevlogManagerOptions, 
  type DiscoverDevlogsRequest, 
  type DiscoveredDevlogEntry, 
  type DiscoveryResult 
} from "./devlog-manager.js";
export { ConfigurationManager, type DevlogConfig, type SyncStrategy } from "./configuration-manager.js";

// Integration Service
export { 
  IntegrationService, 
  type SyncStatus, 
  type ConflictData 
} from "./integration-service.js";

// Storage Providers  
export { 
  StorageProviderFactory, 
  type StorageProvider
} from "./storage/storage-provider.js";
export { SQLiteStorageProvider } from "./storage/sqlite-storage.js";
export { LocalJsonStorageProvider, type LocalJsonConfig } from "./storage/local-json-storage.js";
export { PostgreSQLStorageProvider } from "./storage/postgresql-storage.js";
export { MySQLStorageProvider } from "./storage/mysql-storage.js";
export { GitStorageProvider } from "./storage/git-storage-provider.js";
export { HybridStorageProvider } from "./storage/hybrid-storage-provider.js";
export { EnterpriseSync } from "./integrations/enterprise-sync.js";
export { DevlogUtils } from "./utils/devlog-utils.js";
export { RepositoryStructure, type DevlogIndex, type DevlogIndexEntry, type DevlogMetadata } from "./utils/repository-structure.js";
export { GitRepositoryManager, type RepositoryInfo, type RepositoryDiscoveryOptions } from "./utils/git-repository-manager.js";
export { GitOperations } from "./utils/git-operations.js";
export { ConflictResolver } from "./utils/conflict-resolver.js";

// Re-export types for convenience
export type {
  DevlogEntry,
  DevlogNote,
  DevlogType,
  DevlogStatus,
  DevlogPriority,
  NoteCategory,
  DevlogContext,
  AIContext,
  CreateDevlogRequest,
  UpdateDevlogRequest,
  DevlogFilter,
  DevlogStats,
  Dependency,
  Decision,
  Risk,
  ExternalReference,
  EnterpriseIntegration,
  JiraConfig,
  AdoConfig,
  GitHubConfig,
  SlackConfig
} from "@devlog/types";
