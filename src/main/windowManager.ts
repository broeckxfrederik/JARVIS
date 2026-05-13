import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

export function createOverlayWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(true, { forward: true })
  return win
}

export function createHUDWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const hudWidth = 320
  const hudHeight = 120
  const win = new BrowserWindow({
    width: hudWidth,
    height: hudHeight,
    x: width - hudWidth - 20,
    y: height - hudHeight - 20,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(true, { forward: true })
  return win
}

export function createWidgetCanvasWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const canvasWidth = 380
  const canvasHeight = Math.round(height * 0.82)
  const x = width - canvasWidth - 10
  const y = Math.round((height - canvasHeight) / 2)

  const win = new BrowserWindow({
    width: canvasWidth,
    height: canvasHeight,
    x, y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // needed to allow iframe data URLs and local content
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  return win
}

export function createDecoratorWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().bounds
  const win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(true, { forward: true })
  return win
}
