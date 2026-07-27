/**
 * Post-build service worker for TanStack Start.
 * vite-plugin-pwa skips SW generation when the client build has ssr:true,
 * so we generate the worker against dist/client after `vite build`.
 *
 * Run: node scripts/generate-sw.mjs
 */
import { generateSW } from 'workbox-build'

const { count, size, warnings } = await generateSW({
  globDirectory: 'dist/client',
  globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2,webmanifest}'],
  swDest: 'dist/client/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // No static index.html fallback — Start SSR-renders every document.
  navigateFallback: undefined,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    {
      urlPattern: ({ request }) =>
        ['style', 'script', 'worker', 'font', 'image'].includes(request.destination),
      handler: 'CacheFirst',
      options: {
        cacheName: 'assets',
        expiration: {
          maxEntries: 80,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
  ],
})

for (const warning of warnings) console.warn(warning)
console.log(`Generated sw.js — precached ${count} files (${(size / 1024).toFixed(1)} KiB)`)
