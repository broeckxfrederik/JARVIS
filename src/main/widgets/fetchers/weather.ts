import axios from 'axios'
import { WeatherData } from '../types'

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Rain showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm',
}

export async function fetchWeather(lat: number, lon: number, location: string): Promise<WeatherData | null> {
  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat, longitude: lon,
        current_weather: true,
        hourly: 'temperature_2m,relativehumidity_2m',
      },
      timeout: 5000,
    })
    const cw = data.current_weather
    return {
      location,
      temperature: Math.round(cw.temperature),
      windspeed: Math.round(cw.windspeed),
      weathercode: cw.weathercode,
      description: WMO_DESCRIPTIONS[cw.weathercode] ?? 'Unknown',
      lat,
      lon,
    }
  } catch {
    return null
  }
}
