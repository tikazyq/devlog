import * as crypto from "crypto";
import { DevlogType, DevlogEntry, DevlogFilter, DevlogNote, DevlogId } from "@devlog/types";

export class DevlogUtils {
  /**
   * Generate semantic key for devlog entry (used for the key field)
   */
  static generateKey(title: string, type?: DevlogType): string {
    // Create a clean slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50); // Limit length

    return slug;
  }
  
  /**
   * Legacy method for backward compatibility - now generates keys instead of IDs
   * @deprecated Use generateKey instead
   */
  static generateId(title: string, type?: DevlogType): string {
    return DevlogUtils.generateKey(title, type);
  }

  /**
   * Generate unique key (deprecated - integer IDs handle uniqueness automatically)
   * @deprecated No longer needed with integer ID system
   */
  static async generateUniqueId(
    title: string, 
    type: DevlogType | undefined, 
    checkExisting: (id: string) => Promise<DevlogEntry | null>
  ): Promise<string> {
    return DevlogUtils.generateKey(title, type);
  }

  static async checkForDuplicateTitle(
    title: string, 
    type: DevlogType | undefined, 
    getAllEntries: () => Promise<DevlogEntry[]>,
    excludeId?: DevlogId
  ): Promise<DevlogEntry | null> {
    const entries = await getAllEntries();
    const normalizedTitle = title.toLowerCase().trim();
    
    for (const entry of entries) {
      if (entry.id === excludeId) continue;
      
      const entryTitleNormalized = entry.title.toLowerCase().trim();
      if (entryTitleNormalized === normalizedTitle && entry.type === type) {
        return entry;
      }
    }
    
    return null;
  }

  static filterDevlogs(entries: DevlogEntry[], filters: DevlogFilter): DevlogEntry[] {
    return entries.filter(entry => {
      if (filters.status && !filters.status.includes(entry.status)) return false;
      if (filters.type && !filters.type.includes(entry.type)) return false;
      if (filters.priority && !filters.priority.includes(entry.priority)) return false;
      if (filters.assignee && entry.assignee !== filters.assignee) return false;
      if (filters.tags && !filters.tags.every(tag => entry.tags.includes(tag))) return false;
      return true;
    });
  }

  static searchInText(text: string, query: string): boolean {
    return text.toLowerCase().includes(query.toLowerCase());
  }

  static searchDevlogEntry(entry: DevlogEntry, query: string): boolean {
    const searchableText = [
      entry.title,
      entry.description,
      entry.context.businessContext,
      entry.context.technicalContext,
      entry.aiContext.currentSummary,
      ...entry.aiContext.keyInsights,
      ...entry.notes.map((note: DevlogNote) => note.content),
    ].join(" ");

    return DevlogUtils.searchInText(searchableText, query);
  }

  static sortEntriesByUpdatedDate(entries: DevlogEntry[]): DevlogEntry[] {
    return entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static createNote(content: string, category: DevlogNote['category'] = 'progress'): DevlogNote {
    return {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      content,
    };
  }

  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}
