import { Link, createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-mono text-2xl font-bold text-ink">
        404<span className="text-amber">:</span> branch not found
      </h1>
      <p className="text-sm text-ink-dim">this page was force-pushed out of existence.</p>
      <Link to="/" className="font-mono text-sm text-amber underline underline-offset-4">
        git checkout main →
      </Link>
    </main>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
