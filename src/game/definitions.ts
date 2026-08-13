import type {
  AchievementDef,
  EventDef,
  GeneratorDef,
  LogCategory,
  MetaPerkDef,
  PerkDef,
  UpgradeDef,
} from './types'

/** Cost multiplier applied per unit already owned. */
export const COST_GROWTH = 1.15
/** Production bonus per investor star (+2% each). */
export const STAR_BONUS = 0.02
/** Permanent production bonus per unlocked achievement (+1% each). */
export const ACHIEVEMENT_BONUS = 0.01
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
/** Offline cap with the angel-network perk. */
export const OFFLINE_CAP_EXTENDED_SEC = 24 * 60 * 60
/** Interns granted at the start of each run with the head-start perk. */
export const HEAD_START_INTERNS = 5
/** Generator cost multiplier with the preferred-terms perk. */
export const PREFERRED_TERMS_DISCOUNT = 0.9
/** Time away before the welcome-back dialog is shown. */
export const WELCOME_BACK_MIN_SEC = 60
/** Max desks rendered per generator before collapsing into a "+N" chip. */
export const OFFICE_MAX_DESKS = 60
/** Owning this many of a generator doubles its output (applied per threshold). */
export const MILESTONE_THRESHOLDS = [10, 25, 50]
/** Golden commit spawn gap (random between min and max). */
export const GOLDEN_MIN_GAP_SEC = 90
export const GOLDEN_MAX_GAP_SEC = 240
/** How long a golden commit stays on screen before vanishing. */
export const GOLDEN_LIFETIME_SEC = 12
/** Reward: this many seconds' worth of production... */
export const GOLDEN_PROD_SECONDS = 60
/** ...or this many clicks' worth, whichever is larger (early-game floor). */
export const GOLDEN_CLICK_FLOOR = 100

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
  {
    id: 'principal',
    name: 'Principal Eng',
    glyph: '⌘',
    colorClass: 'text-indigo',
    baseCost: 15_000_000,
    baseProd: 15_000,
  },
]

export const ACHIEVEMENT_DEFS: Array<AchievementDef> = [
  // lifetime LOC milestones
  { id: 'hello', label: 'Hello, World', test: (s) => s.totalLoc >= 100 },
  { id: 'ship', label: 'Ship It', test: (s) => s.totalLoc >= 10_000 },
  { id: 'mvp', label: 'MVP', test: (s) => s.totalLoc >= 100_000 },
  { id: 'pmf', label: 'Product-Market Fit', test: (s) => s.totalLoc >= 1e6 },
  { id: 'scaleup', label: 'Scale-Up', test: (s) => s.totalLoc >= 1e8 },
  { id: 'unicorn', label: 'Unicorn', test: (s) => s.totalLoc >= 1e9 },
  { id: 'decacorn', label: 'Decacorn', test: (s) => s.totalLoc >= 1e10 },
  { id: 'ipo', label: 'IPO', test: (s) => s.totalLoc >= 1e12 },
  // clicking
  { id: 'first-commit', label: 'First Commit', test: (s) => s.totalClicks >= 1 },
  { id: 'keyboard-warrior', label: 'Keyboard Warrior', test: (s) => s.totalClicks >= 100 },
  { id: 'carpal-tunnel', label: 'Carpal Tunnel', test: (s) => s.totalClicks >= 1_000 },
  { id: 'touch-grass', label: 'Touch Grass', test: (s) => s.totalClicks >= 10_000 },
  // hiring
  { id: 'hire1', label: 'First Hire', test: (s) => s.generators.intern.owned >= 1 },
  { id: 'intern-farm', label: 'Intern Farm', test: (s) => s.generators.intern.owned >= 50 },
  {
    id: 'onboarding-buddy',
    label: 'Onboarding Buddy',
    test: (s) => s.generators.junior.owned >= 1,
  },
  { id: 'graybeard', label: 'Graybeard', test: (s) => s.generators.senior.owned >= 1 },
  { id: 'tab-tab-tab', label: 'Tab Tab Tab', test: (s) => s.generators.copilot.owned >= 1 },
  { id: 'always-dns', label: "It's Always DNS", test: (s) => s.generators.devops.owned >= 1 },
  { id: 'middle-mgmt', label: 'Middle Management', test: (s) => s.generators.manager.owned >= 1 },
  {
    id: 'fullteam',
    label: 'Full Stack Team',
    test: (s) => GENERATOR_DEFS.every((g) => s.generators[g.id].owned >= 1),
  },
  {
    id: 'org-chart',
    label: 'Org Chart',
    test: (s) => GENERATOR_DEFS.every((g) => s.generators[g.id].owned >= 10),
  },
  {
    id: 'enterprise',
    label: 'Enterprise Scale',
    test: (s) => GENERATOR_DEFS.every((g) => s.generators[g.id].owned >= 25),
  },
  {
    id: 'open-floor-plan',
    label: 'Open Floor Plan',
    test: (s) => GENERATOR_DEFS.reduce((sum, g) => sum + s.generators[g.id].owned, 0) >= 100,
  },
  // upgrades
  {
    id: 'first-upgrade',
    label: 'Quality of Life',
    test: (s) => Object.values(s.upgrades).some(Boolean),
  },
  {
    id: 'tooling-enthusiast',
    label: 'Tooling Enthusiast',
    test: (s) => Object.values(s.upgrades).filter(Boolean).length >= 8,
  },
  {
    id: 'gold-plated',
    label: 'Gold Plated Everything',
    test: (s) => UPGRADE_DEFS.every((u) => s.upgrades[u.id]),
  },
  // golden commits
  { id: 'lucky-find', label: 'Lucky Find', test: (s) => s.goldenClicks >= 1 },
  { id: 'gold-rush', label: 'Gold Rush', test: (s) => s.goldenClicks >= 10 },
  // prestige & stars
  { id: 'seriesA', label: 'Series A', test: (s) => s.prestigeCount >= 1 },
  { id: 'seriesB', label: 'Series B', test: (s) => s.prestigeCount >= 2 },
  { id: 'seriesC', label: 'Series C', test: (s) => s.prestigeCount >= 3 },
  { id: 'serial-founder', label: 'Serial Founder', test: (s) => s.prestigeCount >= 5 },
  { id: 'star-power', label: 'Star Power', test: (s) => s.stars >= 10 },
  { id: 'constellation', label: 'Constellation', test: (s) => s.stars >= 50 },
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

export const UPGRADE_DEFS: Array<UpgradeDef> = [
  // per-generator doublers, tier 1 (5 owned) and tier 2 (25 owned)
  {
    id: 'ergonomic-chairs',
    name: 'Ergonomic chairs',
    description: 'Interns are twice as effective',
    cost: 500,
    target: 'intern',
    multiplier: 2,
    unlock: { generator: 'intern', owned: 5 },
  },
  {
    id: 'pair-programming',
    name: 'Pair programming',
    description: 'Interns are twice as effective',
    cost: 5_000,
    target: 'intern',
    multiplier: 2,
    unlock: { generator: 'intern', owned: 25 },
  },
  {
    id: 'vim-bindings',
    name: 'Vim bindings',
    description: 'Junior Devs are twice as effective',
    cost: 2_500,
    target: 'junior',
    multiplier: 2,
    unlock: { generator: 'junior', owned: 5 },
  },
  {
    id: 'code-review',
    name: 'Code review culture',
    description: 'Junior Devs are twice as effective',
    cost: 25_000,
    target: 'junior',
    multiplier: 2,
    unlock: { generator: 'junior', owned: 25 },
  },
  {
    id: 'rubber-duck',
    name: 'Rubber duck army',
    description: 'Senior Devs are twice as effective',
    cost: 30_000,
    target: 'senior',
    multiplier: 2,
    unlock: { generator: 'senior', owned: 5 },
  },
  {
    id: 'dark-mode',
    name: 'Dark mode everywhere',
    description: 'Senior Devs are twice as effective',
    cost: 275_000,
    target: 'senior',
    multiplier: 2,
    unlock: { generator: 'senior', owned: 25 },
  },
  {
    id: 'prompt-engineering',
    name: 'Prompt engineering',
    description: 'AI Copilots are twice as effective',
    cost: 300_000,
    target: 'copilot',
    multiplier: 2,
    unlock: { generator: 'copilot', owned: 5 },
  },
  {
    id: 'fine-tuning',
    name: 'Fine-tuned models',
    description: 'AI Copilots are twice as effective',
    cost: 3_000_000,
    target: 'copilot',
    multiplier: 2,
    unlock: { generator: 'copilot', owned: 25 },
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes cluster',
    description: 'DevOps Bots are twice as effective',
    cost: 3_250_000,
    target: 'devops',
    multiplier: 2,
    unlock: { generator: 'devops', owned: 5 },
  },
  {
    id: 'chaos-engineering',
    name: 'Chaos engineering',
    description: 'DevOps Bots are twice as effective',
    cost: 32_500_000,
    target: 'devops',
    multiplier: 2,
    unlock: { generator: 'devops', owned: 25 },
  },
  {
    id: 'one-on-ones',
    name: 'Actually useful 1:1s',
    description: 'Engineering Mgrs are twice as effective',
    cost: 35_000_000,
    target: 'manager',
    multiplier: 2,
    unlock: { generator: 'manager', owned: 5 },
  },
  {
    id: 'reorg',
    name: 'The great reorg',
    description: 'Engineering Mgrs are twice as effective',
    cost: 350_000_000,
    target: 'manager',
    multiplier: 2,
    unlock: { generator: 'manager', owned: 25 },
  },
  // click power
  {
    id: 'mechanical-keyboards',
    name: 'Mechanical keyboards',
    description: 'Clicking writes twice the code',
    cost: 1_000,
    target: 'click',
    multiplier: 2,
    unlock: { totalLoc: 500 },
  },
  {
    id: 'espresso-iv',
    name: 'Espresso IV drip',
    description: 'Clicking writes twice the code',
    cost: 50_000,
    target: 'click',
    multiplier: 2,
    unlock: { totalLoc: 25_000 },
  },
  // global production
  {
    id: 'monorepo',
    name: 'Monorepo migration',
    description: 'All production ×1.5',
    cost: 1_000_000,
    target: 'all',
    multiplier: 1.5,
    unlock: { totalLoc: 500_000 },
  },
  {
    id: 'microservices',
    name: 'Microservices (regret)',
    description: 'All production ×1.5',
    cost: 100_000_000,
    target: 'all',
    multiplier: 1.5,
    unlock: { totalLoc: 50_000_000 },
  },
]

export const PERK_DEFS: Array<PerkDef> = [
  {
    id: 'head-start',
    name: 'Head start',
    description: `Every funding round starts with ${HEAD_START_INTERNS} interns already hired`,
    starCost: 2,
  },
  {
    id: 'angel-network',
    name: 'Angel network',
    description: 'Offline earnings cap raised from 8h to 24h',
    starCost: 3,
  },
  {
    id: 'hype-machine',
    name: 'Hype machine',
    description: 'Random events fire twice as often',
    starCost: 5,
  },
  {
    id: 'crunch-insurance',
    name: 'Crunch insurance',
    description: 'Negative events are half as harmful',
    starCost: 5,
  },
  {
    id: 'golden-fingers',
    name: 'Golden fingers',
    description: 'Click power ×2, permanently',
    starCost: 8,
  },
  {
    id: 'preferred-terms',
    name: 'Preferred terms',
    description: 'All hiring costs reduced by 10%',
    starCost: 10,
  },
]

export const META_PERK_DEFS: Array<MetaPerkDef> = [
  {
    id: 'founding-engineer',
    name: 'Founding Engineer',
    description: 'Start every run with 1 Junior Dev already hired',
    equityCost: 1,
  },
  {
    id: 'rd-department',
    name: 'R&D Department',
    description: 'Unlock a 7th Generator Tier ("Principal Engineer")',
    equityCost: 2,
  },
  {
    id: 'vesting-schedule',
    name: 'Vesting Schedule',
    description: 'Retain 10% of your Stars upon IPO',
    equityCost: 2,
  },
  {
    id: 'board-seat',
    name: 'Board Seat',
    description: 'The Star passive bonus is permanently increased to +3% per Star',
    equityCost: 3,
  },
]

export const COMMIT_LINES: Record<LogCategory, Array<string>> = {
  buy: [
    'fix: hired {n}, forgot onboarding docs',
    'feat: added {n} to the team',
    'chore: {n} joined, immediately opened a PR',
    'feat({n}): scaling the org, one desk at a time',
  ],
  incident: ['incident: {n}'],
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
  upgrade: [
    'perf: installed {u}, everything is faster now',
    'feat: {u} — the team will never be the same',
    'chore: bought {u}, expensed it as infrastructure',
  ],
  perk: ['feat: negotiated {p} into the term sheet', 'docs: board approved {p}, stars well spent'],
  golden: [
    'feat: cherry-picked a golden commit (+{n} LOC)',
    'fix: found treasure in the reflog (+{n} LOC)',
  ],
  ipo: ['chore!: IPO — took the company public', 'feat!: rang the bell at the NYSE'],
  'meta-perk': ['docs: board approved {p} meta-perk', 'feat: exercised equity for {p}'],
}
