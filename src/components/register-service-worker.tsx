import { useEffect } from 'react'

/**
 * Registers the Workbox service worker in production only.
 * The SW is generated post-build into dist/client/sw.js (see scripts/generate-sw.mjs).
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!import.meta.env.PROD) return
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[pwa] service worker registration failed', error)
    })
  }, [])

  return null
}
