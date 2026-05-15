import { app, globalShortcut, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { config as loadEnv } from 'dotenv'
import log from 'electron-log'
import { createOverlayWindow, createHUDWindow, createDecoratorWindow, createWidgetCanvasWindow } from './windowManager'
import { ConfigService } from './services/config/ConfigService'
import { AIService } from './services/ai/AIService'
import { TTSService } from './services/voice/TTSService'
import { STTService } from './services/voice/STTService'
import { WakeWordService } from './services/voice/WakeWordService'
import { ShellService } from './services/system/ShellService'
import { VolumeService } from './services/system/VolumeService'
import { ScreenshotService } from './services/system/ScreenshotService'
import { AppLaunchService } from './services/system/AppLaunchService'
import { WindowDecorator } from './decorator/WindowDecorator'
import { WidgetManager } from './widgets/WidgetManager'
import { registerIpcHandlers } from './ipc/index'
import { createTray } from './trayManager'
import type { AppConfig } from './services/config/schema'

// Load .env from project root — env vars act as fallbacks for unconfigured keys
loadEnv()

/** Overlay env-var values onto any config fields that are still empty strings. */
function applyEnvOverrides(config: AppConfig): AppConfig {
  return {
    ...config,
    ai: {
      ...config.ai,
      gemini: {
        ...config.ai.gemini,
        apiKey: config.ai.gemini.apiKey || process.env.GEMINI_API_KEY || '',
        // Auto-upgrade removed model names
        model: config.ai.gemini.model === 'gemini-1.5-flash' ? 'gemini-2.0-flash' : config.ai.gemini.model,
      },
      groq: {
        ...config.ai.groq,
        apiKey: config.ai.groq.apiKey || process.env.GROQ_API_KEY || '',
      },
    },
    voice: {
      ...config.voice,
      picovoiceApiKey: config.voice.picovoiceApiKey || process.env.PICOVOICE_API_KEY || '',
    },
  }
}

log.initialize()
log.info('JARVIS starting...')

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.whenReady().then(async () => {
  const configService = new ConfigService()
  const config = applyEnvOverrides(configService.get())

  // Create windows
  const overlayWindow = createOverlayWindow()
  const hudWindow = createHUDWindow()
  const decoratorWindow = createDecoratorWindow()
  const canvasWindow = createWidgetCanvasWindow()

  // Create services
  const aiService = new AIService(config)
  const ttsService = new TTSService()
  const sttService = new STTService(config.ai.groq.apiKey)
  const shellService = new ShellService(config)
  const volumeService = new VolumeService()
  const screenshotService = new ScreenshotService()
  const appLaunchService = new AppLaunchService(config)
  const windowDecorator = new WindowDecorator(decoratorWindow, [hudWindow])
  const widgetManager = new WidgetManager(canvasWindow, config)

  // Wake word detection — fires toggleOverlay and sends voice:wake-word to renderer
  const wakeWordService = new WakeWordService(() => {
    if (!overlayVisible) toggleOverlay()
    for (const win of [overlayWindow, hudWindow]) {
      if (!win.isDestroyed()) win.webContents.send('voice:wake-word')
    }
  })
  wakeWordService.init().then((ok) => {
    if (ok) log.info('[WakeWord] Ready')
  })

  // Forward raw PCM chunks from HUD renderer to the wake word spotter
  ipcMain.on('voice:audio-chunk', (_event, buf: Buffer) => {
    wakeWordService.processAudio(buf)
  })

  let overlayVisible = false

  const toggleOverlay = () => {
    if (overlayVisible) {
      overlayWindow.hide()
      overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    } else {
      overlayWindow.show()
      overlayWindow.focus()
      overlayWindow.setIgnoreMouseEvents(false)
    }
    overlayVisible = !overlayVisible
    overlayWindow.webContents.send('overlay:visible', overlayVisible)
    hudWindow.webContents.send('hotkey:toggle')
  }

  // Register global hotkeys
  try {
    globalShortcut.register('CommandOrControl+Space', toggleOverlay)
    log.info('Registered Ctrl+Space hotkey')
  } catch (err) {
    log.warn('Failed to register Ctrl+Space:', err)
  }

  try {
    globalShortcut.register('CommandOrControl+Shift+J', toggleOverlay)
    log.info('Registered Ctrl+Shift+J hotkey')
  } catch (err) {
    log.warn('Failed to register Ctrl+Shift+J:', err)
  }

  // Register all IPC handlers
  registerIpcHandlers({
    configService,
    aiService,
    ttsService,
    sttService,
    shellService,
    volumeService,
    screenshotService,
    appLaunchService,
    overlayWindow,
    hudWindow,
    windowDecorator,
    widgetManager,
    getOverlayVisible: () => overlayVisible,
    setOverlayVisible: (v) => { overlayVisible = v },
  })

  // Start window decorator
  if (config.decorator?.enabled !== false) {
    windowDecorator.start()
  }

  // Create system tray — must store reference to prevent GC on some platforms
  const _tray = createTray(toggleOverlay, () => app.quit())

  // Load renderer URLs
  const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

  const loadWindows = async () => {
    if (VITE_DEV_SERVER_URL) {
      await overlayWindow.loadURL(VITE_DEV_SERVER_URL)
      await hudWindow.loadURL(`${VITE_DEV_SERVER_URL}#hud`)
      await decoratorWindow.loadURL(`${VITE_DEV_SERVER_URL}#decorator`)
      await canvasWindow.loadURL(`${VITE_DEV_SERVER_URL}#canvas`)
    } else {
      const rendererIndex = join(__dirname, '../renderer/index.html')
      await overlayWindow.loadFile(rendererIndex)
      await hudWindow.loadFile(rendererIndex, { hash: 'hud' })
      await decoratorWindow.loadFile(rendererIndex, { hash: 'decorator' })
      await canvasWindow.loadFile(rendererIndex, { hash: 'canvas' })
    }

    // Open devtools in development
    if (VITE_DEV_SERVER_URL) {
      overlayWindow.webContents.openDevTools({ mode: 'detach' })
    }
  }

  await loadWindows()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      loadWindows()
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    windowDecorator.stop()
    wakeWordService.destroy()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  log.info('JARVIS ready.')
})
