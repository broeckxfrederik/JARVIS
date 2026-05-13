import React from 'react'

interface InfoSpec {
  content?: string
  title?: string
}

export function InfoWidget({ spec }: { spec: InfoSpec }) {
  return (
    <div style={{
      fontSize: 12,
      lineHeight: 1.65,
      color: 'rgba(0,212,255,0.85)',
      fontFamily: 'monospace',
      letterSpacing: '0.02em',
    }}>
      {spec.content ?? 'No information available.'}
    </div>
  )
}
