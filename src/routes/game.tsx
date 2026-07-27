import { createFileRoute } from '@tanstack/react-router'
import { AchievementsPanel } from '@/components/game/achievements-panel'
import { CodePanel } from '@/components/game/code-panel'
import { CommitLog } from '@/components/game/commit-log'
import { EventBanner } from '@/components/game/event-banner'
import { GameFooter } from '@/components/game/game-footer'
import { GamePanel } from '@/components/game/game-panel'
import { ShopPanel } from '@/components/game/shop-panel'
import { TopBar } from '@/components/game/top-bar'
import { WelcomeBackDialog } from '@/components/game/welcome-back-dialog'
import { useGameHydration } from '@/hooks/use-game-hydration.hook'
import { useGameLoop } from '@/hooks/use-game-loop.hook'
import { useWriteHotkey } from '@/hooks/use-write-hotkey.hook'

export const Route = createFileRoute('/game')({ component: GamePage })

function GamePage() {
  const hasHydrated = useGameHydration()
  useGameLoop(hasHydrated)
  useWriteHotkey(hasHydrated)

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-4 sm:px-5">
      <TopBar />
      <EventBanner />
      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-4">
          <CodePanel />
          <GamePanel title="Commit log">
            <CommitLog />
          </GamePanel>
        </div>
        <div className="flex flex-col gap-4">
          <ShopPanel />
          <GamePanel title="Achievements">
            <AchievementsPanel />
          </GamePanel>
        </div>
      </div>
      <GameFooter />
      <WelcomeBackDialog />
    </div>
  )
}
