import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: "/discipline_os_v5/",
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return /(?:^|[\\/])node_modules[\\/](?:react|react-dom|react-router-dom|zustand|zod)(?:[\\/]|$)/.test(id)
            ? 'vendor'
            : undefined
        },
      },
    },
  },
  test: { environment: 'node', setupFiles: ['./src/test/setup.ts'] },
})
