import React, { useState, useEffect, useRef } from 'react'
import { WeatherWidget } from './WeatherWidget'
import { MapWidget } from './MapWidget'
import { InfoWidget } from './InfoWidget'
import { ListWidget } from './ListWidget'
import { DynamicWidget } from './DynamicWidget'

interface WidgetPayload {
  id: string
  spec: {
    type: string
    title: string
    location?: string
    content?: string
    items?: string[]
    description?: string
  }
  data?: any
  html?: string
}

export function WidgetCanvas() {
  const [widgets, setWidgets] = useState<WidgetPayload[]>([])
  // Monotonic version incremented on each clear; widget:add events carry the
  // version at the time they were dispatched so stale adds are discarded.
  const versionRef = useRef(0)

  useEffect(() => {
    if (!window.jarvis) return

    const cleanClear = window.jarvis.onWidgetClear(() => {
      versionRef.current += 1
      setWidgets([])
    })

    const cleanAdd = window.jarvis.onWidgetAdd((payload: unknown) => {
      const p = payload as WidgetPayload & { _version?: number }
      // Drop widgets from a previous query cycle
      if (p._version !== undefined && p._version !== versionRef.current) return
      setWidgets(prev => [...prev, p])
    })

    return () => {
      cleanAdd()
      cleanClear()
    }
  }, [])

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 8,
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      {widgets.map(widget => (
        <WidgetCard
          key={widget.id}
          widget={widget}
          onClose={() => removeWidget(widget.id)}
        />
      ))}
    </div>
  )
}

function WidgetCard({ widget, onClose }: { widget: WidgetPayload; onClose: () => void }) {
  const { spec, data, html } = widget

  return (
    <div className="hud-panel" style={{
      flexShrink: 0,
      animation: 'fade-in 0.25s ease-out',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        WebkitAppRegion: 'drag' as any,
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#00d4ff' }}>
          ⬡ {spec.title.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'rgba(0,212,255,0.5)',
            cursor: 'pointer', fontSize: 12, padding: '0 2px',
            WebkitAppRegion: 'no-drag' as any,
          }}
        >✕</button>
      </div>

      {/* Card body */}
      <div style={{ padding: spec.type === 'map' ? 0 : 10 }}>
        {spec.type === 'weather' && <WeatherWidget data={data} />}
        {spec.type === 'map' && <MapWidget data={data} />}
        {spec.type === 'info' && <InfoWidget spec={spec} />}
        {spec.type === 'list' && <ListWidget spec={spec} />}
        {spec.type === 'custom' && <DynamicWidget html={html} />}
      </div>
    </div>
  )
}
