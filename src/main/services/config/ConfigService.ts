import Store from 'electron-store'
import { AppConfig, ConfigSchema } from './schema'

function deepMerge(base: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) &&
        typeof result[key] === 'object' && result[key] !== null) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

export class ConfigService {
  private store: Store<AppConfig>

  constructor() {
    const defaults = ConfigSchema.parse({})
    this.store = new Store<AppConfig>({
      defaults,
      name: 'jarvis-config',
    })
  }

  get(): AppConfig {
    // Read each top-level key from store and merge with defaults
    const defaults = ConfigSchema.parse({})
    const result: Partial<AppConfig> = {}
    for (const key of Object.keys(defaults) as Array<keyof AppConfig>) {
      const val = this.store.get(key)
      if (val !== undefined) {
        result[key] = val as AppConfig[typeof key]
      } else {
        result[key] = defaults[key] as AppConfig[typeof key]
      }
    }
    return ConfigSchema.parse(result)
  }

  set(partial: Partial<AppConfig>): void {
    const current = this.get()
    const merged = deepMerge(current, partial)
    for (const [key, value] of Object.entries(merged)) {
      this.store.set(key, value)
    }
  }

  onDidChange(callback: (newConfig: AppConfig) => void): () => void {
    const unsubscribe = this.store.onDidAnyChange(() => {
      callback(this.get())
    })
    return unsubscribe ?? (() => {})
  }
}
