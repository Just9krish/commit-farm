/**
 * Tiny synthesized sound effects via the Web Audio API — no audio assets.
 * The AudioContext is created lazily on first use (i.e. first user gesture).
 */

export type SoundKind = 'click' | 'buy' | 'achievement' | 'prestige'

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  } catch {
    return null
  }
}

interface ToneOptions {
  frequency: number
  durationSec: number
  delaySec?: number
  type?: OscillatorType
  peakGain?: number
  glideTo?: number
}

function playTone({
  frequency,
  durationSec,
  delaySec = 0,
  type = 'square',
  peakGain = 0.035,
  glideTo,
}: ToneOptions) {
  const ctx = getContext()
  if (!ctx) return
  const start = ctx.currentTime + delaySec
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + durationSec)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + durationSec + 0.02)
}

const SOUNDS: Record<SoundKind, () => void> = {
  click: () => playTone({ frequency: 620, durationSec: 0.05, peakGain: 0.02 }),
  buy: () => {
    playTone({ frequency: 440, durationSec: 0.07 })
    playTone({ frequency: 660, durationSec: 0.09, delaySec: 0.06 })
  },
  achievement: () => {
    playTone({ frequency: 523, durationSec: 0.09, type: 'triangle', peakGain: 0.05 })
    playTone({
      frequency: 659,
      durationSec: 0.09,
      delaySec: 0.08,
      type: 'triangle',
      peakGain: 0.05,
    })
    playTone({
      frequency: 784,
      durationSec: 0.16,
      delaySec: 0.16,
      type: 'triangle',
      peakGain: 0.05,
    })
  },
  prestige: () => {
    playTone({ frequency: 220, durationSec: 0.35, type: 'sawtooth', peakGain: 0.03, glideTo: 880 })
    playTone({ frequency: 880, durationSec: 0.2, delaySec: 0.3, type: 'triangle', peakGain: 0.05 })
  },
}

export function playSound(kind: SoundKind) {
  SOUNDS[kind]()
}
