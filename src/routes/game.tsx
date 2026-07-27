import { createFileRoute } from '@tanstack/react-router'
import { AchievementsPanel } from '@/components/game/achievements-panel'
import { CodePanel } from '@/components/game/code-panel'
import { CommitLog } from '@/components/game/commit-log'
import { EventBanner } from '@/components/game/event-banner'
import { GameFooter } from '@/components/game/game-footer'
import { GamePanel } from '@/components/game/game-panel'
import { GoldenCommit } from '@/components/game/golden-commit'
import { PrestigeCeremony } from '@/components/game/prestige-ceremony'
import { ShopPanel } from '@/components/game/shop-panel'
import { StarPerksPanel } from '@/components/game/star-perks-panel'
import { StatsPanel } from '@/components/game/stats-panel'
import { TopBar } from '@/components/game/top-bar'
import { UpgradesPanel } from '@/components/game/upgrades-panel'
import { WelcomeBackDialog } from '@/components/game/welcome-back-dialog'
import { useDocumentTitle } from '@/hooks/use-document-title.hook'
import { useGameHydration } from '@/hooks/use-game-hydration.hook'
import { useGameLoop } from '@/hooks/use-game-loop.hook'
import { useWriteHotkey } from '@/hooks/use-write-hotkey.hook'

export const Route = createFileRoute('/game')({ component: GamePage })

function GamePage() {
  const hasHydrated = useGameHydration()
  useGameLoop(hasHydrated)
  useWriteHotkey(hasHydrated)
  useDocumentTitle(hasHydrated)

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-4 sm:px-5">
      <TopBar />
      <EventBanner />
      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-4">
          <CodePanel />
          <StarPerksPanel />
          <GamePanel title="Commit log">
            <CommitLog />
          </GamePanel>
        </div>
        <div className="flex flex-col gap-4">
          <ShopPanel />
          <UpgradesPanel />
          <AchievementsPanel />
          <StatsPanel />
        </div>
      </div>
      <GameFooter />
      <WelcomeBackDialog />
      <GoldenCommit />
      <PrestigeCeremony />
    </div>
  )
}
