import { defineConfig } from 'vite';

const projectRoot = new URL('./', import.meta.url).pathname;

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  resolve: {
    alias: {
      '@': projectRoot
    }
  }
});
