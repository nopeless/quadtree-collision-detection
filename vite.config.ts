import { defineConfig } from 'vite';

export default defineConfig({
  base: '/quadtree-collision-detection/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  clearScreen: false,
});
