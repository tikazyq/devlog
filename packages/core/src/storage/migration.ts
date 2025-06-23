/**
 * Migration utility to move from old JSON storage to new storage providers
 */

import * as path from "path";
import { DevlogEntry } from "@devlog/types";
import { FileSystemStorage } from "./file-system-storage";
import { StorageProvider, StorageConfig, StorageProviderFactory } from "./storage-provider";

export interface MigrationOptions {
  sourceDir: string;
  targetStorage: StorageConfig;
  dryRun?: boolean;
  backupSource?: boolean;
}

export interface MigrationResult {
  totalEntries: number;
  migratedEntries: number;
  failedEntries: number;
  errors: string[];
}

export class StorageMigration {
  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalEntries: 0,
      migratedEntries: 0,
      failedEntries: 0,
      errors: []
    };

    try {
      // Initialize source storage (old JSON format)
      const sourceStorage = new FileSystemStorage(options.sourceDir);
      await sourceStorage.ensureDevlogDir();

      // Initialize target storage
      const targetStorage = await StorageProviderFactory.create(options.targetStorage);
      await targetStorage.initialize();

      // Load all entries from source
      const index = await sourceStorage.loadIndex();
      const entryIds = Object.keys(index);
      result.totalEntries = entryIds.length;

      console.log(`Found ${result.totalEntries} entries to migrate`);

      for (const id of entryIds) {
        try {
          const entry = await sourceStorage.loadDevlog(id);
          if (!entry) {
            result.errors.push(`Could not load entry: ${id}`);
            result.failedEntries++;
            continue;
          }

          // Validate and transform entry if needed
          const transformedEntry = this.transformEntry(entry);

          if (!options.dryRun) {
            await targetStorage.save(transformedEntry);
          }

          result.migratedEntries++;
          
          if (result.migratedEntries % 10 === 0) {
            console.log(`Migrated ${result.migratedEntries}/${result.totalEntries} entries`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate ${id}: ${error}`;
          result.errors.push(errorMsg);
          result.failedEntries++;
          console.error(errorMsg);
        }
      }

      await targetStorage.dispose();

      console.log(`Migration completed: ${result.migratedEntries} successful, ${result.failedEntries} failed`);

      return result;
    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Check if migration is needed
   */
  async needsMigration(devlogDir: string): Promise<boolean> {
    const storage = new FileSystemStorage(devlogDir);
    try {
      const index = await storage.loadIndex();
      return Object.keys(index).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Backup existing JSON storage before migration
   */
  async backupJsonStorage(devlogDir: string): Promise<string> {
    const fs = await import("fs/promises");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `${devlogDir}-backup-${timestamp}`;
    
    await fs.cp(devlogDir, backupDir, { recursive: true });
    
    console.log(`Backup created: ${backupDir}`);
    return backupDir;
  }

  /**
   * Get migration statistics for a directory
   */
  async getMigrationStats(devlogDir: string): Promise<{ totalEntries: number; totalSize: number }> {
    const storage = new FileSystemStorage(devlogDir);
    const fs = await import("fs/promises");
    
    try {
      const index = await storage.loadIndex();
      const entryIds = Object.keys(index);
      
      let totalSize = 0;
      for (const id of entryIds) {
        try {
          const filename = index[id];
          const filePath = path.join(devlogDir, filename);
          const stat = await fs.stat(filePath);
          totalSize += stat.size;
        } catch {
          // Skip missing files
        }
      }

      return {
        totalEntries: entryIds.length,
        totalSize
      };
    } catch {
      return { totalEntries: 0, totalSize: 0 };
    }
  }

  private transformEntry(entry: DevlogEntry): DevlogEntry {
    // Ensure all required fields exist for new storage format
    const transformed: DevlogEntry = {
      ...entry,
      // Ensure aiContext has all required fields
      aiContext: {
        currentSummary: entry.aiContext?.currentSummary || "",
        keyInsights: entry.aiContext?.keyInsights || [],
        openQuestions: entry.aiContext?.openQuestions || [],
        relatedPatterns: entry.aiContext?.relatedPatterns || [],
        suggestedNextSteps: entry.aiContext?.suggestedNextSteps || [],
        lastAIUpdate: entry.aiContext?.lastAIUpdate || entry.updatedAt,
        contextVersion: entry.aiContext?.contextVersion || 1
      },
      // Ensure context has required fields
      context: {
        businessContext: entry.context?.businessContext || "",
        technicalContext: entry.context?.technicalContext || "",
        dependencies: entry.context?.dependencies || [],
        decisions: entry.context?.decisions || [],
        acceptanceCriteria: entry.context?.acceptanceCriteria || [],
        risks: entry.context?.risks || []
      }
    };

    return transformed;
  }
}
