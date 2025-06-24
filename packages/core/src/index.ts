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
  type StorageProvider, 
  type StorageConfig 
} from "./storage/storage-provider.js";
export { SQLiteStorageProvider } from "./storage/sqlite-storage.js";
export { PostgreSQLStorageProvider } from "./storage/postgresql-storage.js";
export { MySQLStorageProvider } from "./storage/mysql-storage.js";
export { EnterpriseSync } from "./integrations/enterprise-sync.js";
export { DevlogUtils } from "./utils/devlog-utils.js";

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
