import React from 'react'
import { JarvisState } from '../../store/jarvisStore'

interface CircularHUDProps {
  state: JarvisState
  size?: number
}

export function CircularHUD({ state, size = 120 }: CircularHUDProps) {
  const center = size / 2
  const isSpeaking = state === 'speaking'
  const isActive = state !== 'idle'

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer static ring */}
        <circle
          cx={center}
          cy={center}
          r={center - 4}
          fill="none"
          stroke="rgba(0,212,255,0.15)"
          strokeWidth="1"
        />

        {/* Outer dashed spinning ring */}
        <circle
          cx={center}
          cy={center}
          r={center - 4}
          fill="none"
          stroke="rgba(0,212,255,0.6)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          filter="url(#glow)"
          style={{
            transformOrigin: `${center}px ${center}px`,
            animation: 'spin-slow 8s linear infinite',
          }}
        />

        {/* Mid ring - reverse spin */}
        <circle
          cx={center}
          cy={center}
          r={center - 14}
          fill="none"
          stroke="rgba(0,212,255,0.4)"
          strokeWidth="1"
          strokeDasharray="4 8"
          style={{
            transformOrigin: `${center}px ${center}px`,
            animation: 'spin-reverse 5s linear infinite',
          }}
        />

        {/* Inner ring */}
        <circle
          cx={center}
          cy={center}
          r={center - 24}
          fill="none"
          stroke="rgba(10,132,255,0.5)"
          strokeWidth="1.5"
          strokeDasharray="12 4"
          style={{
            transformOrigin: `${center}px ${center}px`,
            animation: 'spin-slow 3s linear infinite',
          }}
        />

        {/* Hex center lines */}
        <line
          x1={center - (center - 28)}
          y1={center}
          x2={center + (center - 28)}
          y2={center}
          stroke="rgba(0,212,255,0.2)"
          strokeWidth="0.5"
        />
        <line
          x1={center}
          y1={center - (center - 28)}
          x2={center}
          y2={center + (center - 28)}
          stroke="rgba(0,212,255,0.2)"
          strokeWidth="0.5"
        />

        {/* Core dot */}
        <circle
          cx={center}
          cy={center}
          r={isActive ? 8 : 5}
          fill={isSpeaking ? 'rgba(0,212,255,0.9)' : 'rgba(10,132,255,0.7)'}
          filter="url(#glow)"
          style={{
            transition: 'r 0.3s ease, fill 0.3s ease',
            animation: isSpeaking ? 'pulse-glow 1s ease-in-out infinite' : undefined,
          }}
        />

        {/* Arc indicator based on state */}
        {isActive && (
          <circle
            cx={center}
            cy={center}
            r={center - 9}
            fill="none"
            stroke="rgba(0,212,255,0.8)"
            strokeWidth="2"
            strokeDasharray={`${(center - 9) * Math.PI * 2 * 0.7} 999`}
            style={{
              transformOrigin: `${center}px ${center}px`,
              transform: 'rotate(-90deg)',
              animation: 'spin-slow 2s linear infinite',
            }}
          />
        )}
      </svg>
    </div>
  )
}
