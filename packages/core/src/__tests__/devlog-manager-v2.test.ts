import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevlogManager } from '../devlog-manager-v2';
import { CreateDevlogRequest } from '@devlog/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('DevlogManager V2 (Modular Architecture)', () => {
  let manager: DevlogManager;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devlog-test-'));
    manager = new DevlogManager({
      workspaceRoot: testDir
    });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create and retrieve devlog entries', async () => {
    const request: CreateDevlogRequest = {
      title: 'Test Feature',
      type: 'feature',
      description: 'Testing the new modular architecture',
      priority: 'medium'
    };

    // Create devlog
    const entry = await manager.createDevlog(request);
    expect(entry.title).toBe(request.title);
    expect(entry.type).toBe(request.type);
    expect(entry.description).toBe(request.description);
    expect(entry.priority).toBe(request.priority);
    expect(entry.status).toBe('todo');

    // Retrieve devlog
    const retrieved = await manager.getDevlog(entry.id);
    expect(retrieved).toEqual(entry);
  });

  it('should list and filter devlog entries', async () => {
    // Create multiple entries
    const requests: CreateDevlogRequest[] = [
      { title: 'Feature 1', type: 'feature', description: 'First feature', priority: 'high' },
      { title: 'Bug 1', type: 'bugfix', description: 'First bug', priority: 'critical' },
      { title: 'Task 1', type: 'task', description: 'First task', priority: 'low' }
    ];

    for (const request of requests) {
      await manager.createDevlog(request);
    }

    // List all entries
    const allEntries = await manager.listDevlogs();
    expect(allEntries).toHaveLength(3);

    // Filter by type
    const features = await manager.listDevlogs({ type: ['feature'] });
    expect(features).toHaveLength(1);
    expect(features[0].type).toBe('feature');

    // Filter by priority
    const highPriority = await manager.listDevlogs({ priority: ['high', 'critical'] });
    expect(highPriority).toHaveLength(2);
  });

  it('should search devlog entries', async () => {
    const request: CreateDevlogRequest = {
      title: 'Searchable Feature',
      type: 'feature',
      description: 'This is a unique searchable description',
      priority: 'medium'
    };

    await manager.createDevlog(request);

    // Search by title
    const titleResults = await manager.searchDevlogs('Searchable');
    expect(titleResults).toHaveLength(1);

    // Search by description
    const descResults = await manager.searchDevlogs('unique searchable');
    expect(descResults).toHaveLength(1);

    // Search for non-existent term
    const noResults = await manager.searchDevlogs('nonexistent');
    expect(noResults).toHaveLength(0);
  });

  it('should add notes to devlog entries', async () => {
    const request: CreateDevlogRequest = {
      title: 'Note Test Feature',
      type: 'feature',
      description: 'Testing note functionality',
      priority: 'medium'
    };

    const entry = await manager.createDevlog(request);
    
    // Add a note
    const updatedEntry = await manager.addNote(entry.id, {
      category: 'progress',
      content: 'This is a test note'
    });

    expect(updatedEntry.notes).toHaveLength(1);
    expect(updatedEntry.notes[0].content).toBe('This is a test note');
    expect(updatedEntry.notes[0].category).toBe('progress');
  });

  it('should update AI context', async () => {
    const request: CreateDevlogRequest = {
      title: 'AI Context Test',
      type: 'feature',
      description: 'Testing AI context updates',
      priority: 'medium'
    };

    const entry = await manager.createDevlog(request);
    
    // Update AI context
    const updatedEntry = await manager.updateAIContext({
      id: entry.id,
      summary: 'Updated AI summary',
      insights: ['New insight 1', 'New insight 2'],
      questions: ['Question 1?', 'Question 2?'],
      nextSteps: ['Step 1', 'Step 2']
    });

    expect(updatedEntry.aiContext.currentSummary).toBe('Updated AI summary');
    expect(updatedEntry.aiContext.keyInsights).toContain('New insight 1');
    expect(updatedEntry.aiContext.keyInsights).toContain('New insight 2');
    expect(updatedEntry.aiContext.openQuestions).toEqual(['Question 1?', 'Question 2?']);
    expect(updatedEntry.aiContext.suggestedNextSteps).toEqual(['Step 1', 'Step 2']);
  });

  it('should complete devlog entries', async () => {
    const request: CreateDevlogRequest = {
      title: 'Completion Test',
      type: 'task',
      description: 'Testing completion functionality',
      priority: 'medium'
    };

    const entry = await manager.createDevlog(request);
    
    // Complete the devlog
    const completedEntry = await manager.completeDevlog(entry.id, 'Task completed successfully');

    expect(completedEntry.status).toBe('done');
    expect(completedEntry.notes).toHaveLength(1);
    expect(completedEntry.notes[0].content).toBe('Completed: Task completed successfully');
  });

  it('should prevent duplicate entries with findOrCreateDevlog', async () => {
    const request: CreateDevlogRequest = {
      title: 'Duplicate Test',
      type: 'feature',
      description: 'Testing duplicate prevention',
      priority: 'medium'
    };

    // Create first entry
    const result1 = await manager.findOrCreateDevlog(request);
    expect(result1.created).toBe(true);

    // Try to create the same entry again
    const result2 = await manager.findOrCreateDevlog(request);
    expect(result2.created).toBe(false);
    expect(result2.entry.id).toBe(result1.entry.id);
  });

  it('should get statistics', async () => {
    const requests: CreateDevlogRequest[] = [
      { title: 'Feature 1', type: 'feature', description: 'Feature', priority: 'high' },
      { title: 'Feature 2', type: 'feature', description: 'Feature', priority: 'medium' },
      { title: 'Bug 1', type: 'bugfix', description: 'Bug', priority: 'critical' }
    ];

    for (const request of requests) {
      await manager.createDevlog(request);
    }

    const stats = await manager.getStats();
    expect(stats.totalEntries).toBe(3);
    expect(stats.byType.feature).toBe(2);
    expect(stats.byType.bugfix).toBe(1);
    expect(stats.byPriority.high).toBe(1);
    expect(stats.byPriority.medium).toBe(1);
    expect(stats.byPriority.critical).toBe(1);
  });
});
