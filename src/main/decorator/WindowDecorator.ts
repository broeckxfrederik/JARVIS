import { BrowserWindow } from 'electron'

export class WindowDecorator {
  private decoratorWin: BrowserWindow
  private pollInterval: NodeJS.Timeout | null = null
  private lastBoundsKey = ''
  private enabled = true

  constructor(decoratorWin: BrowserWindow) {
    this.decoratorWin = decoratorWin
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.decoratorWin.hide()
    }
  }

  start(): void {
    this.pollInterval = setInterval(() => this.poll(), 200)
  }

  private async poll(): Promise<void> {
    if (!this.enabled) return

    try {
      const activeWin = await import('active-win')
      const win = await activeWin.default()

      if (!win) {
        if (this.decoratorWin.isVisible()) {
          this.decoratorWin.hide()
        }
        return
      }

      const ownerName = win.owner?.name?.toLowerCase() ?? ''
      if (
        ownerName.includes('jarvis') ||
        ownerName.includes('electron') ||
        ownerName === ''
      ) {
        return
      }

      const bounds = win.bounds as { x: number; y: number; width: number; height: number }
      const boundsKey = JSON.stringify(bounds)

      if (boundsKey !== this.lastBoundsKey) {
        this.lastBoundsKey = boundsKey
        if (
          bounds.width > 0 &&
          bounds.height > 0
        ) {
          this.decoratorWin.setBounds(
            {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
            false
          )
        }
      }

      if (!this.decoratorWin.isVisible()) {
        this.decoratorWin.show()
      }

      this.decoratorWin.webContents.send('decorator:update', {
        appName: win.owner?.name ?? 'Unknown',
        title: win.title ?? '',
        bounds,
      })
    } catch {
      // active-win may fail on some windows; ignore silently
    }
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (!this.decoratorWin.isDestroyed()) {
      this.decoratorWin.hide()
    }
  }
}
