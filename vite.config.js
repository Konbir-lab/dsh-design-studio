import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { openPencil } from '@open-pencil/core/node/vite'

const shim = (name) => fileURLToPath(new URL(`./client-src/editor/shims/${name}`, import.meta.url))

export default defineConfig({
  base: './',
  root: 'client-src/editor',
  plugins: [vue(), openPencil()],
  resolve: {
    alias: {
      'node:path': shim('node-path.js'),
      'node:url': shim('node-url.js'),
      'node:process': shim('node-process.js'),
    },
  },
  worker: { format: 'es' },
  build: {
    target: 'esnext',
    outDir: '../../lib/doccanvas-draft',
    emptyOutDir: true,
  },
})
