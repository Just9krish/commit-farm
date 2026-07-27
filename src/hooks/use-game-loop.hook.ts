import { useEffect } from 'react'
import { TICK_MS } from '@/game/definitions'
import { useGameStore } from '@/stores/game-store'

/**
 * Drives the production tick while the game route is mounted.
 * The loop pauses while the tab is hidden; on return, the hidden time is
 * granted through the offline-earnings path (same 8h cap as a closed tab).
 */
export function useGameLoop(isReady: boolean) {
  useEffect(() => {
    if (!isReady) return

    useGameStore.getState().startSession()

    const intervalId = setInterval(() => {
      if (!document.hidden) useGameStore.getState().tick(Date.now())
    }, TICK_MS)

    let hiddenAt: number | null = null
    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (hiddenAt === null) return
      const awaySec = (Date.now() - hiddenAt) / 1000
      hiddenAt = null
      useGameStore.getState().grantAwayEarnings(awaySec)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [isReady])
}
