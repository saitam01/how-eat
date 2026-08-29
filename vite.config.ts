/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    // D2: produce a bundle-size treemap only in `--mode analyze` (H6-5 / H7).
    ...(mode === 'analyze'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // D2: vendor split so React + Radix are long-cached and the app chunk stays small.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          radix: [
            '@radix-ui/react-select',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**'],
      // Coverage gates from openspec/config.yaml (strict TDD).
      // Only the three named modules are gated; component coverage is informational.
      thresholds: {
        'src/lib/calculations.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/storage.ts': { statements: 90, branches: 90, lines: 90 },
        'src/lib/url.ts': { statements: 90, branches: 90, lines: 90 },
      },
    },
  },
}));
