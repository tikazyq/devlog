/**
 * SQLite storage provider for local devlog storage
 */
export class SQLiteStorageProvider {
    constructor(filePath, options = {}) {
        this.db = null;
        console.log(`[SQLiteStorage] Creating SQLiteStorageProvider with path: ${filePath}`);
        console.log(`[SQLiteStorage] Constructor options:`, options);
        this.filePath = filePath;
        this.options = options;
    }
    async initialize() {
        console.log(`[SQLiteStorage] Initializing SQLite storage at path: ${this.filePath}`);
        console.log(`[SQLiteStorage] Options:`, this.options);
        // Check if directory exists
        const path = await import('path');
        const fs = await import('fs');
        const dirname = path.dirname(this.filePath);
        console.log(`[SQLiteStorage] Database directory: ${dirname}`);
        try {
            await fs.promises.access(dirname);
            console.log(`[SQLiteStorage] Directory exists: ${dirname}`);
        }
        catch (error) {
            console.log(`[SQLiteStorage] Directory does not exist, creating: ${dirname}`);
            try {
                await fs.promises.mkdir(dirname, { recursive: true });
                console.log(`[SQLiteStorage] Successfully created directory: ${dirname}`);
            }
            catch (mkdirError) {
                console.error(`[SQLiteStorage] Failed to create directory: ${dirname}`, mkdirError);
                throw new Error(`Cannot create database directory: ${dirname} - ${mkdirError.message}`);
            }
        }
        // Dynamic import to make better-sqlite3 optional
        try {
            console.log(`[SQLiteStorage] Attempting to import better-sqlite3...`);
            // Use eval to prevent TypeScript from transforming the import
            const dynamicImport = eval('(specifier) => import(specifier)');
            const sqlite3Module = await dynamicImport("better-sqlite3");
            console.log(`[SQLiteStorage] Successfully imported better-sqlite3`);
            const Database = sqlite3Module.default;
            console.log(`[SQLiteStorage] Creating database instance...`);
            this.db = new Database(this.filePath, this.options);
            console.log(`[SQLiteStorage] Successfully created database instance`);
        }
        catch (error) {
            console.error(`[SQLiteStorage] Failed to initialize SQLite storage:`, error);
            console.error(`[SQLiteStorage] Error type:`, typeof error);
            console.error(`[SQLiteStorage] Error message:`, error.message);
            console.error(`[SQLiteStorage] Error stack:`, error.stack);
            throw new Error("Failed to initialize SQLite storage: " + error.message);
        }
        // Create tables
        console.log(`[SQLiteStorage] Creating database tables...`);
        try {
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
            console.log(`[SQLiteStorage] Successfully created database tables and indexes`);
        }
        catch (tableError) {
            console.error(`[SQLiteStorage] Failed to create database tables:`, tableError);
            throw new Error(`Failed to create database tables: ${tableError.message}`);
        }
        console.log(`[SQLiteStorage] Initialization completed successfully`);
    }
    async exists(id) {
        console.log(`[SQLiteStorage] Checking if entry exists: ${id}`);
        if (!this.db) {
            console.error(`[SQLiteStorage] Database not initialized when checking exists for: ${id}`);
            throw new Error("Database not initialized");
        }
        try {
            const stmt = this.db.prepare("SELECT 1 FROM devlog_entries WHERE id = ?");
            const result = stmt.get(id) !== undefined;
            console.log(`[SQLiteStorage] Entry exists result for ${id}: ${result}`);
            return result;
        }
        catch (error) {
            console.error(`[SQLiteStorage] Error checking if entry exists:`, error);
            throw error;
        }
    }
    async get(id) {
        console.log(`[SQLiteStorage] Getting entry: ${id}`);
        if (!this.db) {
            console.error(`[SQLiteStorage] Database not initialized when getting: ${id}`);
            throw new Error("Database not initialized");
        }
        try {
            const stmt = this.db.prepare("SELECT * FROM devlog_entries WHERE id = ?");
            const row = stmt.get(id);
            if (!row) {
                console.log(`[SQLiteStorage] Entry not found: ${id}`);
                return null;
            }
            console.log(`[SQLiteStorage] Found entry: ${id}`);
            return this.rowToDevlogEntry(row);
        }
        catch (error) {
            console.error(`[SQLiteStorage] Error getting entry:`, error);
            throw error;
        }
    }
    async save(entry) {
        console.log(`[SQLiteStorage] Saving entry: ${entry.id} - ${entry.title}`);
        if (!this.db) {
            console.error(`[SQLiteStorage] Database not initialized when saving: ${entry.id}`);
            throw new Error("Database not initialized");
        }
        try {
            const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO devlog_entries (
          id, title, type, description, status, priority, created_at, updated_at,
          estimated_hours, actual_hours, assignee, tags, files, related_devlogs,
          context, ai_context, external_references, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(entry.id, entry.title, entry.type, entry.description, entry.status, entry.priority, entry.createdAt, entry.updatedAt, entry.estimatedHours, entry.actualHours, entry.assignee, JSON.stringify(entry.tags), JSON.stringify(entry.files), JSON.stringify(entry.relatedDevlogs), JSON.stringify(entry.context), JSON.stringify(entry.aiContext), JSON.stringify(entry.externalReferences || []), JSON.stringify(entry.notes));
            console.log(`[SQLiteStorage] Successfully saved entry: ${entry.id}`);
        }
        catch (error) {
            console.error(`[SQLiteStorage] Error saving entry:`, error);
            throw error;
        }
    }
    async delete(id) {
        if (!this.db)
            throw new Error("Database not initialized");
        const stmt = this.db.prepare("DELETE FROM devlog_entries WHERE id = ?");
        stmt.run(id);
    }
    async list(filter) {
        if (!this.db)
            throw new Error("Database not initialized");
        let query = "SELECT * FROM devlog_entries";
        const conditions = [];
        const params = [];
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
        const rows = stmt.all(...params);
        return rows.map(row => this.rowToDevlogEntry(row));
    }
    async search(query) {
        if (!this.db)
            throw new Error("Database not initialized");
        const stmt = this.db.prepare(`
      SELECT devlog_entries.* FROM devlog_entries
      JOIN devlog_fts ON devlog_entries.rowid = devlog_fts.rowid
      WHERE devlog_fts MATCH ?
      ORDER BY rank
    `);
        const rows = stmt.all(query);
        return rows.map(row => this.rowToDevlogEntry(row));
    }
    async getStats() {
        if (!this.db)
            throw new Error("Database not initialized");
        const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM devlog_entries");
        const total = totalStmt.get().count;
        const statusStmt = this.db.prepare("SELECT status, COUNT(*) as count FROM devlog_entries GROUP BY status");
        const statusRows = statusStmt.all();
        const byStatus = {};
        statusRows.forEach(row => {
            byStatus[row.status] = row.count;
        });
        const typeStmt = this.db.prepare("SELECT type, COUNT(*) as count FROM devlog_entries GROUP BY type");
        const typeRows = typeStmt.all();
        const byType = {};
        typeRows.forEach(row => {
            byType[row.type] = row.count;
        });
        const priorityStmt = this.db.prepare("SELECT priority, COUNT(*) as count FROM devlog_entries GROUP BY priority");
        const priorityRows = priorityStmt.all();
        const byPriority = {};
        priorityRows.forEach(row => {
            byPriority[row.priority] = row.count;
        });
        return {
            totalEntries: total,
            byStatus,
            byType,
            byPriority
        };
    }
    async dispose() {
        console.log(`[SQLiteStorage] Disposing database connection`);
        if (this.db) {
            try {
                this.db.close();
                console.log(`[SQLiteStorage] Database connection closed successfully`);
            }
            catch (error) {
                console.error(`[SQLiteStorage] Error closing database:`, error);
            }
            this.db = null;
        }
        else {
            console.log(`[SQLiteStorage] No database connection to dispose`);
        }
    }
    isRemoteStorage() {
        return false;
    }
    rowToDevlogEntry(row) {
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
