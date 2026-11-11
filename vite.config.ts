import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Relative base so the app works under the GitHub Pages sub-path
// (https://<user>.github.io/Swole/) as well as locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
