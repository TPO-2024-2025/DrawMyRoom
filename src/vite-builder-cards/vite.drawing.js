import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/drawingCard.js'),
      output: {
        entryFileNames: 'drawing-card.js',
        format: 'es',
        dir: 'dist'
      }
    }
  }
});