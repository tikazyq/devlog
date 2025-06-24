/**
 * Integration service that handles synchronization between local storage and external systems
 */

import { DevlogEntry, EnterpriseIntegration, ExternalReference } from "@devlog/types";
import { StorageProvider } from "./storage/storage-provider.js";
import { EnterpriseSync } from "./integrations/enterprise-sync.js";
import { SyncStrategy } from "./configuration-manager.js";

export interface ConflictData {
  localChanges: Partial<DevlogEntry>;
  externalChanges: Partial<DevlogEntry>;
  conflictFields: string[];
}

export interface SyncStatus {
  status: 'synced' | 'pending' | 'failed' | 'conflict';
  lastSyncAt?: string;
  errorMessage?: string;
  conflictData?: ConflictData;
}

export class IntegrationService {
  private enterpriseSync?: EnterpriseSync;
  private backgroundSyncTimer?: NodeJS.Timeout;

  constructor(
    private storage: StorageProvider,
    private integrations?: EnterpriseIntegration,
    private syncStrategy: SyncStrategy = {
      sourceOfTruth: 'local',
      conflictResolution: 'local-wins',
      autoSync: false
    }
  ) {
    if (integrations) {
      this.enterpriseSync = new EnterpriseSync(integrations);
    }

    // Start background sync if enabled
    if (this.syncStrategy.autoSync && this.syncStrategy.syncInterval) {
      this.startBackgroundSync();
    }
  }

  /**
   * Save an entry with optional synchronization to external systems
   */
  async saveWithSync(entry: DevlogEntry): Promise<DevlogEntry> {
    // Always save to local storage first (source of truth)
    const savedEntry = { ...entry };
    await this.storage.save(savedEntry);
    
    // Sync to external systems if configured
    if (this.enterpriseSync && this.syncStrategy.autoSync) {
      try {
        const externalRefs = await this.syncToExternal(savedEntry);
        savedEntry.externalReferences = externalRefs;
        savedEntry.updatedAt = new Date().toISOString();
        
        // Update with external references
        await this.storage.save(savedEntry);
        
        return savedEntry;
      } catch (error) {
        // Log sync failure but don't fail the save
        console.warn(`Sync failed for entry ${savedEntry.id}:`, error);
        
        // Mark as sync failed but keep the entry
        savedEntry.notes = savedEntry.notes || [];
        savedEntry.notes.push({
          id: `sync-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'issue',
          content: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        
        await this.storage.save(savedEntry);
        return savedEntry;
      }
    }
    
    return savedEntry;
  }

  /**
   * Manually sync an entry to external systems
   */
  async syncEntry(entryId: string): Promise<DevlogEntry | null> {
    const entry = await this.storage.get(entryId);
    if (!entry || !this.enterpriseSync) {
      return entry;
    }

    try {
      const externalRefs = await this.syncToExternal(entry);
      entry.externalReferences = externalRefs;
      entry.updatedAt = new Date().toISOString();
      
      await this.storage.save(entry);
      return entry;
    } catch (error) {
      console.error(`Manual sync failed for entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Sync an entry to all configured external systems
   */
  private async syncToExternal(entry: DevlogEntry): Promise<ExternalReference[]> {
    if (!this.enterpriseSync) {
      return [];
    }

    const externalRefs = await this.enterpriseSync.syncAll(entry);
    return externalRefs;
  }

  /**
   * Start background synchronization
   */
  private startBackgroundSync(): void {
    if (this.backgroundSyncTimer || !this.syncStrategy.syncInterval) {
      return;
    }

    const intervalMs = this.syncStrategy.syncInterval * 60 * 1000;
    
    this.backgroundSyncTimer = setInterval(async () => {
      await this.reconcileAllEntries();
    }, intervalMs);
  }

  /**
   * Stop background synchronization
   */
  stopBackgroundSync(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = undefined;
    }
  }

  /**
   * Reconcile all entries with external systems
   */
  async reconcileAllEntries(): Promise<void> {
    if (!this.enterpriseSync) {
      return;
    }

    try {
      // Get all entries that might need reconciliation
      const entries = await this.storage.list();
      
      for (const entry of entries) {
        // Only reconcile entries that have external references or are meant to sync
        if (entry.externalReferences && entry.externalReferences.length > 0) {
          await this.reconcileEntry(entry);
        }
      }
    } catch (error) {
      console.warn('Background reconciliation failed:', error);
    }
  }

  /**
   * Reconcile a single entry with external systems
   */
  private async reconcileEntry(entry: DevlogEntry): Promise<void> {
    // This is a placeholder for now - full implementation would:
    // 1. Fetch the latest version from external systems
    // 2. Compare with local version
    // 3. Detect conflicts
    // 4. Resolve conflicts based on strategy
    // 5. Update local storage
    
    console.log(`Reconciling entry ${entry.id} - implementation pending`);
  }

  /**
   * Get sync status for an entry
   */
  getSyncStatus(entry: DevlogEntry): SyncStatus {
    // Determine sync status based on entry properties
    if (!this.integrations) {
      return { status: 'synced' }; // No integrations = always synced
    }

    if (!entry.externalReferences || entry.externalReferences.length === 0) {
      return { status: 'pending' }; // Has integrations but no external refs
    }

    // Check if all configured integrations have references
    const hasJira = !this.integrations.jira || 
      entry.externalReferences.some(ref => ref.system === 'jira');
    const hasAdo = !this.integrations.ado || 
      entry.externalReferences.some(ref => ref.system === 'ado');
    const hasGitHub = !this.integrations.github || 
      entry.externalReferences.some(ref => ref.system === 'github');

    if (hasJira && hasAdo && hasGitHub) {
      return { 
        status: 'synced',
        lastSyncAt: entry.updatedAt
      };
    }

    return { status: 'pending' };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopBackgroundSync();
  }
}
