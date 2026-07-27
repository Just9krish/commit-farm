import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDuration, formatNumber } from '@/game/logic'
import { useGameStore } from '@/stores/game-store'

export function WelcomeBackDialog() {
  const welcomeBack = useGameStore((s) => s.welcomeBack)
  const dismissWelcomeBack = useGameStore((s) => s.dismissWelcomeBack)

  return (
    <Dialog
      open={welcomeBack !== null}
      onOpenChange={(open) => {
        if (!open) dismissWelcomeBack()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-mono">{'// welcome back'}</DialogTitle>
          <DialogDescription>
            Your team kept shipping while you were away for{' '}
            {formatDuration(welcomeBack?.awaySec ?? 0)}.
          </DialogDescription>
        </DialogHeader>
        <p className="font-mono text-2xl font-bold text-green tabular-nums">
          +{formatNumber(welcomeBack?.earnedLoc ?? 0)} LOC
        </p>
        <DialogFooter>
          <Button onClick={dismissWelcomeBack} className="font-mono font-bold">
            back to work →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
