import { useEffect } from 'react'
import { useGameStore } from '@/stores/game-store'

/**
 * Rehydrates the persisted save on the client after mount.
 * Hydration is skipped during SSR so server and client render the same
 * fresh-state HTML; the saved game is applied in this effect.
 */
export function useGameHydration(): boolean {
  const hasHydrated = useGameStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!useGameStore.persist.hasHydrated()) void useGameStore.persist.rehydrate()
  }, [])

  return hasHydrated
}
