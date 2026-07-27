import { useEffect } from 'react'
import { useGameStore } from '@/stores/game-store'

/**
 * Spacebar writes code from anywhere on the game page, unless a button or
 * dialog has focus. Keyboard-initiated: no animation, instant response.
 */
export function useWriteHotkey(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) return

    function onKeyDown(event: KeyboardEvent) {
      // key repeat intentionally allowed — holding space farms clicks,
      // matching the original prototype
      if (event.code !== 'Space') return
      const active = document.activeElement
      if (active instanceof HTMLElement && active.tagName === 'BUTTON') return
      event.preventDefault()
      useGameStore.getState().writeCode()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isEnabled])
}
