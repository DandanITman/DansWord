import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    ...(mode === 'test'
      ? []
      : [
          electron({
            main: {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  rollupOptions: {
                    external: ['dictionary-en', 'dictionary-de', 'dictionary-es', 'dictionary-fr', 'nspell', 'word-extractor'],
                  },
                },
              },
            },
            preload: {
              input: 'electron/preload.ts',
            },
          }),
        ]),
  ],
  server: {
    fs: {
      // Help > What's New imports the repo-root CHANGELOG.md with ?raw, which
      // sits above the Vite root (apps/desktop).
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  resolve: {
    alias: {
      '@officewrite/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@officewrite/openxml': path.resolve(__dirname, '../../packages/openxml/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
  },
}));
