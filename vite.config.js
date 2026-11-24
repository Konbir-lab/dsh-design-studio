import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  root: 'client-src/editor',
  plugins: [vue()],
  build: {
    outDir: '../../lib/doccanvas',
    emptyOutDir: true,
  },
})
