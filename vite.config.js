import { copyFileSync, cpSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  base: './',
  plugins: [
    {
      name: 'copy-files',
      closeBundle() {
        copyFileSync('CNAME', 'dist/CNAME');
        cpSync('data', 'dist/data', { recursive: true });
      }
    }
  ]
});
