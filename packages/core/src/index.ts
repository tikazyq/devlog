export { DevlogManager, type DevlogManagerOptions } from "./devlog-manager.js";

// New modular architecture exports
export { DevlogManager as DevlogManagerV2, type DevlogManagerOptions as DevlogManagerOptionsV2 } from "./devlog-manager-v2.js";
export { FileSystemStorage, type DevlogStorage } from "./storage/file-system-storage.js";
export { DevlogOperations } from "./operations/devlog-operations.js";
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
  ExternalReference
} from "@devlog/types";
