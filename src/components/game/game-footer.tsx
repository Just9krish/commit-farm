import { Volume2Icon, VolumeXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGameStore } from '@/stores/game-store'

export function GameFooter() {
  const isMuted = useGameStore((s) => s.isMuted)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const resetSave = useGameStore((s) => s.resetSave)

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
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="underline underline-offset-2 transition-colors duration-150 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            reset save
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Reset all progress?</DialogTitle>
            <DialogDescription>
              This wipes your LOC, team, investor stars and achievements. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">keep my repo</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={resetSave} className="font-mono">
                rm -rf everything
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
