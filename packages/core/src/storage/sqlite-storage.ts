/**
 * SQLite storage provider for local devlog storage
 */

import { DevlogEntry, DevlogFilter, DevlogStats, DevlogStatus, DevlogType, DevlogPriority } from "@devlog/types";
import { StorageProvider } from "./storage-provider.js";

export class SQLiteStorageProvider implements StorageProvider {
  private db: any = null;
  private filePath: string;
  private options: Record<string, any>;

  constructor(filePath: string, options: Record<string, any> = {}) {
    this.filePath = filePath;
    this.options = options;
  }

  async initialize(): Promise<void> {
    // Dynamic import to make better-sqlite3 optional
    try {
      // Use eval to prevent TypeScript from transforming the import
      const dynamicImport = eval('(specifier) => import(specifier)');
      const sqlite3Module = await dynamicImport("better-sqlite3");
      const Database = sqlite3Module.default;
      
      this.db = new Database(this.filePath, this.options);
    } catch (error: any) {
      console.error("Failed to initialize SQLite storage:", error);
      throw new Error("Failed to initialize SQLite storage: " + error.message);
    }
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devlog_entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        estimated_hours INTEGER,
        actual_hours INTEGER,
        assignee TEXT,
        tags TEXT, -- JSON array
        files TEXT, -- JSON array
        related_devlogs TEXT, -- JSON array
        context TEXT, -- JSON object
        ai_context TEXT, -- JSON object
        external_references TEXT, -- JSON array
        notes TEXT -- JSON array
      );

      CREATE INDEX IF NOT EXISTS idx_devlog_status ON devlog_entries(status);
      CREATE INDEX IF NOT EXISTS idx_devlog_type ON devlog_entries(type);
      CREATE INDEX IF NOT EXISTS idx_devlog_priority ON devlog_entries(priority);
      CREATE INDEX IF NOT EXISTS idx_devlog_assignee ON devlog_entries(assignee);
      CREATE INDEX IF NOT EXISTS idx_devlog_created_at ON devlog_entries(created_at);
      CREATE INDEX IF NOT EXISTS idx_devlog_updated_at ON devlog_entries(updated_at);

      -- Full-text search table
      CREATE VIRTUAL TABLE IF NOT EXISTS devlog_fts USING fts5(
        id,
        title,
        description,
        content=devlog_entries,
        content_rowid=rowid
      );

      -- Triggers to keep FTS table in sync
      CREATE TRIGGER IF NOT EXISTS devlog_fts_insert AFTER INSERT ON devlog_entries BEGIN
        INSERT INTO devlog_fts(rowid, id, title, description) VALUES (new.rowid, new.id, new.title, new.description);
      END;

      CREATE TRIGGER IF NOT EXISTS devlog_fts_delete AFTER DELETE ON devlog_entries BEGIN
        INSERT INTO devlog_fts(devlog_fts, rowid, id, title, description) VALUES ('delete', old.rowid, old.id, old.title, old.description);
      END;

      CREATE TRIGGER IF NOT EXISTS devlog_fts_update AFTER UPDATE ON devlog_entries BEGIN
        INSERT INTO devlog_fts(devlog_fts, rowid, id, title, description) VALUES ('delete', old.rowid, old.id, old.title, old.description);
        INSERT INTO devlog_fts(rowid, id, title, description) VALUES (new.rowid, new.id, new.title, new.description);
      END;
    `);
  }

  async exists(id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare("SELECT 1 FROM devlog_entries WHERE id = ?");
    return stmt.get(id) !== undefined;
  }

  async get(id: string): Promise<DevlogEntry | null> {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare("SELECT * FROM devlog_entries WHERE id = ?");
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToDevlogEntry(row);
  }

  async save(entry: DevlogEntry): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO devlog_entries (
        id, title, type, description, status, priority, created_at, updated_at,
        estimated_hours, actual_hours, assignee, tags, files, related_devlogs,
        context, ai_context, external_references, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.title,
      entry.type,
      entry.description,
      entry.status,
      entry.priority,
      entry.createdAt,
      entry.updatedAt,
      entry.estimatedHours,
      entry.actualHours,
      entry.assignee,
      JSON.stringify(entry.tags),
      JSON.stringify(entry.files),
      JSON.stringify(entry.relatedDevlogs),
      JSON.stringify(entry.context),
      JSON.stringify(entry.aiContext),
      JSON.stringify(entry.externalReferences || []),
      JSON.stringify(entry.notes)
    );
  }

  async delete(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare("DELETE FROM devlog_entries WHERE id = ?");
    stmt.run(id);
  }

  async list(filter?: DevlogFilter): Promise<DevlogEntry[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    let query = "SELECT * FROM devlog_entries";
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        conditions.push(`status IN (${filter.status.map(() => '?').join(', ')})`);
        params.push(...filter.status);
      }

      if (filter.type && filter.type.length > 0) {
        conditions.push(`type IN (${filter.type.map(() => '?').join(', ')})`);
        params.push(...filter.type);
      }

      if (filter.priority && filter.priority.length > 0) {
        conditions.push(`priority IN (${filter.priority.map(() => '?').join(', ')})`);
        params.push(...filter.priority);
      }

      if (filter.assignee) {
        conditions.push("assignee = ?");
        params.push(filter.assignee);
      }

      if (filter.fromDate) {
        conditions.push("created_at >= ?");
        params.push(filter.fromDate);
      }

      if (filter.toDate) {
        conditions.push("created_at <= ?");
        params.push(filter.toDate);
      }

      if (filter.tags && filter.tags.length > 0) {
        // Use JSON operations to search tags
        for (const tag of filter.tags) {
          conditions.push("json_extract(tags, '$') LIKE ?");
          params.push(`%"${tag}"%`);
        }
      }
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY updated_at DESC";

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => this.rowToDevlogEntry(row));
  }

  async search(query: string): Promise<DevlogEntry[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare(`
      SELECT devlog_entries.* FROM devlog_entries
      JOIN devlog_fts ON devlog_entries.rowid = devlog_fts.rowid
      WHERE devlog_fts MATCH ?
      ORDER BY rank
    `);
    
    const rows = stmt.all(query) as any[];
    return rows.map(row => this.rowToDevlogEntry(row));
  }

  async getStats(): Promise<DevlogStats> {
    if (!this.db) throw new Error("Database not initialized");
    
    const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM devlog_entries");
    const total = (totalStmt.get() as any).count;

    const statusStmt = this.db.prepare("SELECT status, COUNT(*) as count FROM devlog_entries GROUP BY status");
    const statusRows = statusStmt.all() as any[];
    const byStatus = {} as Record<DevlogStatus, number>;
    statusRows.forEach(row => {
      byStatus[row.status as DevlogStatus] = row.count;
    });

    const typeStmt = this.db.prepare("SELECT type, COUNT(*) as count FROM devlog_entries GROUP BY type");
    const typeRows = typeStmt.all() as any[];
    const byType = {} as Record<DevlogType, number>;
    typeRows.forEach(row => {
      byType[row.type as DevlogType] = row.count;
    });

    const priorityStmt = this.db.prepare("SELECT priority, COUNT(*) as count FROM devlog_entries GROUP BY priority");
    const priorityRows = priorityStmt.all() as any[];
    const byPriority = {} as Record<DevlogPriority, number>;
    priorityRows.forEach(row => {
      byPriority[row.priority as DevlogPriority] = row.count;
    });

    return {
      totalEntries: total,
      byStatus,
      byType,
      byPriority
    };
  }

  async dispose(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  isRemoteStorage(): boolean {
    return false;
  }

  private rowToDevlogEntry(row: any): DevlogEntry {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      description: row.description,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      assignee: row.assignee,
      tags: JSON.parse(row.tags || '[]'),
      files: JSON.parse(row.files || '[]'),
      relatedDevlogs: JSON.parse(row.related_devlogs || '[]'),
      context: JSON.parse(row.context || '{}'),
      aiContext: JSON.parse(row.ai_context || '{}'),
      notes: JSON.parse(row.notes || '[]'),
      externalReferences: JSON.parse(row.external_references || '[]')
    };
  }
}
