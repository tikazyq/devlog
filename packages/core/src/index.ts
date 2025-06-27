export {
  DevlogManager,
} from './devlog-manager.js';
export { ConfigurationManager } from './configuration-manager.js';

// Integration Service
export { IntegrationService } from './integration-service.js';

// Storage Providers
export { StorageProviderFactory } from './storage/storage-provider.js';
export { SQLiteStorageProvider } from './storage/sqlite-storage.js';
export { JsonStorageProvider } from './storage/json-storage.js';
export { PostgreSQLStorageProvider } from './storage/postgresql-storage.js';
export { MySQLStorageProvider } from './storage/mysql-storage.js';
export { EnterpriseSync } from './integrations/enterprise-sync.js';

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
  SlackConfig,
} from '@devlog/types';

// Utilities
export * from './utils/storage.js';
