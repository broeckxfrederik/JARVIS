import { globalShortcut } from 'electron'

export class HotkeyManager {
  private toggleCallback: (() => void) | null = null

  register(toggleCallback: () => void): boolean {
    this.toggleCallback = toggleCallback
    let success = false

    try {
      const r1 = globalShortcut.register('CommandOrControl+Space', () => {
        this.toggleCallback?.()
      })
      if (r1) success = true
    } catch (err) {
      console.error('Failed to register Ctrl+Space:', err)
    }

    try {
      const r2 = globalShortcut.register('CommandOrControl+Shift+J', () => {
        this.toggleCallback?.()
      })
      if (r2) success = success || true
    } catch (err) {
      console.error('Failed to register Ctrl+Shift+J:', err)
    }

    return success
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll()
  }

  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator)
  }
}
