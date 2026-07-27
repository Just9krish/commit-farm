import { useEffect } from 'react'
import { formatNumber } from '@/game/logic'
import { useGameStore } from '@/stores/game-store'

const BASE_TITLE = 'Commit Farm'
const UPDATE_MS = 1000

/**
 * Mirrors the LOC counter into the tab title (updated once per second)
 * so progress is visible while the tab is in the background.
 */
export function useDocumentTitle(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) return
    function update() {
      const loc = useGameStore.getState().loc
      document.title = `${formatNumber(loc)} LOC — ${BASE_TITLE}`
    }
    update()
    const timer = setInterval(update, UPDATE_MS)
    return () => {
      clearInterval(timer)
      document.title = BASE_TITLE
    }
  }, [isEnabled])
}
