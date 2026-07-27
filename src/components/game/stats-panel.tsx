import { useShallow } from 'zustand/react/shallow'
import { GamePanel } from './game-panel'
import { formatDuration, formatNumber } from '@/game/logic'
import { useGameStore } from '@/stores/game-store'

export function StatsPanel() {
  const stats = useGameStore(
    useShallow((s) => ({
      lifetimeLoc: formatNumber(s.totalLoc),
      runLoc: formatNumber(s.runLoc),
      bestRunLoc: formatNumber(s.bestRunLoc),
      totalClicks: s.totalClicks.toLocaleString(),
      goldenClicks: s.goldenClicks.toLocaleString(),
      playTime: formatDuration(s.playTimeSec),
      rounds: s.prestigeCount.toLocaleString(),
    })),
  )

  return (
    <GamePanel title="Stats">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <StatItem label="lifetime LOC" value={stats.lifetimeLoc} />
        <StatItem label="this run" value={stats.runLoc} />
        <StatItem label="best run" value={stats.bestRunLoc} />
        <StatItem label="commits typed" value={stats.totalClicks} />
        <StatItem label="golden commits" value={stats.goldenClicks} />
        <StatItem label="time coding" value={stats.playTime} />
        <StatItem label="funding rounds" value={stats.rounds} />
      </dl>
    </GamePanel>
  )
}

interface StatItemProps {
  label: string
  value: string
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/[0.04] pb-1.5">
      <dt className="font-mono text-[11px] text-ink-dim">{label}</dt>
      <dd className="font-mono text-[13px] font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  )
}
