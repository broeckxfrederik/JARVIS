import React, { useState, useEffect } from 'react'
import { useJarvisStore } from '../../store/jarvisStore'
import { useWakeWord } from '../../hooks/useWakeWord'

const STATE_COLOR: Record<string, string> = {
  idle: 'rgba(0,212,255,0.4)',
  listening: '#22c55e',
  transcribing: '#f59e0b',
  thinking: '#0a84ff',
  speaking: '#00d4ff',
}

export function MiniHUD() {
  const state = useJarvisStore((s) => s.state)
  const decoratorInfo = useJarvisStore((s) => s.decoratorInfo)
  const [time, setTime] = useState(() => new Date())

  // Continuously capture mic audio and forward to main for wake word detection
  useWakeWord()

  // Wire decorator updates from IPC
  useEffect(() => {
    if (typeof window === 'undefined' || !window.jarvis) return
    const cleanup = window.jarvis.onDecoratorUpdate((info) => {
      useJarvisStore.getState().setDecoratorInfo(info)
    })
    return cleanup
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const dotColor = STATE_COLOR[state] ?? STATE_COLOR.idle

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 14px',
        background: 'rgba(2, 10, 20, 0.85)',
        border: '1px solid rgba(0,212,255,0.25)',
        boxShadow: '0 0 15px rgba(0,212,255,0.2), 0 0 30px rgba(10,132,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: 4,
        fontFamily: 'Courier New, Consolas, monospace',
        color: '#00d4ff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,212,255,0.02) 0px, rgba(0,212,255,0.02) 1px, transparent 1px, transparent 2px)',
          pointerEvents: 'none',
        }}
      />

      {/* JARVIS logo */}
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '0.25em',
            color: '#00d4ff',
            textShadow: '0 0 8px rgba(0,212,255,0.6)',
            lineHeight: 1,
          }}
        >
          ⬡ JARVIS
        </div>
        <div
          style={{
            fontSize: '8px',
            color: 'rgba(0,212,255,0.4)',
            letterSpacing: '0.15em',
            marginTop: 2,
          }}
        >
          v0.1 ONLINE
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 40,
          background: 'rgba(0,212,255,0.2)',
          flexShrink: 0,
        }}
      />

      {/* State + App info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* State indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 5px ${dotColor}`,
              flexShrink: 0,
              animation: state !== 'idle' ? 'pulse-glow 1s ease-in-out infinite' : undefined,
            }}
          />
          <span
            style={{
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: dotColor,
              fontWeight: 'bold',
            }}
          >
            {state.toUpperCase()}
          </span>
        </div>

        {/* Active app */}
        {decoratorInfo && (
          <div
            style={{
              fontSize: '9px',
              color: 'rgba(0,212,255,0.5)',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {decoratorInfo.appName}
          </div>
        )}
      </div>

      {/* Time */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          color: 'rgba(0,212,255,0.8)',
          flexShrink: 0,
        }}
      >
        {timeStr}
      </div>
    </div>
  )
}
