import { Volume2Icon, VolumeXIcon } from 'lucide-react'
import { SettingsDialog } from './settings-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGameStore } from '@/stores/game-store'

export function GameFooter() {
  const isMuted = useGameStore((s) => s.isMuted)
  const toggleMute = useGameStore((s) => s.toggleMute)

  return (
    <footer className="mt-4.5 flex items-center justify-center gap-1.5 text-[11px] text-ink-dim">
      <span>autosaves locally as you play</span>
      <span>·</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="inline-flex items-center transition-colors duration-150 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {isMuted ? <VolumeXIcon className="size-3.5" /> : <Volume2Icon className="size-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>{isMuted ? 'Unmute sounds' : 'Mute sounds'}</TooltipContent>
      </Tooltip>
      <span>·</span>
      <SettingsDialog />
    </footer>
  )
}
