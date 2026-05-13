import React from 'react'

const WMO_ICON: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫', 51: '🌦', 53: '🌧', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧', 71: '❄️', 73: '❄️', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈', 95: '⛈', 96: '⛈', 99: '⛈',
}

interface WeatherData {
  location: string
  temperature: number
  windspeed: number
  weathercode: number
  description: string
}

export function WeatherWidget({ data }: { data?: WeatherData | null }) {
  if (!data) {
    return (
      <div style={{ color: 'rgba(0,212,255,0.4)', fontSize: 12, padding: 8, fontFamily: 'monospace' }}>
        Fetching weather...
      </div>
    )
  }

  const icon = WMO_ICON[data.weathercode] ?? '🌡'

  return (
    <div style={{ fontFamily: 'monospace', color: '#00d4ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 30, fontWeight: 'bold', lineHeight: 1, textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
            {data.temperature}°C
          </div>
          <div style={{ fontSize: 11, color: 'rgba(0,212,255,0.65)', marginTop: 3, letterSpacing: '0.05em' }}>
            {data.description}
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex', gap: 16, fontSize: 11,
        color: 'rgba(0,212,255,0.5)',
        borderTop: '1px solid rgba(0,212,255,0.12)',
        paddingTop: 8,
        letterSpacing: '0.04em',
      }}>
        <span>💨 {data.windspeed} km/h</span>
        <span>📍 {data.location}</span>
      </div>
    </div>
  )
}
