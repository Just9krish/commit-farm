import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/game-store'

interface Ceremony {
  id: number
  starsGained: number
}

/**
 * Full-screen flash + rising star banner, fired whenever a funding round
 * closes (prestigeCount increments).
 */
export function PrestigeCeremony() {
  const [ceremony, setCeremony] = useState<Ceremony | null>(null)

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.prestigeCount <= prev.prestigeCount) return
      setCeremony({ id: state.prestigeCount, starsGained: state.stars - prev.stars })
    })
  }, [])

  if (!ceremony) return null

  return (
    <div key={ceremony.id} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <div className="absolute inset-0 animate-prestige-flash bg-amber/15" />
      <div
        onAnimationEnd={() => setCeremony(null)}
        className="absolute top-1/2 left-1/2 animate-prestige-stars text-center font-mono"
      >
        <div className="text-4xl font-bold text-amber [text-shadow:0_0_30px_rgb(242_169_59/0.5)]">
          +{ceremony.starsGained} ★
        </div>
        <div className="mt-2 text-sm text-ink-dim">funding round closed</div>
      </div>
    </div>
  )
}
