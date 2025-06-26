/**
 * Integration service that handles synchronization between local storage and external systems
 */

import { DevlogEntry } from '@devlog/types';

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
  private backgroundSyncTimer?: NodeJS.Timeout;

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
   * Clean up resources
   */
  dispose(): void {
    this.stopBackgroundSync();
  }
}
