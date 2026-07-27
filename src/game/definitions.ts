import type { AchievementDef, EventDef, GeneratorDef, LogCategory } from './types'

/** Cost multiplier applied per unit already owned. */
export const COST_GROWTH = 1.15
/** Production bonus per investor star (+2% each). */
export const STAR_BONUS = 0.02
/** Click power bonus per intern owned (+10% each). */
export const INTERN_CLICK_BONUS = 0.1
/** Lifetime LOC required for the first funding round. */
export const PRESTIGE_THRESHOLD = 1_000_000
/** Chance per 200ms tick that a random event fires (~every 28s). */
export const EVENT_CHANCE_PER_TICK = 0.006
/** Chance that a manual click writes a commit-log line. */
export const CLICK_LOG_CHANCE = 0.35
export const TICK_MS = 200
/** Production ticks cap their delta so a laggy frame can't jump time. */
export const MAX_TICK_DELTA_SEC = 2
export const MAX_LOG_ENTRIES = 40
export const VISIBLE_LOG_ENTRIES = 8
/** Offline earnings accrue for at most this long. */
export const OFFLINE_CAP_SEC = 8 * 60 * 60
/** Time away before the welcome-back dialog is shown. */
export const WELCOME_BACK_MIN_SEC = 60
/** Max desks rendered per generator before collapsing into a "+N" chip. */
export const OFFICE_MAX_DESKS = 60

export const GENERATOR_DEFS: Array<GeneratorDef> = [
  {
    id: 'intern',
    name: 'Intern',
    glyph: '·',
    colorClass: 'text-ink-dim',
    baseCost: 15,
    baseProd: 0.1,
  },
  {
    id: 'junior',
    name: 'Junior Dev',
    glyph: '○',
    colorClass: 'text-ink',
    baseCost: 100,
    baseProd: 1,
  },
  {
    id: 'senior',
    name: 'Senior Dev',
    glyph: '◆',
    colorClass: 'text-amber',
    baseCost: 1_100,
    baseProd: 8,
  },
  {
    id: 'copilot',
    name: 'AI Copilot',
    glyph: '▲',
    colorClass: 'text-green',
    baseCost: 12_000,
    baseProd: 47,
  },
  {
    id: 'devops',
    name: 'DevOps Bot',
    glyph: '■',
    colorClass: 'text-blue',
    baseCost: 130_000,
    baseProd: 260,
  },
  {
    id: 'manager',
    name: 'Engineering Mgr',
    glyph: '★',
    colorClass: 'text-amber',
    baseCost: 1_400_000,
    baseProd: 1_400,
  },
]

export const ACHIEVEMENT_DEFS: Array<AchievementDef> = [
  { id: 'hello', label: 'Hello, World', test: (s) => s.totalLoc >= 100 },
  { id: 'hire1', label: 'First Hire', test: (s) => s.generators.intern.owned >= 1 },
  { id: 'ship', label: 'Ship It', test: (s) => s.totalLoc >= 10_000 },
  {
    id: 'fullteam',
    label: 'Full Stack Team',
    test: (s) => GENERATOR_DEFS.every((g) => s.generators[g.id].owned >= 1),
  },
  { id: 'seriesA', label: 'Series A', test: (s) => s.prestigeCount >= 1 },
  { id: 'unicorn', label: 'Unicorn', test: (s) => s.totalLoc >= 1e9 },
]

export const EVENT_DEFS: Array<EventDef> = [
  {
    id: 'viral',
    label: 'Show HN post goes viral — production ×3',
    mult: { prod: 3 },
    durationSec: 20,
  },
  {
    id: 'conflict',
    label: 'Merge conflict everywhere — production ×0.7',
    mult: { prod: 0.7 },
    durationSec: 12,
  },
  {
    id: 'hackathon',
    label: 'Hackathon energy — click power ×4',
    mult: { click: 4 },
    durationSec: 20,
  },
  {
    id: 'espresso',
    label: 'Free espresso machine — click power ×2',
    mult: { click: 2 },
    durationSec: 30,
  },
  {
    id: 'oncall',
    label: 'On-call incident — production ×0.8',
    mult: { prod: 0.8 },
    durationSec: 10,
  },
]

export const COMMIT_LINES: Record<LogCategory, Array<string>> = {
  buy: [
    'fix: hired {n}, forgot onboarding docs',
    'feat: added {n} to the team',
    'chore: {n} joined, immediately opened a PR',
    'feat({n}): scaling the org, one desk at a time',
  ],
  click: [
    'fix: typo in prod (again)',
    'feat: shipped a tiny feature',
    'chore: refactored something nobody asked for',
    'fix: it works on my machine',
    'feat: added a console.log and called it debugging',
  ],
  prestige: [
    'chore!: BREAKING — reset for Series funding round',
    'feat!: closed the round, rewriting from scratch',
  ],
  event: ['// event: {e}'],
  ach: ['docs: unlocked achievement — {a}'],
}
