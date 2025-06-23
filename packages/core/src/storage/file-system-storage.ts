import * as fs from "fs/promises";
import * as path from "path";
import { DevlogEntry } from "@devlog/types";

export interface DevlogStorage {
  ensureDevlogDir(): Promise<void>;
  loadIndex(): Promise<Record<string, string>>;
  saveIndex(index: Record<string, string>): Promise<void>;
  loadDevlog(id: string): Promise<DevlogEntry | null>;
  saveDevlog(entry: DevlogEntry): Promise<void>;
  deleteDevlogFile(id: string): Promise<void>;
}

export class FileSystemStorage implements DevlogStorage {
  private devlogDir: string;
  private indexFile: string;

  constructor(devlogDir: string) {
    this.devlogDir = devlogDir;
    this.indexFile = path.join(this.devlogDir, "index.json");
  }

  async ensureDevlogDir(): Promise<void> {
    try {
      await fs.access(this.devlogDir);
    } catch {
      await fs.mkdir(this.devlogDir, { recursive: true });
    }
  }

  async loadIndex(): Promise<Record<string, string>> {
    try {
      await this.ensureDevlogDir();
      const data = await fs.readFile(this.indexFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async saveIndex(index: Record<string, string>): Promise<void> {
    await this.ensureDevlogDir();
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
  }

  async loadDevlog(id: string): Promise<DevlogEntry | null> {
    try {
      const index = await this.loadIndex();
      const filename = index[id];
      if (!filename) return null;

      const filePath = path.join(this.devlogDir, filename);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async saveDevlog(entry: DevlogEntry): Promise<void> {
    await this.ensureDevlogDir();
    
    const filename = `${entry.id}.json`;
    const filePath = path.join(this.devlogDir, filename);
    
    // Update the index
    const index = await this.loadIndex();
    index[entry.id] = filename;
    await this.saveIndex(index);
    
    // Save the devlog entry
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  async deleteDevlogFile(id: string): Promise<void> {
    // Remove from index
    const index = await this.loadIndex();
    const filename = index[id];
    delete index[id];
    await this.saveIndex(index);

    // Delete the file
    if (filename) {
      const filePath = path.join(this.devlogDir, filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // File might not exist, continue
      }
    }
  }

  getDevlogDir(): string {
    return this.devlogDir;
  }
}
