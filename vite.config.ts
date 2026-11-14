import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Single config drives both `vite build`/`vite` and `vitest`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    passWithNoTests: true,
    testTimeout: 20000,
  },
})
