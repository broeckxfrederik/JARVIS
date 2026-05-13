import React from 'react'

interface MapData {
  lat: number
  lon: number
  location: string
}

export function MapWidget({ data }: { data?: MapData | null }) {
  if (!data) {
    return (
      <div style={{ color: 'rgba(0,212,255,0.4)', fontSize: 12, padding: 10, fontFamily: 'monospace' }}>
        Loading map...
      </div>
    )
  }

  const { lat, lon, location } = data
  const delta = 0.05
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`

  return (
    <iframe
      src={src}
      title={`Map of ${location}`}
      style={{
        width: '100%',
        height: 200,
        border: 'none',
        display: 'block',
        // Invert + hue-rotate transforms OSM light tiles into a dark cyan JARVIS look
        filter: 'invert(0.92) hue-rotate(180deg) saturate(0.6) brightness(0.9)',
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  )
}
