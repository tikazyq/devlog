import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevlogManager } from "../devlog-manager.js";
import { IdManager } from "../utils/id-manager.js";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Integer ID System', () => {
  let manager: DevlogManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devlog-test-'));
    
    manager = new DevlogManager({
      workspaceRoot: tempDir,
      useIntegerIds: true,
      storage: {
        type: 'sqlite',
        filePath: path.join(tempDir, 'test.db')
      }
    });
  });

  afterEach(async () => {
    await manager.dispose();
    // Clean up test directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate integer IDs for new entries', async () => {
    const entry = await manager.findOrCreateDevlog({
      title: 'Test Integer ID Feature',
      type: 'feature',
      description: 'Testing the new integer ID system'
    });

    expect(typeof entry.id).toBe('number');
    expect(entry.id).toBe(1);
  });

  it('should generate sequential integer IDs', async () => {
    const entry1 = await manager.findOrCreateDevlog({
      title: 'First Entry',
      type: 'feature',
      description: 'First test entry'
    });

    const entry2 = await manager.findOrCreateDevlog({
      title: 'Second Entry',
      type: 'bugfix',
      description: 'Second test entry'
    });

    expect(entry1.id).toBe(1);
    expect(entry2.id).toBe(2);
  });

  it('should retrieve entries by integer ID', async () => {
    const created = await manager.findOrCreateDevlog({
      title: 'Test Retrieval',
      type: 'task',
      description: 'Testing ID retrieval'
    });

    const retrieved = await manager.getDevlog(created.id);
    
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(created.id);
    expect(retrieved!.title).toBe('Test Retrieval');
  });

  it('should format integer IDs correctly for display', () => {
    expect(IdManager.formatIdForDisplay(1)).toBe('#1');
    expect(IdManager.formatIdForDisplay(123)).toBe('#123');
    expect(IdManager.formatIdForDisplay('legacy-id')).toBe('legacy-id');
  });

  it('should convert between ID formats correctly', () => {
    // String to ID conversion
    expect(IdManager.stringToId('123')).toBe(123);
    expect(IdManager.stringToId('legacy-id-abc')).toBe('legacy-id-abc');
    
    // ID to string conversion
    expect(IdManager.idToString(123)).toBe('123');
    expect(IdManager.idToString('legacy-id')).toBe('legacy-id');
  });

  it('should work with legacy string IDs when disabled', async () => {
    const legacyManager = new DevlogManager({
      workspaceRoot: tempDir,
      useIntegerIds: false, // Disable integer IDs
      storage: {
        type: 'sqlite',
        filePath: path.join(tempDir, 'legacy.db')
      }
    });

    try {
      const entry = await legacyManager.findOrCreateDevlog({
        title: 'Legacy Test',
        type: 'feature',
        description: 'Testing legacy ID system'
      });

      expect(typeof entry.id).toBe('string');
      expect(entry.id).toMatch(/^legacy-test--[a-f0-9]{8}$/);
    } finally {
      await legacyManager.dispose();
    }
  });
});
