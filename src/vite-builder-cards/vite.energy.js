import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/energyGraph.js'),
      output: {
        entryFileNames: 'energy-graph.js',
        format: 'es',
        dir: 'dist'
      }
    }
  }
});