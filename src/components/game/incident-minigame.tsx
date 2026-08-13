import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/game-store'
import { ServerCrash, Terminal } from 'lucide-react'

export function IncidentMinigame() {
  const activeIncident = useGameStore((s) => s.activeIncident)
  const resolveIncident = useGameStore((s) => s.resolveIncident)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const [timeLeft, setTimeLeft] = useState(0)
  const startTime = useRef(0)

  useEffect(() => {
    if (!activeIncident) return
    startTime.current = Date.now()

    let rafId: number
    const updateLoop = () => {
      const now = Date.now()
      const remaining = Math.max(0, activeIncident.expiresAt - now)
      setTimeLeft(remaining)

      if (indicatorRef.current) {
        // speed: cycle every 1.2 seconds (600ms one way, 600ms back)
        const elapsed = now - startTime.current
        const cycle = 1200
        const progress = (elapsed % cycle) / cycle // 0 to 1

        // Triangle wave for linear speed, feels better for timing games
        const pos = progress < 0.5 ? progress * 2 : 2 - progress * 2

        indicatorRef.current.style.transform = `translateX(${pos * 100}%)`
      }

      if (remaining > 0) {
        rafId = requestAnimationFrame(updateLoop)
      }
    }

    rafId = requestAnimationFrame(updateLoop)
    return () => cancelAnimationFrame(rafId)
  }, [activeIncident])

  if (!activeIncident) return null

  const handleDeploy = () => {
    const now = Date.now()
    const elapsed = now - startTime.current
    const cycle = 1200
    const progress = (elapsed % cycle) / cycle
    const pos = progress < 0.5 ? progress * 2 : 2 - progress * 2

    // Safe zone is between 40% and 60% (20% width centered)
    const isSafe = pos >= 0.4 && pos <= 0.6

    resolveIncident(isSafe)
  }

  return (
    <div className="flex h-full flex-col gap-6 rounded-lg border border-red-900/50 bg-red-950/20 p-6 shadow-[inset_0_0_40px_rgba(220,38,38,0.1)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-md bg-red-500/20 text-red-500">
          <ServerCrash className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-red-400">Production Incident!</h2>
          <p className="text-sm text-red-400/80">
            Memory leak detected. Fix it before {(timeLeft / 1000).toFixed(1)}s or servers will
            degrade.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        {/* Minigame Bar */}
        <div className="relative h-12 w-full max-w-md overflow-hidden rounded-full border border-slate-700 bg-slate-900 shadow-inner">
          {/* Safe Zone (40% to 60%) */}
          <div className="absolute left-[40%] h-full w-[20%] bg-emerald-500/20" />
          <div className="absolute left-[40%] h-full w-[20%] border-x border-emerald-500/50" />

          {/* Track container for the indicator */}
          <div className="absolute inset-y-0 left-0 w-full px-3">
            <div className="relative h-full w-full">
              {/* The Moving Indicator Wrapper - Translates from 0% to 100% of the bar width */}
              <div
                ref={indicatorRef}
                className="absolute inset-y-0 left-0 w-full"
                style={{ willChange: 'transform' }}
              >
                {/* The visual indicator itself, offset to center on the 0-100% line */}
                <div className="absolute top-0 bottom-0 left-0 w-2 -ml-1 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleDeploy}
          className="flex w-48 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 font-medium text-white shadow-lg transition-all hover:bg-red-500 active:scale-[0.97]"
        >
          <Terminal className="h-4 w-4" />
          Deploy Hotfix
        </button>
      </div>
    </div>
  )
}
