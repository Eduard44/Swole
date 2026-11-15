import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Files in public/ that the app needs offline. Built files are added automatically. */
const PUBLIC_FILES = [
  './',
  'manifest.webmanifest',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
]

/**
 * Writes sw.js when the app is built. The service worker keeps a copy of every
 * file of the app on the device, so Swole opens with no connection. Each build
 * gets its own copy; the old one is removed once the new one is ready.
 */
function serviceWorker(): Plugin {
  return {
    name: 'swole-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((file) => file !== 'index.html' && !file.endsWith('.map'))
      const files = [...PUBLIC_FILES, ...built]
      // A short fingerprint of the file list. Built file names change when their contents do.
      let hash = 5381
      for (const char of files.join('|')) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0
      const source = `const CACHE = 'swole-${hash.toString(36)}'
const FILES = ${JSON.stringify(files)}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('swole-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function respond(request) {
  // Match by address only. Servers add a "Vary" header that would otherwise make
  // the saved copy miss for scripts and styles.
  const saved = await caches.match(request, { ignoreSearch: true, ignoreVary: true })
  if (saved) return saved
  try {
    return await fetch(request)
  } catch (error) {
    // Offline and not saved: opening the app still shows the app.
    const page = request.mode === 'navigate' ? await caches.match('./') : undefined
    if (page) return page
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(respond(request))
})
`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// Relative base so the app works under the GitHub Pages sub-path
// (https://<user>.github.io/Swole/) as well as locally.
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  build: {
    // The exercise list is one data file of about 760 kB (150 kB compressed),
    // loaded on its own when first needed. That size is expected.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
  },
})
