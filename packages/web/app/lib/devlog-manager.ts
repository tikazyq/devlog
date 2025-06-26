import { DevlogManager, ConfigurationManager } from '@devlog/core';

let devlogManager: DevlogManager | null = null;

export function getDevlogManager(): DevlogManager {
  if (!devlogManager) {
    devlogManager = new DevlogManager({
      workspaceRoot: process.cwd(),
    });
  }
  return devlogManager;
}
