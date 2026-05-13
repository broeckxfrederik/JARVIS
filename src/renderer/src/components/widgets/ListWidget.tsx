import React from 'react'

interface ListSpec {
  items?: string[]
}

export function ListWidget({ spec }: { spec: ListSpec }) {
  const items = spec.items ?? []

  if (items.length === 0) {
    return <div style={{ color: 'rgba(0,212,255,0.4)', fontSize: 12, fontFamily: 'monospace' }}>No items.</div>
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontFamily: 'monospace' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          fontSize: 12, lineHeight: 1.6, color: 'rgba(0,212,255,0.85)',
          paddingBottom: i < items.length - 1 ? 4 : 0,
        }}>
          <span style={{ color: '#00d4ff', flexShrink: 0, marginTop: 1 }}>▶</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
