import { toast } from 'sonner'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  ACHIEVEMENT_DEFS,
  CLICK_LOG_CHANCE,
  COMMIT_LINES,
  EVENT_CHANCE_PER_TICK,
  EVENT_DEFS,
  GENERATOR_DEFS,
  MAX_LOG_ENTRIES,
  MAX_TICK_DELTA_SEC,
  WELCOME_BACK_MIN_SEC,
} from '@/game/definitions'
import {
  bulkCost,
  clickPower,
  freshSave,
  maxAffordable,
  offlineEarnings,
  prestigeGain,
  productionRate,
} from '@/game/logic'
import type {
  ActiveEvent,
  BuyQuantity,
  GameSave,
  GeneratorId,
  LogCategory,
  LogEntry,
} from '@/game/types'
import { playSound } from '@/lib/sound'

const SAVE_KEY = 'commit-farm-save-v1'
const SAVE_THROTTLE_MS = 2000

export interface WelcomeBackInfo {
  earnedLoc: number
  awaySec: number
}

interface GameStore extends GameSave {
  // runtime (not persisted)
  activeEvent: ActiveEvent | null
  log: Array<LogEntry>
  buyQuantity: BuyQuantity
  welcomeBack: WelcomeBackInfo | null
  hasHydrated: boolean
  hasStarted: boolean
  lastTickAt: number
  // actions
  writeCode: () => void
  buyGenerator: (id: GeneratorId) => void
  prestige: () => void
  tick: (nowMs: number) => void
  startSession: () => void
  grantAwayEarnings: (awaySec: number) => void
  dismissWelcomeBack: () => void
  setBuyQuantity: (quantity: BuyQuantity) => void
  toggleMute: () => void
  resetSave: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextLogId = 1

function makeLogEntry(category: LogCategory, replacements?: Record<string, string>): LogEntry {
  const lines = COMMIT_LINES[category]
  let line = lines[Math.floor(Math.random() * lines.length)]
  if (replacements)
    for (const [key, value] of Object.entries(replacements)) line = line.replace(`{${key}}`, value)
  return {
    id: nextLogId++,
    hash: Math.random().toString(16).slice(2, 9),
    line,
  }
}

function appendLog(
  log: Array<LogEntry>,
  category: LogCategory,
  replacements?: Record<string, string>,
): Array<LogEntry> {
  return [makeLogEntry(category, replacements), ...log].slice(0, MAX_LOG_ENTRIES)
}

/**
 * Returns updated achievements/log for any newly unlocked achievements,
 * with a toast and sound as side effects.
 */
function unlockAchievements(
  save: GameSave,
  log: Array<LogEntry>,
  isMuted: boolean,
): { achievements: GameSave['achievements']; log: Array<LogEntry> } {
  let achievements = save.achievements
  let nextLog = log
  for (const def of ACHIEVEMENT_DEFS) {
    if (achievements[def.id] || !def.test({ ...save, achievements })) continue
    achievements = { ...achievements, [def.id]: true }
    nextLog = appendLog(nextLog, 'ach', { a: def.label })
    toast.success(`Achievement unlocked — ${def.label}`)
    if (!isMuted) playSound('achievement')
  }
  return { achievements, log: nextLog }
}

function eventMult(event: ActiveEvent | null, kind: 'prod' | 'click'): number {
  return event?.def.mult[kind] ?? 1
}

/**
 * localStorage wrapper that throttles writes (the store updates 5x/sec)
 * and flushes pending writes when the tab is hidden or closed.
 */
function createThrottledStorage(): StateStorage {
  let pendingValue: string | null = null
  let pendingKey = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    if (timer) clearTimeout(timer)
    timer = null
    if (pendingValue === null) return
    try {
      localStorage.setItem(pendingKey, pendingValue)
    } catch {
      // storage full or unavailable — playing without saves beats crashing
    }
    pendingValue = null
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flush()
    })
  }

  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      pendingKey = name
      pendingValue = value
      timer ??= setTimeout(flush, SAVE_THROTTLE_MS)
    },
    removeItem: (name) => {
      pendingValue = null
      try {
        localStorage.removeItem(name)
      } catch {
        // ignore
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...freshSave(),
      activeEvent: null,
      log: [],
      buyQuantity: '1',
      welcomeBack: null,
      hasHydrated: false,
      hasStarted: false,
      lastTickAt: Date.now(),

      writeCode: () => {
        const s = get()
        const gain = clickPower({
          save: s,
          eventClickMult: eventMult(s.activeEvent, 'click'),
        })
        const save: GameSave = { ...s, loc: s.loc + gain, totalLoc: s.totalLoc + gain }
        let log = s.log
        if (Math.random() < CLICK_LOG_CHANCE) log = appendLog(log, 'click')
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('click')
        set({ loc: save.loc, totalLoc: save.totalLoc, ...unlocked })
      },

      buyGenerator: (id) => {
        const s = get()
        const def = GENERATOR_DEFS.find((g) => g.id === id)
        if (!def) return
        const owned = s.generators[id].owned
        const qty =
          s.buyQuantity === 'max'
            ? maxAffordable({ def, owned, budget: s.loc })
            : Number(s.buyQuantity)
        if (qty < 1) return
        const cost = bulkCost({ def, owned, qty })
        if (s.loc < cost) return
        const generators = { ...s.generators, [id]: { owned: owned + qty } }
        const save: GameSave = { ...s, loc: s.loc - cost, generators }
        const log = appendLog(s.log, 'buy', { n: def.name })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('buy')
        set({ loc: save.loc, generators, ...unlocked })
      },

      prestige: () => {
        const s = get()
        const gain = prestigeGain(s.totalLoc)
        if (gain < 1) return
        const generators = Object.fromEntries(
          GENERATOR_DEFS.map((g) => [g.id, { owned: 0 }]),
        ) as Record<GeneratorId, { owned: number }>
        const save: GameSave = {
          ...s,
          loc: 0,
          stars: s.stars + gain,
          prestigeCount: s.prestigeCount + 1,
          generators,
        }
        const log = appendLog(s.log, 'prestige')
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('prestige')
        set({
          loc: 0,
          stars: save.stars,
          prestigeCount: save.prestigeCount,
          generators,
          ...unlocked,
        })
      },

      tick: (nowMs) => {
        const s = get()
        const dtSec = Math.min((nowMs - s.lastTickAt) / 1000, MAX_TICK_DELTA_SEC)
        if (dtSec <= 0) return

        let activeEvent = s.activeEvent
        let log = s.log
        if (activeEvent && nowMs > activeEvent.endsAt) activeEvent = null
        if (!activeEvent && Math.random() < EVENT_CHANCE_PER_TICK) {
          const def = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)]
          activeEvent = { def, endsAt: nowMs + def.durationSec * 1000 }
          log = appendLog(log, 'event', { e: def.label })
        }

        const gain =
          productionRate({ save: s, eventProdMult: eventMult(activeEvent, 'prod') }) * dtSec
        const save: GameSave = { ...s, loc: s.loc + gain, totalLoc: s.totalLoc + gain }
        const unlocked = unlockAchievements(save, log, s.isMuted)
        set({
          loc: save.loc,
          totalLoc: save.totalLoc,
          lastTickAt: nowMs,
          activeEvent,
          ...unlocked,
        })
      },

      /** Runs once when the game route mounts: offline earnings + first log line. */
      startSession: () => {
        const s = get()
        if (s.hasStarted) return
        const awaySec = (Date.now() - s.lastSavedAt) / 1000
        set({ hasStarted: true, lastTickAt: Date.now() })
        get().grantAwayEarnings(awaySec)
        if (get().log.length === 0)
          set((state) => ({ log: appendLog(state.log, 'buy', { n: 'you' }) }))
      },

      grantAwayEarnings: (awaySec) => {
        const s = get()
        const earned = offlineEarnings({ save: s, elapsedSec: awaySec })
        const showDialog = awaySec > WELCOME_BACK_MIN_SEC && earned > 0
        const save: GameSave = {
          ...s,
          loc: s.loc + earned,
          totalLoc: s.totalLoc + earned,
        }
        const unlocked = unlockAchievements(save, s.log, s.isMuted)
        set({
          loc: save.loc,
          totalLoc: save.totalLoc,
          lastTickAt: Date.now(),
          welcomeBack: showDialog ? { earnedLoc: earned, awaySec } : s.welcomeBack,
          ...unlocked,
        })
      },

      dismissWelcomeBack: () => set({ welcomeBack: null }),
      setBuyQuantity: (quantity) => set({ buyQuantity: quantity }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      resetSave: () =>
        set({
          ...freshSave(),
          activeEvent: null,
          log: [makeLogEntry('buy', { n: 'you' })],
          welcomeBack: null,
          lastTickAt: Date.now(),
        }),
    }),
    {
      name: SAVE_KEY,
      version: 1,
      storage: createJSONStorage(createThrottledStorage),
      skipHydration: true,
      partialize: (s): GameSave => ({
        version: s.version,
        loc: s.loc,
        totalLoc: s.totalLoc,
        stars: s.stars,
        prestigeCount: s.prestigeCount,
        generators: s.generators,
        achievements: s.achievements,
        isMuted: s.isMuted,
        lastSavedAt: Date.now(),
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameSave>
        const fresh = freshSave()
        return {
          ...current,
          ...saved,
          // new generators added in future versions get default entries
          generators: { ...fresh.generators, ...saved.generators },
          achievements: { ...saved.achievements },
        }
      },
    },
  ),
)

useGameStore.persist.onFinishHydration(() => {
  useGameStore.setState({ hasHydrated: true })
})

// -- selectors ---------------------------------------------------------------

export function selectProductionRate(s: GameStore): number {
  return productionRate({ save: s, eventProdMult: eventMult(s.activeEvent, 'prod') })
}

export function selectClickPower(s: GameStore): number {
  return clickPower({ save: s, eventClickMult: eventMult(s.activeEvent, 'click') })
}
