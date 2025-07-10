import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    // Handle dynamic imports better
    deps: {
      external: ['better-sqlite3'],
    },
  },
});
