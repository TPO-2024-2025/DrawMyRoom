import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/drawingCard.js', // tko more bit ime
      name: '3DCARD',           // random idk
      formats: ['es'],            // must be 'es' for Home Assistant
      fileName: 'drawing-card'      // output file name: dist/drawing-card.js
    }   
  }
});

