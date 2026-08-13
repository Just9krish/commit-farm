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
  GOLDEN_LIFETIME_SEC,
  GOLDEN_MAX_GAP_SEC,
  GOLDEN_MIN_GAP_SEC,
  HEAD_START_INTERNS,
  MAX_LOG_ENTRIES,
  MAX_TICK_DELTA_SEC,
  META_PERK_DEFS,
  PERK_DEFS,
  UPGRADE_DEFS,
  WELCOME_BACK_MIN_SEC,
} from '@/game/definitions'
import {
  bulkCost,
  clickPower,
  costMultiplier,
  effectiveEventMult,
  formatNumber,
  freshSave,
  goldenReward,
  hasMetaPerk,
  hasPerk,
  isUpgradeUnlocked,
  maxAffordable,
  offlineEarnings,
  prestigeGain,
  productionRate,
} from '@/game/logic'
import type {
  ActiveEvent,
  ActiveGolden,
  ActiveIncident,
  BuyQuantity,
  GameSave,
  GeneratorId,
  LogCategory,
  LogEntry,
  MetaPerkId,
  PerkId,
} from '@/game/types'
import { playSound } from '@/lib/sound'

const SAVE_KEY = 'commit-farm-save-v1'
const SAVE_THROTTLE_MS = 2000
const EXPORT_PREFIX = 'CF1.'
const INCIDENT_MIN_GAP_SEC = 600
const INCIDENT_MAX_GAP_SEC = 900
const INCIDENT_LIFETIME_SEC = 15

export interface WelcomeBackInfo {
  earnedLoc: number
  awaySec: number
}

interface GameStore extends GameSave {
  // runtime (not persisted)
  activeEvent: ActiveEvent | null
  golden: ActiveGolden | null
  nextGoldenAt: number
  activeIncident: ActiveIncident | null
  nextIncidentAt: number
  debuffUntil: number | null
  log: Array<LogEntry>
  buyQuantity: BuyQuantity
  welcomeBack: WelcomeBackInfo | null
  hasHydrated: boolean
  hasStarted: boolean
  lastTickAt: number
  // actions
  writeCode: () => void
  buyGenerator: (id: GeneratorId) => void
  buyUpgrade: (id: string) => void
  buyPerk: (id: PerkId) => void
  buyMetaPerk: (id: MetaPerkId) => void
  clickGoldenCommit: () => void
  prestige: () => void
  ipo: () => void
  resolveIncident: (success: boolean) => void
  tick: (nowMs: number) => void
  startSession: () => void
  grantAwayEarnings: (awaySec: number) => void
  dismissWelcomeBack: () => void
  setBuyQuantity: (quantity: BuyQuantity) => void
  toggleMute: () => void
  toggleRefactoring: () => void
  resetSave: () => void
  /** Serializes the persisted save as a portable string. */
  exportSave: () => string
  /** Loads a save exported via exportSave. Returns false when the data is invalid. */
  importSave: (payload: string) => boolean
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
    toast.success(`Achievement unlocked — ${def.label}`, {
      description: '+1% production, forever',
    })
    if (!isMuted) playSound('achievement')
  }
  return { achievements, log: nextLog }
}

/** The persisted slice of the store (used for autosave and export). */
function toSave(s: GameSave): GameSave {
  return {
    version: s.version,
    loc: s.loc,
    totalLoc: s.totalLoc,
    runLoc: s.runLoc,
    bestRunLoc: s.bestRunLoc,
    totalClicks: s.totalClicks,
    goldenClicks: s.goldenClicks,
    playTimeSec: s.playTimeSec,
    stars: s.stars,
    lifetimeStars: s.lifetimeStars,
    prestigeCount: s.prestigeCount,
    techDebt: s.techDebt,
    isRefactoring: s.isRefactoring,
    generators: s.generators,
    achievements: s.achievements,
    upgrades: s.upgrades,
    perks: s.perks,
    metaPerks: s.metaPerks,
    equity: s.equity,
    ipoCount: s.ipoCount,
    isMuted: s.isMuted,
    lastSavedAt: Date.now(),
  }
}

/** Merges a (possibly older) saved snapshot over fresh defaults. */
function mergeSave(saved: Partial<GameSave>): GameSave {
  const fresh = freshSave()
  return {
    ...fresh,
    ...saved,
    // new content added in future versions gets default entries
    generators: { ...fresh.generators, ...saved.generators },
    achievements: { ...saved.achievements },
    upgrades: { ...saved.upgrades },
    perks: { ...saved.perks },
    metaPerks: { ...saved.metaPerks },
  }
}

type GainFields = Pick<GameSave, 'loc' | 'totalLoc' | 'runLoc' | 'bestRunLoc' | 'techDebt'>

/** All LOC gains flow through here so run/lifetime/best-run stats stay in sync. */
function applyGain(s: GameSave, gain: number): GainFields {
  const runLoc = s.runLoc + gain
  return {
    loc: s.loc + gain,
    totalLoc: s.totalLoc + gain,
    runLoc,
    bestRunLoc: Math.max(s.bestRunLoc, runLoc),
    techDebt: s.techDebt + gain * 0.05,
  }
}

function eventMult(
  s: GameSave & { activeEvent: ActiveEvent | null },
  kind: 'prod' | 'click',
): number {
  const rawMult = s.activeEvent?.def.mult[kind] ?? 1
  return effectiveEventMult({ save: s, mult: rawMult })
}

function scheduleNextGolden(nowMs: number): number {
  const gapSec = GOLDEN_MIN_GAP_SEC + Math.random() * (GOLDEN_MAX_GAP_SEC - GOLDEN_MIN_GAP_SEC)
  return nowMs + gapSec * 1000
}

function spawnGolden(nowMs: number): ActiveGolden {
  return {
    hash: Math.random().toString(16).slice(2, 9),
    // keep away from screen edges so it never hides under panels' extremes
    xPct: 15 + Math.random() * 70,
    yPct: 20 + Math.random() * 55,
    expiresAt: nowMs + GOLDEN_LIFETIME_SEC * 1000,
  }
}

function scheduleNextIncident(nowMs: number): number {
  const gapSec =
    INCIDENT_MIN_GAP_SEC + Math.random() * (INCIDENT_MAX_GAP_SEC - INCIDENT_MIN_GAP_SEC)
  return nowMs + gapSec * 1000
}

function spawnIncident(nowMs: number): ActiveIncident {
  return {
    hash: Math.random().toString(16).slice(2, 9),
    expiresAt: nowMs + INCIDENT_LIFETIME_SEC * 1000,
  }
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
      golden: null,
      nextGoldenAt: scheduleNextGolden(Date.now()),
      activeIncident: null,
      nextIncidentAt: scheduleNextIncident(Date.now()),
      debuffUntil: null,
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
          eventClickMult: eventMult(s, 'click'),
        })

        if (s.isRefactoring) {
          const cleared = Math.min(s.techDebt, gain * 2)
          set({ techDebt: s.techDebt - cleared, totalClicks: s.totalClicks + 1 })
          let log = s.log
          if (Math.random() < CLICK_LOG_CHANCE) log = appendLog(log, 'click')
          const unlocked = unlockAchievements(get(), log, s.isMuted)
          if (!s.isMuted) playSound('click')
          set({ ...unlocked })
          return
        }

        const gained = applyGain(s, gain)
        const save: GameSave = { ...s, ...gained, totalClicks: s.totalClicks + 1 }
        let log = s.log
        if (Math.random() < CLICK_LOG_CHANCE) log = appendLog(log, 'click')
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('click')
        set({ ...gained, totalClicks: save.totalClicks, ...unlocked })
      },

      buyGenerator: (id) => {
        const s = get()
        const def = GENERATOR_DEFS.find((g) => g.id === id)
        if (!def) return
        const owned = s.generators[id].owned
        const costMult = costMultiplier(s)
        const qty =
          s.buyQuantity === 'max'
            ? maxAffordable({ def, owned, budget: s.loc, costMult })
            : Number(s.buyQuantity)
        if (qty < 1) return
        const cost = bulkCost({ def, owned, qty, costMult })
        if (s.loc < cost) return
        const generators = { ...s.generators, [id]: { owned: owned + qty } }
        const save: GameSave = { ...s, loc: s.loc - cost, generators }
        const log = appendLog(s.log, 'buy', { n: def.name })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('buy')
        set({ loc: save.loc, generators, ...unlocked })
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = UPGRADE_DEFS.find((u) => u.id === id)
        if (!def || s.upgrades[def.id]) return
        if (s.loc < def.cost || !isUpgradeUnlocked({ save: s, def })) return
        const upgrades = { ...s.upgrades, [def.id]: true }
        const save: GameSave = { ...s, loc: s.loc - def.cost, upgrades }
        const log = appendLog(s.log, 'upgrade', { u: def.name })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('buy')
        set({ loc: save.loc, upgrades, ...unlocked })
      },

      clickGoldenCommit: () => {
        const s = get()
        if (!s.golden) return
        const gain = goldenReward(s)
        const gained = applyGain(s, gain)
        const save: GameSave = { ...s, ...gained, goldenClicks: s.goldenClicks + 1 }
        const log = appendLog(s.log, 'golden', { n: formatNumber(gain) })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        toast.success(`Golden commit! +${formatNumber(gain)} LOC`)
        if (!s.isMuted) playSound('golden')
        set({
          ...gained,
          goldenClicks: save.goldenClicks,
          golden: null,
          nextGoldenAt: scheduleNextGolden(Date.now()),
          ...unlocked,
        })
      },

      buyPerk: (id) => {
        const s = get()
        const def = PERK_DEFS.find((p) => p.id === id)
        if (!def || s.perks[def.id] || s.stars < def.starCost) return
        const perks = { ...s.perks, [def.id]: true }
        const save: GameSave = { ...s, stars: s.stars - def.starCost, perks }
        const log = appendLog(s.log, 'perk', { p: def.name })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('buy')
        set({ stars: save.stars, perks, ...unlocked })
      },

      prestige: () => {
        const s = get()
        const gain = prestigeGain(s.totalLoc, s.lifetimeStars)
        if (gain < 1) return
        const generators = Object.fromEntries(
          GENERATOR_DEFS.map((g) => [
            g.id,
            {
              owned:
                g.id === 'intern' && hasPerk(s, 'head-start')
                  ? HEAD_START_INTERNS
                  : g.id === 'junior' && hasMetaPerk(s, 'founding-engineer')
                    ? 1
                    : 0,
            },
          ]),
        ) as Record<GeneratorId, { owned: number }>
        const save: GameSave = {
          ...s,
          loc: 0,
          runLoc: 0,
          stars: s.stars + gain,
          lifetimeStars: s.lifetimeStars + gain,
          prestigeCount: s.prestigeCount + 1,
          generators,
          // upgrades reset with the run; stars are the permanent progression
          upgrades: {},
        }
        const log = appendLog(s.log, 'prestige')
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('prestige')
        set({
          loc: 0,
          runLoc: 0,
          stars: save.stars,
          lifetimeStars: save.lifetimeStars,
          prestigeCount: save.prestigeCount,
          generators,
          upgrades: {},
          ...unlocked,
        })
      },

      ipo: () => {
        const s = get()
        const equityGain = Math.floor(s.stars / 25)
        if (equityGain < 1) return

        const generators = Object.fromEntries(
          GENERATOR_DEFS.map((g) => [
            g.id,
            {
              owned:
                g.id === 'intern' && hasPerk(s, 'head-start')
                  ? HEAD_START_INTERNS
                  : g.id === 'junior' && hasMetaPerk(s, 'founding-engineer')
                    ? 1
                    : 0,
            },
          ]),
        ) as Record<GeneratorId, { owned: number }>

        const retainedStars = hasMetaPerk(s, 'vesting-schedule') ? Math.floor(s.stars * 0.1) : 0

        const save: GameSave = {
          ...s,
          loc: 0,
          runLoc: 0,
          totalLoc: 0, // Reset for next IPO round
          stars: retainedStars,
          lifetimeStars: 0, // Reset so they can earn stars again from 0 LOC
          equity: s.equity + equityGain,
          ipoCount: s.ipoCount + 1,
          prestigeCount: 0,
          generators,
          upgrades: {},
          perks: {},
        }
        const log = appendLog(s.log, 'ipo')
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('prestige')
        set({
          loc: 0,
          runLoc: 0,
          totalLoc: 0,
          stars: save.stars,
          lifetimeStars: 0,
          equity: save.equity,
          ipoCount: save.ipoCount,
          prestigeCount: 0,
          generators,
          upgrades: {},
          perks: {},
          ...unlocked,
        })
      },

      buyMetaPerk: (id) => {
        const s = get()
        const def = META_PERK_DEFS.find((p) => p.id === id)
        if (!def || s.metaPerks[def.id] || s.equity < def.equityCost) return
        const metaPerks = { ...s.metaPerks, [def.id]: true }
        const save: GameSave = { ...s, equity: s.equity - def.equityCost, metaPerks }
        const log = appendLog(s.log, 'meta-perk', { p: def.name })
        const unlocked = unlockAchievements(save, log, s.isMuted)
        if (!s.isMuted) playSound('buy')
        set({ equity: save.equity, metaPerks, ...unlocked })
      },

      resolveIncident: (success) => {
        const s = get()
        if (!s.activeIncident) return

        let log = s.log
        let gained: GainFields = {
          loc: s.loc,
          totalLoc: s.totalLoc,
          runLoc: s.runLoc,
          bestRunLoc: s.bestRunLoc,
          techDebt: s.techDebt,
        }
        let debuffUntil = s.debuffUntil

        if (success) {
          const gain = Math.floor(productionRate({ save: s }) * 300)
          gained = applyGain(s, gain)
          log = appendLog(log, 'incident', { n: `resolved! +${formatNumber(gain)} LOC` })
          toast.success(`Incident resolved! +${formatNumber(gain)} LOC`)
          if (!s.isMuted) playSound('golden')
        } else {
          debuffUntil = Date.now() + 60000
          log = appendLog(log, 'incident', { n: 'failed - servers degraded' })
          toast.error('Production degraded for 60s!')
          if (!s.isMuted) playSound('buy') // TODO proper error sound
        }

        const save: GameSave = { ...s, ...gained }
        const unlocked = unlockAchievements(save, log, s.isMuted)

        set({
          ...gained,
          debuffUntil,
          activeIncident: null,
          nextIncidentAt: scheduleNextIncident(Date.now()),
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
        const eventChance = EVENT_CHANCE_PER_TICK * (hasPerk(s, 'hype-machine') ? 2 : 1)
        if (!activeEvent && Math.random() < eventChance) {
          const def = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)]
          activeEvent = { def, endsAt: nowMs + def.durationSec * 1000 }
          log = appendLog(log, 'event', { e: def.label })
        }

        let golden = s.golden
        let nextGoldenAt = s.nextGoldenAt
        if (golden && nowMs > golden.expiresAt) {
          golden = null
          nextGoldenAt = scheduleNextGolden(nowMs)
        } else if (!golden && nowMs >= nextGoldenAt) {
          golden = spawnGolden(nowMs)
        }

        let activeIncident = s.activeIncident
        let nextIncidentAt = s.nextIncidentAt
        if (activeIncident && nowMs > activeIncident.expiresAt) {
          get().resolveIncident(false)
          activeIncident = null // state will be updated by resolveIncident, but let's sync local var
          nextIncidentAt = scheduleNextIncident(nowMs)
        } else if (!activeIncident && nowMs >= nextIncidentAt && s.totalLoc > 1000) {
          // Only start incidents if they have some LOC
          activeIncident = spawnIncident(nowMs)
        }

        let debuffUntil = s.debuffUntil
        if (debuffUntil && nowMs >= debuffUntil) {
          debuffUntil = null
        }

        const gain =
          productionRate({
            save: s,
            eventProdMult: eventMult({ ...s, activeEvent }, 'prod'),
          }) * dtSec

        if (s.isRefactoring) {
          const cleared = Math.min(s.techDebt, gain * 2)
          set({
            techDebt: s.techDebt - cleared,
            playTimeSec: s.playTimeSec + dtSec,
            activeEvent,
            golden,
            nextGoldenAt: nextGoldenAt || get().nextGoldenAt,
            activeIncident,
            nextIncidentAt: nextIncidentAt || get().nextIncidentAt,
            debuffUntil: debuffUntil !== undefined ? debuffUntil : get().debuffUntil,
          })
          return
        }

        const gained = applyGain(s, gain)
        const save: GameSave = { ...s, ...gained }
        const unlocked = unlockAchievements(save, log, s.isMuted)
        set({
          ...gained,
          playTimeSec: s.playTimeSec + dtSec,
          lastTickAt: nowMs,
          activeEvent,
          golden,
          nextGoldenAt,
          activeIncident: activeIncident || get().activeIncident,
          nextIncidentAt: nextIncidentAt || get().nextIncidentAt,
          debuffUntil: debuffUntil !== undefined ? debuffUntil : get().debuffUntil,
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
        const gained = applyGain(s, earned)
        const save: GameSave = { ...s, ...gained }
        const unlocked = unlockAchievements(save, s.log, s.isMuted)
        set({
          ...gained,
          lastTickAt: Date.now(),
          welcomeBack: showDialog ? { earnedLoc: earned, awaySec } : s.welcomeBack,
          ...unlocked,
        })
      },

      dismissWelcomeBack: () => set({ welcomeBack: null }),
      setBuyQuantity: (quantity) => set({ buyQuantity: quantity }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      toggleRefactoring: () => set((s) => ({ isRefactoring: !s.isRefactoring })),

      resetSave: () =>
        set({
          ...freshSave(),
          activeEvent: null,
          golden: null,
          nextGoldenAt: scheduleNextGolden(Date.now()),
          activeIncident: null,
          nextIncidentAt: scheduleNextIncident(Date.now()),
          debuffUntil: null,
          log: [makeLogEntry('buy', { n: 'you' })],
          welcomeBack: null,
          lastTickAt: Date.now(),
        }),

      exportSave: () => EXPORT_PREFIX + btoa(JSON.stringify(toSave(get()))),

      importSave: (payload) => {
        const trimmed = payload.trim()
        if (!trimmed.startsWith(EXPORT_PREFIX)) return false
        let parsed: unknown
        try {
          parsed = JSON.parse(atob(trimmed.slice(EXPORT_PREFIX.length)))
        } catch {
          return false
        }
        if (typeof parsed !== 'object' || parsed === null) return false
        const saved = parsed as Partial<GameSave>
        if (typeof saved.totalLoc !== 'number' || typeof saved.version !== 'number') return false
        set({
          ...mergeSave(saved),
          activeEvent: null,
          golden: null,
          nextGoldenAt: scheduleNextGolden(Date.now()),
          activeIncident: null,
          nextIncidentAt: scheduleNextIncident(Date.now()),
          debuffUntil: null,
          welcomeBack: null,
          lastTickAt: Date.now(),
        })
        return true
      },
    }),
    {
      name: SAVE_KEY,
      version: 1,
      storage: createJSONStorage(createThrottledStorage),
      skipHydration: true,
      partialize: (s): GameSave => toSave(s),
      merge: (persisted, current) => ({
        ...current,
        ...mergeSave((persisted ?? {}) as Partial<GameSave>),
      }),
    },
  ),
)

useGameStore.persist.onFinishHydration(() => {
  useGameStore.setState({ hasHydrated: true })
})

// -- selectors ---------------------------------------------------------------

export function selectProductionRate(s: GameStore): number {
  const base = productionRate({ save: s, eventProdMult: eventMult(s, 'prod') })
  if (s.debuffUntil && Date.now() < s.debuffUntil) return base * 0.5
  return base
}

export function selectClickPower(s: GameStore): number {
  return clickPower({ save: s, eventClickMult: eventMult(s, 'click') })
}
