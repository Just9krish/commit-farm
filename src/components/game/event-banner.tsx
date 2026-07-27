import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/game-store'

export function EventBanner() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const [remainingSec, setRemainingSec] = useState(0)

  useEffect(() => {
    if (!activeEvent) return
    function update() {
      if (!activeEvent) return
      setRemainingSec(Math.max(0, Math.ceil((activeEvent.endsAt - Date.now()) / 1000)))
    }
    update()
    const intervalId = setInterval(update, 500)
    return () => clearInterval(intervalId)
  }, [activeEvent])

  if (!activeEvent) return null

  return (
    <div
      role="status"
      className="mb-3.5 animate-rise-in rounded-md border border-amber-dim bg-amber/10 px-3.5 py-2.5 font-mono text-[13px] text-amber"
    >
      {activeEvent.def.label} <span className="tabular-nums">({remainingSec}s)</span>
    </div>
  )
}
