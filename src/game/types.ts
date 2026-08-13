export type GeneratorId =
  'intern' | 'junior' | 'senior' | 'copilot' | 'devops' | 'manager' | 'principal'

export interface GeneratorDef {
  id: GeneratorId
  name: string
  glyph: string
  colorClass: string
  baseCost: number
  baseProd: number
}

export interface GeneratorState {
  owned: number
}

export interface EventMultipliers {
  prod?: number
  click?: number
}

export interface EventDef {
  id: string
  label: string
  mult: EventMultipliers
  durationSec: number
}

export interface AchievementDef {
  id: string
  label: string
  test: (save: GameSave) => boolean
}

/** What an upgrade multiplies: one generator's output, all production, or click power. */
export type UpgradeTarget = GeneratorId | 'all' | 'click'

/** Visibility gate: either owning enough of a generator, or lifetime LOC. */
export type UpgradeUnlock = { generator: GeneratorId; owned: number } | { totalLoc: number }

export interface UpgradeDef {
  id: string
  name: string
  description: string
  cost: number
  target: UpgradeTarget
  multiplier: number
  unlock: UpgradeUnlock
}

/**
 * Perks are bought by SPENDING investor stars (reducing the passive boost),
 * and persist across funding rounds.
 */
export type PerkId =
  | 'head-start'
  | 'angel-network'
  | 'hype-machine'
  | 'crunch-insurance'
  | 'golden-fingers'
  | 'preferred-terms'

export interface PerkDef {
  id: PerkId
  name: string
  description: string
  starCost: number
}

/**
 * Meta-Perks are bought by SPENDING Equity (reducing nothing, just costs Equity),
 * and persist across IPOs.
 */
export type MetaPerkId = 'founding-engineer' | 'board-seat' | 'rd-department' | 'vesting-schedule'

export interface MetaPerkDef {
  id: MetaPerkId
  name: string
  description: string
  equityCost: number
}

/** The persisted portion of the game state. */
export interface GameSave {
  version: number
  loc: number
  totalLoc: number
  /** LOC earned in the current run (resets on prestige). */
  runLoc: number
  /** Highest single-run LOC ever reached. */
  bestRunLoc: number
  totalClicks: number
  goldenClicks: number
  /** Active play time in seconds (only counts while the tab is visible). */
  playTimeSec: number
  stars: number
  lifetimeStars: number
  prestigeCount: number
  equity: number
  ipoCount: number
  generators: Record<GeneratorId, GeneratorState>
  achievements: Record<string, boolean>
  upgrades: Record<string, boolean>
  perks: Record<string, boolean>
  metaPerks: Record<string, boolean>
  isMuted: boolean
  lastSavedAt: number
}

export interface ActiveEvent {
  def: EventDef
  endsAt: number
}

/** A golden commit floating on screen, waiting to be clicked. */
export interface ActiveGolden {
  hash: string
  xPct: number
  yPct: number
  expiresAt: number
}

export interface ActiveIncident {
  hash: string
  expiresAt: number
}

export type LogCategory =
  | 'buy'
  | 'click'
  | 'prestige'
  | 'event'
  | 'ach'
  | 'upgrade'
  | 'perk'
  | 'golden'
  | 'ipo'
  | 'meta-perk'
  | 'incident'

export interface LogEntry {
  id: number
  hash: string
  line: string
}

export type BuyQuantity = '1' | '10' | 'max'
