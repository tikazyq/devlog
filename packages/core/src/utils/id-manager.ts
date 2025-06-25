import * as fs from 'fs';
import * as path from 'path';
import { DevlogId } from '@devlog/types';

/**
 * Utility class for managing integer ID generation and conversion
 */
export class IdManager {
  private counterFile: string;
  private lockFile: string;
  
  constructor(dataDir: string) {
    this.counterFile = path.join(dataDir, '.devlog-counter');
    this.lockFile = path.join(dataDir, '.devlog-counter.lock');
  }

  /**
   * Convert any ID to string format for database storage
   */
  static idToString(id: DevlogId): string {
    return String(id);
  }

  /**
   * Convert string ID back to integer (since all IDs are now integers)
   */
  static stringToId(idStr: string): DevlogId {
    const parsed = parseInt(idStr, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid integer ID: ${idStr}`);
    }
    return parsed;
  }

  /**
   * Check if an ID is an integer ID (new format)
   */
  static isIntegerId(id: DevlogId): id is number {
    return typeof id === 'number';
  }

  /**
   * Format ID for display (e.g., #123 for integers, original string for legacy)
   */
  static formatIdForDisplay(id: DevlogId): string {
    if (typeof id === 'number') {
      return `#${id}`;
    }
    return id;
  }

  /**
   * Generate the next integer ID using atomic file operations
   */
  async generateNextId(): Promise<number> {
    return new Promise((resolve, reject) => {
      const maxRetries = 10;
      let retries = 0;

      const tryLock = () => {
        try {
          // Check if lock file exists
          if (fs.existsSync(this.lockFile)) {
            if (retries < maxRetries) {
              retries++;
              setTimeout(tryLock, 10 * retries); // Exponential backoff
              return;
            } else {
              reject(new Error('Failed to acquire lock for ID generation after multiple retries'));
              return;
            }
          }

          // Create lock file
          fs.writeFileSync(this.lockFile, String(process.pid));

          try {
            // Read current counter or initialize to 0
            let counter = 0;
            if (fs.existsSync(this.counterFile)) {
              const counterStr = fs.readFileSync(this.counterFile, 'utf8').trim();
              counter = parseInt(counterStr, 10) || 0;
            }

            // Increment counter
            counter++;

            // Write new counter
            fs.writeFileSync(this.counterFile, String(counter));

            // Remove lock file
            fs.unlinkSync(this.lockFile);

            resolve(counter);
          } catch (error) {
            // Ensure lock is removed even if operation fails
            try {
              fs.unlinkSync(this.lockFile);
            } catch {
              // Ignore cleanup errors
            }
            reject(error);
          }
        } catch (error) {
          reject(error);
        }
      };

      tryLock();
    });
  }

  /**
   * Initialize the counter file with a specific starting value
   * Useful for migration scenarios
   */
  async initializeCounter(startValue: number = 0): Promise<void> {
    if (!fs.existsSync(this.counterFile)) {
      fs.writeFileSync(this.counterFile, String(startValue));
    }
  }

  /**
   * Get the current counter value without incrementing
   */
  async getCurrentCounter(): Promise<number> {
    if (!fs.existsSync(this.counterFile)) {
      return 0;
    }
    const counterStr = fs.readFileSync(this.counterFile, 'utf8').trim();
    return parseInt(counterStr, 10) || 0;
  }

  /**
   * Set a specific counter value (useful for migration)
   */
  async setCounter(value: number): Promise<void> {
    fs.writeFileSync(this.counterFile, String(value));
  }
}
