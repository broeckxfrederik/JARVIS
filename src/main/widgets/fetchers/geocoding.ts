import axios from 'axios'

export interface GeoResult {
  lat: number
  lon: number
  displayName: string
}

export async function geocode(location: string): Promise<GeoResult | null> {
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: location, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'JARVIS-Desktop/0.1' },
      timeout: 5000,
    })
    if (!data?.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    }
  } catch {
    return null
  }
}
