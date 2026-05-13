import { app, globalShortcut, BrowserWindow } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { createOverlayWindow, createHUDWindow, createDecoratorWindow, createWidgetCanvasWindow } from './windowManager'
import { ConfigService } from './services/config/ConfigService'
import { AIService } from './services/ai/AIService'
import { TTSService } from './services/voice/TTSService'
import { STTService } from './services/voice/STTService'
import { ShellService } from './services/system/ShellService'
import { VolumeService } from './services/system/VolumeService'
import { ScreenshotService } from './services/system/ScreenshotService'
import { AppLaunchService } from './services/system/AppLaunchService'
import { WindowDecorator } from './decorator/WindowDecorator'
import { WidgetManager } from './widgets/WidgetManager'
import { registerIpcHandlers } from './ipc/index'
import { createTray } from './trayManager'

log.initialize()
log.info('JARVIS starting...')

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.whenReady().then(async () => {
  const configService = new ConfigService()
  const config = configService.get()

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
  const windowDecorator = new WindowDecorator(decoratorWindow)
  const widgetManager = new WidgetManager(canvasWindow, config)

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
    overlayWindow.webContents.send('hotkey:toggle')
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
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  log.info('JARVIS ready.')
})
