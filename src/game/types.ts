export type GeneratorId = 'intern' | 'junior' | 'senior' | 'copilot' | 'devops' | 'manager'

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

/** The persisted portion of the game state. */
export interface GameSave {
  version: number
  loc: number
  totalLoc: number
  stars: number
  prestigeCount: number
  generators: Record<GeneratorId, GeneratorState>
  achievements: Record<string, boolean>
  isMuted: boolean
  lastSavedAt: number
}

export interface ActiveEvent {
  def: EventDef
  endsAt: number
}

export type LogCategory = 'buy' | 'click' | 'prestige' | 'event' | 'ach'

export interface LogEntry {
  id: number
  hash: string
  line: string
}

export type BuyQuantity = '1' | '10' | 'max'
