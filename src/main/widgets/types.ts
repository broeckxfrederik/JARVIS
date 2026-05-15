export type WidgetType = 'weather' | 'map' | 'info' | 'list' | 'custom'

export interface WidgetSpec {
  type: WidgetType
  title: string
  location?: string   // for weather, map
  content?: string    // for info cards — AI-generated text
  items?: string[]    // for list widgets
  description?: string // for custom — describes what HTML to generate
}

export interface WeatherData {
  location: string
  temperature: number
  windspeed: number
  weathercode: number
  description: string
  lat: number
  lon: number
}

export interface WidgetPayload {
  id: string
  spec: WidgetSpec
  data?: WeatherData | { lat: number; lon: number; location: string } | null
  html?: string  // Ollama-generated HTML for custom type
  _version?: number  // monotonic counter used by renderer to discard stale payloads
}
