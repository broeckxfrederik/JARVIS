import Store from 'electron-store'
import { AppConfig, ConfigSchema } from './schema'

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
    for (const [key, value] of Object.entries(partial)) {
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
