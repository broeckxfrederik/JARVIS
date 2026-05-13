import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { AppConfig } from '../services/config/schema'
import { WidgetPlanner } from './WidgetPlanner'
import { WidgetGenerator } from './WidgetGenerator'
import { geocode } from './fetchers/geocoding'
import { fetchWeather } from './fetchers/weather'
import { WidgetPayload, WidgetSpec } from './types'

export class WidgetManager {
  private planner: WidgetPlanner
  private generator: WidgetGenerator

  constructor(private canvasWindow: BrowserWindow, private config: AppConfig) {
    this.planner = new WidgetPlanner(config)
    this.generator = new WidgetGenerator(config.ai.ollama.baseUrl, config.ai.ollama.model)
  }

  updateConfig(config: AppConfig) {
    this.config = config
    this.planner = new WidgetPlanner(config)
    this.generator = new WidgetGenerator(config.ai.ollama.baseUrl, config.ai.ollama.model)
  }

  /** Fire-and-forget: plan widgets for a query and stream them to the canvas */
  async processQuery(query: string): Promise<void> {
    log.info('[WidgetManager] Planning widgets for:', query)

    // Clear first — send clear regardless so stale widgets disappear
    if (!this.canvasWindow.isDestroyed()) {
      this.canvasWindow.webContents.send('widget:clear')
    }

    let specs: WidgetSpec[]
    try {
      specs = await this.planner.plan(query)
    } catch (err) {
      log.warn('[WidgetManager] Planning failed:', err)
      if (!this.canvasWindow.isDestroyed()) this.canvasWindow.hide()
      return
    }

    if (specs.length === 0) {
      if (!this.canvasWindow.isDestroyed()) this.canvasWindow.hide()
      return
    }

    // Only show canvas once we know there are widgets to display
    if (!this.canvasWindow.isDestroyed()) this.canvasWindow.show()
    log.info('[WidgetManager] Planned widgets:', specs.map(s => s.type))

    // Process each widget and send to canvas as data becomes available
    for (const spec of specs) {
      this.buildAndSend(spec).catch((err) =>
        log.error('[WidgetManager] Widget build error:', err)
      )
    }
  }

  private async buildAndSend(spec: WidgetSpec): Promise<void> {
    const id = `${spec.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const payload: WidgetPayload = { id, spec }

    if (spec.type === 'weather' && spec.location) {
      const geo = await geocode(spec.location)
      if (geo) {
        const weather = await fetchWeather(geo.lat, geo.lon, spec.location)
        payload.data = weather ?? undefined
      }
    } else if (spec.type === 'map' && spec.location) {
      const geo = await geocode(spec.location)
      if (geo) {
        payload.data = { lat: geo.lat, lon: geo.lon, location: spec.location }
      }
    } else if (spec.type === 'custom') {
      const html = await this.generator.generateHtml(
        spec.title,
        spec.description ?? spec.title
      )
      payload.html = html
    }

    if (!this.canvasWindow.isDestroyed()) {
      this.canvasWindow.webContents.send('widget:add', payload)
    }
  }
}
