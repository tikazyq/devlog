import * as crypto from "crypto";
import { DevlogType, DevlogEntry, DevlogFilter, DevlogNote } from "@devlog/types";

export class DevlogUtils {
  static generateId(title: string, type?: DevlogType): string {
    // Create a clean slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50); // Limit length

    // Add type prefix if provided
    const prefix = type ? `${type}-` : "";
    
    // Create a hash of the full input for uniqueness
    const hash = crypto.createHash('md5')
      .update(`${type || 'unknown'}-${title}`)
      .digest('hex')
      .substring(0, 8);

    return `${prefix}${slug}-${hash}`;
  }

  static async generateUniqueId(
    title: string, 
    type: DevlogType | undefined, 
    checkExisting: (id: string) => Promise<DevlogEntry | null>
  ): Promise<string> {
    const baseId = DevlogUtils.generateId(title, type);
    const existing = await checkExisting(baseId);
    if (!existing) {
      return baseId;
    }
    
    // If it exists, add a counter suffix
    let counter = 1;
    let uniqueId: string;
    
    do {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    } while (await checkExisting(uniqueId) && counter < 100); // Prevent infinite loop
    
    // Fallback to timestamp if we can't find a unique ID
    return counter >= 100 ? `${baseId}-${Date.now()}` : uniqueId;
  }

  static async checkForDuplicateTitle(
    title: string, 
    type: DevlogType | undefined, 
    getAllEntries: () => Promise<DevlogEntry[]>,
    excludeId?: string
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
