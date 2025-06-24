import { test, expect } from 'vitest';
import { DevlogManager } from '../devlog-manager.js';
import { ConfigurationManager } from '../configuration-manager.js';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

test('DevlogManager uses ~/.devlog folder for SQLite storage', async () => {
  const manager = new DevlogManager();
  
  // Initialize the manager
  await manager.initialize();
  
  // Create a simple devlog entry to verify storage works
  const entry = await manager.findOrCreateDevlog({
    title: 'Test ~/.devlog folder functionality',
    type: 'feature',
    description: 'Testing that the ~/.devlog folder is properly used for storage'
  });
  
  expect(entry).toBeDefined();
  expect(entry.title).toBe('Test ~/.devlog folder functionality');
  
  // Check that ~/.devlog structure was created
  const homeDir = os.homedir();
  const devlogDir = path.join(homeDir, '.devlog');
  const workspacesDir = path.join(devlogDir, 'workspaces');
  
  // Verify directories exist
  await expect(fs.access(devlogDir)).resolves.toBeUndefined();
  await expect(fs.access(workspacesDir)).resolves.toBeUndefined();
  
  // Verify global config exists
  const globalConfigPath = path.join(devlogDir, 'config.json');
  await expect(fs.access(globalConfigPath)).resolves.toBeUndefined();
  
  // Verify a workspace directory was created
  const workspaceDirs = await fs.readdir(workspacesDir);
  expect(workspaceDirs.length).toBeGreaterThan(0);
  
  // Verify the workspace has the expected structure
  const workspaceDir = path.join(workspacesDir, workspaceDirs[0]);
  const dbPath = path.join(workspaceDir, 'devlog.db');
  const metadataPath = path.join(workspaceDir, 'metadata.json');
  const attachmentsDir = path.join(workspaceDir, 'attachments');
  
  await expect(fs.access(dbPath)).resolves.toBeUndefined();
  await expect(fs.access(metadataPath)).resolves.toBeUndefined();
  await expect(fs.access(attachmentsDir)).resolves.toBeUndefined();
  
  // Verify metadata contains expected information
  const metadataContent = await fs.readFile(metadataPath, 'utf-8');
  const metadata = JSON.parse(metadataContent);
  
  expect(metadata.version).toBe('1.0.0');
  expect(metadata.workspaceId).toBe(workspaceDirs[0]);
  expect(metadata.projectPath).toBeDefined();
});

test('ConfigurationManager detects best storage as SQLite with ~/.devlog path', async () => {
  const configManager = new ConfigurationManager();
  
  const storageConfig = await configManager.detectBestStorage();
  
  expect(storageConfig.type).toBe('sqlite');
  expect(storageConfig.filePath).toBeDefined();
  
  // Verify the path is within ~/.devlog/workspaces/
  const homeDir = os.homedir();
  const expectedPrefix = path.join(homeDir, '.devlog', 'workspaces');
  
  expect(storageConfig.filePath!.startsWith(expectedPrefix)).toBe(true);
  expect(storageConfig.filePath!.endsWith('devlog.db')).toBe(true);
});

test('ConfigurationManager creates global structure', async () => {
  const configManager = new ConfigurationManager();
  
  // This should trigger the creation of the global structure
  await configManager.detectBestStorage();
  
  const homeDir = os.homedir();
  const devlogDir = path.join(homeDir, '.devlog');
  
  // Verify all expected directories exist
  const expectedDirs = [
    path.join(devlogDir, 'workspaces'),
    path.join(devlogDir, 'cache'),
    path.join(devlogDir, 'backups'),
    path.join(devlogDir, 'logs')
  ];
  
  for (const dir of expectedDirs) {
    await expect(fs.access(dir)).resolves.toBeUndefined();
  }
  
  // Verify global config file exists
  const globalConfigPath = path.join(devlogDir, 'config.json');
  await expect(fs.access(globalConfigPath)).resolves.toBeUndefined();
  
  const configContent = await fs.readFile(globalConfigPath, 'utf-8');
  const config = JSON.parse(configContent);
  
  expect(config.version).toBe('1.0.0');
  expect(config.defaultStorage).toBe('sqlite');
  expect(config.created).toBeDefined();
});
