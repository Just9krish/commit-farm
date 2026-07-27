# Commit Farm — React TanStack Port: Design

**Date:** 2026-07-27
**Status:** Approved by user
**Source:** `example.html` (working vanilla JS prototype in repo root)

## Overview

Port the "Commit Farm" idle/clicker game from a single-file HTML prototype
(`example.html`) into the existing TanStack Start project, using shadcn/ui
components and Tailwind CSS v4. Keep the dark terminal aesthetic and all
game mechanics, improve interaction polish, and add three quality-of-life
features: offline progress, bulk buying, and sound effects. The site gets a
landing page; the game only runs after the user explicitly starts it.

## Goals

- Faithful mechanics: click-to-earn, 6 generators with exponential costs
  (×1.15 per owned), 200ms production tick, random timed events, prestige
  ("funding rounds" → investor stars, +2% production each, permanent),
  achievements, fake commit log, local autosave.
- Enhanced polish: same visual identity (dark panels, amber accent,
  JetBrains Mono / IBM Plex Sans), but with proper dialogs, toasts,
  and motion done to a high standard.
- Clean, scalable code: adding future content (generators, events,
  achievements) or features (upgrades, settings, cloud sync) must not
  require a rewrite.

## Non-Goals

- No backend, no accounts, no cloud sync (localStorage only).
- No visual redesign away from the terminal aesthetic.
- No component/E2E tests in this iteration (unit tests for game math only).

## Routing

| Route   | Purpose                                                                                                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`     | Landing page. Hero with `COMMIT_FARM` wordmark, tagline, short feature blurb, primary CTA. If a save exists: CTA reads "Continue farming" with a small save summary (lifetime LOC, stars); otherwise "Start farming". Navigates to `/game`. **No game loop runs here.** |
| `/game` | The game. Tick loop, event system, and offline-progress calculation start when this route mounts and stop on unmount.                                                                                                                                                   |

## Architecture

Three layers, so game math is testable without React:

```
src/
  game/
    types.ts          # GameState, GeneratorDef, EventDef, AchievementDef (interfaces)
    definitions.ts    # generators, achievements, events, commit lines — typed constant arrays
    logic.ts          # pure functions, no React/DOM:
                      #   costFor, bulkCost (geometric closed form), maxAffordable,
                      #   productionRate, clickPower, prestigeGain, offlineEarnings,
                      #   formatNumber
  stores/
    game-store.ts     # Zustand store + persist middleware
                      # actions: writeCode, buyGenerator(id, qty), prestige, tick(dt),
                      #   triggerEvent/expireEvent, resetSave, applyOfflineProgress
  hooks/
    use-game-loop.hook.ts  # 200ms tick + random event trigger/expiry;
                           # pauses when document.hidden
  lib/
    sound.ts          # Web Audio synthesized blips (no audio assets);
                      # click, buy, achievement, prestige; persisted mute preference
    utils.ts          # cn() helper (shadcn)
  components/
    ui/               # shadcn primitives (button, dialog, sonner, toggle-group, tooltip)
    game/             # top-bar, event-banner, loc-panel, write-button, office-floor,
                      # prestige-panel, commit-log, shop-panel, generator-row,
                      # achievements-panel, welcome-back-dialog
  routes/
    index.tsx         # landing page
    game.tsx          # game page
```

### State management: Zustand + pure logic module

Chosen over `useReducer`+Context (tick would re-render every consumer) and
a custom engine class + `useSyncExternalStore` (hand-rolls what Zustand
provides). Components subscribe via narrow selectors so the 5×/sec tick
only re-renders what changed:

- LOC counter subscribes to `loc` (changes every tick — expected).
- Each generator row is memoized and subscribes to a **derived**
  `canAfford: boolean`, not raw `loc`, so it re-renders only when
  affordability flips.
- Office floor, achievements, prestige panel subscribe to their own slices.

Game math lives in `src/game/logic.ts` as pure functions; the store calls
them. No game rules live in components.

## Gameplay additions

- **Offline progress:** save carries `lastSavedAt`. On `/game` mount,
  earnings accrue at the current production rate for elapsed time,
  capped at 8 hours. If away > 60 seconds, a welcome-back dialog shows
  earnings. Landing page does not trigger this.
  **Hidden-tab behavior:** the tick loop pauses while `document.hidden`;
  on becoming visible again, the elapsed time flows through the same
  `offlineEarnings` path (same 8h cap, dialog only if > 60s hidden).
- **Buy ×1 / ×10 / max:** toggle group in the shop header. `bulkCost` uses
  the geometric-series closed form; `maxAffordable` inverts it (no loops).
  In max mode, a row's buy button is disabled when `maxAffordable` is 0 and
  its label shows the cost of buying 1.
- **Sound:** synthesized Web Audio blips for click, purchase, achievement,
  prestige. Mute toggle in the footer, persisted with the save. No audio
  files shipped. AudioContext created lazily on first user gesture.

## shadcn + theming

- Initialize shadcn (Tailwind v4, neutral base). Add only used components:
  `button`, `dialog` (reset confirm, welcome back), `sonner` (achievement
  toasts), `toggle-group` (buy quantity), `tooltip`.
- Original palette maps onto shadcn CSS variables via `@theme` in
  `styles.css`: bg `#14171C`, panel `#1B1F26`, border `#2E3540`,
  ink `#E8E6E1`, dim `#8B929D`, amber `#F2A93B` (primary),
  red `#E8735D` (destructive), green `#7FB77E`, blue `#6E9BEF`.
  Dark-only theme.
- Fonts self-hosted via `@fontsource` (JetBrains Mono, IBM Plex Sans) —
  no render-blocking Google Fonts request.

## Motion & polish

- Write-code button: `active:scale-[0.97]`, ~150ms custom ease-out. It is
  pressed constantly, so nothing slower. Spacebar path adds no delay.
- Event banner: enter via `@starting-style` slide/fade, < 250ms, ease-out.
- Achievement toasts: sonner.
- New office desks: pop in from `scale(0.95)` + fade (never from scale 0).
- LOC counter: `tabular-nums`, **no** animation (updates 5×/sec).
- All motion respects `prefers-reduced-motion`.

## Persistence & error handling

- Zustand `persist` → localStorage key `commit-farm-save-v1`, throttled
  (~2s) plus flush on `beforeunload` / `visibilitychange`.
- Save carries a `version` number. Loading merges the save over a fresh
  state so new fields get defaults for existing players; persist `migrate`
  hook available for breaking changes.
- Corrupt/unparseable save → fall back to fresh state, never crash.
- SSR safety: store access and AudioContext are client-only; the game page
  guards against hydration mismatch (persisted state applied after mount).

## Scalability measures

- **Data-driven content:** all lists render from `definitions.ts`; adding a
  generator/event/achievement is a one-entry change.
- **Versioned saves:** see above.
- **Feature-scoped modules:** pure math in `src/game/`, per-feature UI in
  `src/components/game/`, store exposes actions only. Future features are
  new modules/routes, not rewrites.

## Fidelity notes

`example.html` is the source of truth for all game numbers and small
behaviors, including: cost growth ×1.15 per owned, intern click bonus
(+10% per intern), star multiplier (+2% per star), prestige threshold
(1M lifetime LOC, gain = floor(sqrt(totalLoc/1e6))), event chance
(~0.6% per 200ms tick) and durations, 35% chance a click writes a commit
log line, log capped at 40 entries (8 shown), office floor showing at most
60 desks per generator with a "+N" overflow chip, and the initial
"hired you" log line on first load.

## Testing

Vitest (dev dependency) for `src/game/logic.ts`: cost curve, bulk cost,
max affordable, production rate with star/event multipliers, click power,
prestige gain, offline earnings cap, number formatting.

## New dependencies

`zustand`, shadcn-added packages (`sonner`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`, required radix packages),
`@fontsource/jetbrains-mono`, `@fontsource/ibm-plex-sans`, `vitest` (dev).
