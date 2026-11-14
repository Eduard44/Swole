import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Relative base so the app works under the GitHub Pages sub-path
// (https://<user>.github.io/Swole/) as well as locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // The exercise list is one data file of about 760 kB (150 kB compressed),
    // loaded on its own when first needed. That size is expected.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
  },
})
