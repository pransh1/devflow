import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    globalSetup: './src/tests/globalSetup.ts',  // relative path with ./
    include: ['**/*.test.ts'],                   // simpler glob
    exclude: ['node_modules/**', 'dist/**'],
    sequence: {
      shuffle: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/db/migrations/'],
    },
  },
});