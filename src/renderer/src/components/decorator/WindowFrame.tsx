import React from 'react'

interface WindowFrameProps {
  appName: string
  title: string
}

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

function CornerBracket({ position }: { position: CornerPosition }) {
  const size = 20
  const thickness = 2
  const color = 'rgba(0, 212, 255, 0.85)'
  const borderStyle = `${thickness}px solid ${color}`

  const posStyles: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    ...(position.includes('top') ? { top: 2 } : { bottom: 2 }),
    ...(position.includes('left') ? { left: 2 } : { right: 2 }),
    borderTop: position.includes('top') ? borderStyle : 'none',
    borderBottom: position.includes('bottom') ? borderStyle : 'none',
    borderLeft: position.includes('left') ? borderStyle : 'none',
    borderRight: position.includes('right') ? borderStyle : 'none',
    filter: 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.7))',
  }

  return <div style={posStyles} />
}

export function WindowFrame({ appName, title }: WindowFrameProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Glowing border */}
      <div
        style={{
          position: 'absolute',
          inset: '2px',
          border: '1px solid rgba(0, 212, 255, 0.45)',
          boxShadow:
            '0 0 8px rgba(0, 212, 255, 0.3), inset 0 0 8px rgba(0, 212, 255, 0.08), 0 0 20px rgba(10, 132, 255, 0.15)',
          borderRadius: '2px',
        }}
      />

      {/* Corner brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Top edge accent line */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 30,
          right: 30,
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(0,212,255,0.6) 20%, rgba(0,212,255,0.6) 80%, transparent)',
          boxShadow: '0 0 6px rgba(0,212,255,0.4)',
        }}
      />

      {/* Bottom edge accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: 30,
          right: 30,
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(0,212,255,0.3) 20%, rgba(0,212,255,0.3) 80%, transparent)',
        }}
      />

      {/* App name badge (top-left) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 26,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            background: 'rgba(2, 10, 20, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            padding: '2px 10px',
            fontSize: '10px',
            color: '#00d4ff',
            fontFamily: 'Courier New, Consolas, monospace',
            letterSpacing: '0.12em',
            boxShadow: '0 0 8px rgba(0,212,255,0.2)',
          }}
        >
          ⬡ {appName.toUpperCase()}
        </div>
      </div>

      {/* Title badge (top-right) */}
      {title && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 26,
            maxWidth: 300,
          }}
        >
          <div
            style={{
              background: 'rgba(2, 10, 20, 0.85)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              padding: '2px 8px',
              fontSize: '9px',
              color: 'rgba(0, 212, 255, 0.6)',
              fontFamily: 'Courier New, Consolas, monospace',
              letterSpacing: '0.06em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* JARVIS badge (bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 26,
        }}
      >
        <div
          style={{
            background: 'rgba(2, 10, 20, 0.8)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            padding: '1px 7px',
            fontSize: '8px',
            color: 'rgba(0, 212, 255, 0.4)',
            fontFamily: 'Courier New, Consolas, monospace',
            letterSpacing: '0.15em',
          }}
        >
          JARVIS
        </div>
      </div>

      {/* Scanlines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,212,255,0.012) 0px, rgba(0,212,255,0.012) 1px, transparent 1px, transparent 2px)',
        }}
      />
    </div>
  )
}
