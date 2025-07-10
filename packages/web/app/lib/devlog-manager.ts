import { DevlogManager } from '@devlog/core';

let devlogManager: DevlogManager | null = null;

export async function getDevlogManager(): Promise<DevlogManager> {
  if (!devlogManager) {
    const { DevlogManager } = await import('@devlog/core');
    devlogManager = new DevlogManager();
    await devlogManager.initialize();
  }
  return devlogManager;
}
