import { useEffect, useState } from 'react'

/**
 * Makes Swole work offline: registers the service worker that keeps a copy of
 * the app on the device. Only in the built app, not while developing.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Not available here (for example a private window). The app still works online.
    })
  })
}

type InstallEvent = Event & { prompt: () => Promise<void> }

let saved: InstallEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    saved = event as InstallEvent
    listeners.forEach((listener) => listener())
  })
  window.addEventListener('appinstalled', () => {
    saved = null
    listeners.forEach((listener) => listener())
  })
}

/** Whether the app is running from the home screen already. */
export function isInstalled(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
  )
}

/**
 * A function that opens the browser's own install prompt, or null when the
 * browser does not offer one (iPhones never do; there it is done from the
 * Share menu).
 */
export function useInstall(): (() => void) | null {
  const [, redraw] = useState(0)
  useEffect(() => {
    const listener = () => redraw((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  if (!saved) return null
  const event = saved
  return () => void event.prompt()
}
