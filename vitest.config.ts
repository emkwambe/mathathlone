import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const rootDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDirectory,
  resolve: {
    alias: {
      '@': resolve(rootDirectory, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
