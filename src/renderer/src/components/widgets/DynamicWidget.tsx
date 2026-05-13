import React, { useRef, useEffect } from 'react'

export function DynamicWidget({ html }: { html?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return

    const writeContent = () => {
      const doc = iframe.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }

    if (iframe.contentDocument?.readyState === 'complete') {
      writeContent()
    } else {
      iframe.onload = writeContent
    }
  }, [html])

  if (!html) {
    return (
      <div style={{
        color: 'rgba(0,212,255,0.4)', fontSize: 12,
        padding: 8, fontFamily: 'monospace',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>⟳</span>
        Generating widget with Ollama...
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      title="Dynamic widget"
      style={{ width: '100%', height: 220, border: 'none', display: 'block', background: 'transparent' }}
      sandbox="allow-scripts"
    />
  )
}
