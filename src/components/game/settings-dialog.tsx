import { useState } from 'react'
import { CopyIcon, DownloadIcon, Volume2Icon, VolumeXIcon } from 'lucide-react'
import { toast } from 'sonner'
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
import { useGameStore } from '@/stores/game-store'

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="underline underline-offset-2 transition-colors duration-150 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          settings
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Settings</DialogTitle>
          <DialogDescription>Sound, save backup and the danger zone.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <SoundSection />
          <ExportSection />
          <ImportSection />
          <ResetSection />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-dim uppercase">
      {children}
    </h3>
  )
}

function SoundSection() {
  const isMuted = useGameStore((s) => s.isMuted)
  const toggleMute = useGameStore((s) => s.toggleMute)

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>Sound</SectionHeading>
      <Button variant="outline" onClick={toggleMute} className="w-fit font-mono text-xs">
        {isMuted ? <VolumeXIcon /> : <Volume2Icon />}
        {isMuted ? 'sounds off — click to unmute' : 'sounds on — click to mute'}
      </Button>
    </section>
  )
}

function ExportSection() {
  const exportSave = useGameStore((s) => s.exportSave)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportSave())
      toast.success('Save copied to clipboard')
    } catch {
      toast.error('Clipboard unavailable — try the download instead')
    }
  }

  function handleDownload() {
    const blob = new Blob([exportSave()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `commit-farm-save-${new Date().toISOString().slice(0, 10)}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>Export save</SectionHeading>
      <p className="text-xs text-ink-dim">Back up your progress or move it to another browser.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCopy} className="font-mono text-xs">
          <CopyIcon /> copy
        </Button>
        <Button variant="outline" onClick={handleDownload} className="font-mono text-xs">
          <DownloadIcon /> download
        </Button>
      </div>
    </section>
  )
}

function ImportSection() {
  const importSave = useGameStore((s) => s.importSave)
  const [pasted, setPasted] = useState('')

  function handleImport() {
    const didImport = importSave(pasted)
    if (!didImport) {
      toast.error('That does not look like a Commit Farm save')
      return
    }
    setPasted('')
    toast.success('Save imported — welcome back')
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>Import save</SectionHeading>
      <textarea
        value={pasted}
        onChange={(event) => setPasted(event.target.value)}
        placeholder="paste an exported save (CF1.…)"
        rows={3}
        className="w-full resize-none rounded-md border bg-panel-alt px-2.5 py-2 font-mono text-[11px] text-ink placeholder:text-ink-dim/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      />
      <Button
        variant="outline"
        disabled={pasted.trim() === ''}
        onClick={handleImport}
        className="w-fit font-mono text-xs"
      >
        import — replaces current progress
      </Button>
    </section>
  )
}

function ResetSection() {
  const resetSave = useGameStore((s) => s.resetSave)

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>Danger zone</SectionHeading>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-fit font-mono text-xs">
            reset save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Reset all progress?</DialogTitle>
            <DialogDescription>
              This wipes your LOC, team, investor stars, perks and achievements. It cannot be undone
              — export a backup first.
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
    </section>
  )
}
