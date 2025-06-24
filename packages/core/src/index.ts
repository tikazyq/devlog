export { DevlogManager, type DevlogManagerOptions } from "./devlog-manager.js";
export { ConfigurationManager, type DevlogConfig } from "./configuration-manager.js";

// Storage Providers
export { 
  StorageProviderFactory, 
  type StorageProvider, 
  type StorageConfig, 
  type EnterpriseStorageProvider 
} from "./storage/storage-provider.js";
export { SQLiteStorageProvider } from "./storage/sqlite-storage.js";
export { PostgreSQLStorageProvider } from "./storage/postgresql-storage.js";
export { MySQLStorageProvider } from "./storage/mysql-storage.js";
export { EnterpriseStorageAdapter } from "./storage/enterprise-storage.js";
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
