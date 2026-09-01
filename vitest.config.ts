import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**'],
      thresholds: {
        'src/lib/calculations.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/storage.ts': { statements: 90, branches: 90, lines: 90 },
        'src/lib/url.ts': { statements: 90, branches: 90, lines: 90 },
        'src/lib/food-search.ts': { statements: 90, branches: 90, lines: 90 },
        'src/lib/meal-logging.ts': { statements: 90, branches: 90, lines: 90 },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
