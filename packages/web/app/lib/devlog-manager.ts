// Use dynamic import to avoid ESM/CommonJS conflicts
let devlogManager: any = null;

export async function getDevlogManager() {
  if (!devlogManager) {
    const { DevlogManager } = await import('@devlog/core');
    devlogManager = new DevlogManager({
      workspaceRoot: process.cwd(),
    });
    await devlogManager.initialize();
  }
  return devlogManager;
}
