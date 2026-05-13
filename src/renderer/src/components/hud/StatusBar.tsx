import React, { useState, useEffect } from 'react'
import { JarvisState, useJarvisStore } from '../../store/jarvisStore'

interface StatusBarProps {
  state: JarvisState
}

const PROVIDER_LABEL: Record<string, string> = {
  claude: 'CLAUDE',
  openai: 'GPT',
  ollama: 'LOCAL',
}

const STATE_CONFIG: Record<JarvisState, { label: string; color: string; animation?: string }> = {
  idle: { label: 'STANDBY', color: 'rgba(0,212,255,0.4)' },
  listening: { label: 'LISTENING', color: '#22c55e', animation: 'pulse-glow 1s ease-in-out infinite' },
  transcribing: { label: 'PROCESSING', color: '#f59e0b', animation: 'spin-slow 1s linear infinite' },
  thinking: { label: 'ANALYZING', color: '#0a84ff', animation: 'pulse-glow 0.8s ease-in-out infinite' },
  speaking: { label: 'SPEAKING', color: '#00d4ff', animation: 'pulse-glow 0.5s ease-in-out infinite' },
}

export function StatusBar({ state }: StatusBarProps) {
  const [time, setTime] = useState(() => new Date())
  const activeProvider = useJarvisStore((s) => s.activeProvider)
  const cfg = STATE_CONFIG[state]

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderTop: '1px solid rgba(0,212,255,0.15)',
        fontSize: '10px',
        letterSpacing: '0.1em',
        color: 'rgba(0,212,255,0.6)',
      }}
    >
      {/* Left: Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}`,
            animation: cfg.animation,
          }}
        />
        <span style={{ color: cfg.color, fontWeight: 'bold' }}>{cfg.label}</span>
      </div>

      {/* Center: Dots for thinking */}
      {state === 'thinking' && <ThinkingDots />}
      {state === 'speaking' && <WaveBars />}

      {/* Right: Active provider + version + time */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {activeProvider && (
          <span
            style={{
              color: activeProvider === 'ollama' ? '#a78bfa' : 'rgba(0,212,255,0.7)',
              border: '1px solid currentColor',
              padding: '0 4px',
              borderRadius: 2,
              fontSize: '9px',
              letterSpacing: '0.12em',
            }}
            title={`Active provider: ${activeProvider}`}
          >
            {PROVIDER_LABEL[activeProvider] ?? activeProvider.toUpperCase()}
          </span>
        )}
        <span>JARVIS v0.1</span>
        <span style={{ color: 'rgba(0,212,255,0.8)' }}>{timeStr}</span>
      </div>
    </div>
  )
}

function ThinkingDots() {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => setDots((d) => (d % 3) + 1), 400)
    return () => clearInterval(timer)
  }, [])

  return (
    <span style={{ color: '#0a84ff', letterSpacing: '0.2em' }}>
      {'•'.repeat(dots)}{'·'.repeat(3 - dots)}
    </span>
  )
}

function WaveBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 12 }}>
      {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: `${h * 100}%`,
            background: '#00d4ff',
            borderRadius: 1,
            animation: `wave ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </div>
  )
}
