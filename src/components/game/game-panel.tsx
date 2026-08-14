import { cn } from '@/lib/utils'

interface PanelHeadingProps {
  children: React.ReactNode
  className?: string
}

export function PanelHeading({ children, className }: PanelHeadingProps) {
  return (
    <h2
      className={cn(
        'mb-3 font-sans text-xs font-bold tracking-[0.1em] text-ink-dim uppercase',
        className,
      )}
    >
      {children}
    </h2>
  )
}

interface GamePanelProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function GamePanel({ title, children, className }: GamePanelProps) {
  return (
    <section className={cn('rounded-lg border bg-panel p-4 backdrop-blur-md', className)}>
      <PanelHeading>{title}</PanelHeading>
      {children}
    </section>
  )
}
