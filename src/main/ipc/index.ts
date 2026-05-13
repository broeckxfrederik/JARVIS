import { ipcMain, BrowserWindow } from 'electron'
import { ConfigService } from '../services/config/ConfigService'
import { AIService } from '../services/ai/AIService'
import { TTSService } from '../services/voice/TTSService'
import { STTService } from '../services/voice/STTService'
import { ShellService } from '../services/system/ShellService'
import { VolumeService } from '../services/system/VolumeService'
import { ScreenshotService } from '../services/system/ScreenshotService'
import { AppLaunchService } from '../services/system/AppLaunchService'
import { WindowDecorator } from '../decorator/WindowDecorator'
import { Message } from '../services/ai/AIProviderInterface'
import { WidgetManager } from '../widgets/WidgetManager'

interface IpcHandlerDeps {
  configService: ConfigService
  aiService: AIService
  ttsService: TTSService
  sttService: STTService
  shellService: ShellService
  volumeService: VolumeService
  screenshotService: ScreenshotService
  appLaunchService: AppLaunchService
  overlayWindow: BrowserWindow
  hudWindow: BrowserWindow
  decoratorWindow: BrowserWindow
  windowDecorator: WindowDecorator
  widgetManager: WidgetManager
  getOverlayVisible: () => boolean
  setOverlayVisible: (v: boolean) => void
}

export function registerIpcHandlers(deps: IpcHandlerDeps): void {
  const {
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
    getOverlayVisible,
    setOverlayVisible,
  } = deps

  // ─── AI ─────────────────────────────────────────────────────────────────────

  ipcMain.handle(
    'ai:query',
    async (event, { messages, sessionId: _sessionId }: { messages: Message[]; sessionId: string }) => {
      const sender = event.sender

      try {
        const fullText = await aiService.queryMessages(
          messages,
          (chunk) => {
            if (!chunk.done && !sender.isDestroyed()) sender.send('ai:stream-chunk', chunk.delta)
          },
          (providerName) => {
            if (!sender.isDestroyed()) sender.send('ai:provider-active', providerName)
          }
        )
        if (!sender.isDestroyed()) sender.send('ai:stream-done')

        // Non-blocking widget planning
        const userMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
        if (userMsg) {
          widgetManager.processQuery(userMsg).catch(() => {})
        }

        return fullText
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (!sender.isDestroyed()) sender.send('ai:stream-done')
        throw new Error(message)
      }
    }
  )

  ipcMain.on('ai:abort', () => {
    // Abort is handled by the provider; no-op for now
    // Future: pass an AbortController to stream()
  })

  // ─── Voice ──────────────────────────────────────────────────────────────────

  ipcMain.handle('voice:tts', async (_event, text: string) => {
    await ttsService.speak(text)
    return true
  })

  ipcMain.handle('voice:transcribe', async (_event, audioData: number[]) => {
    const text = await sttService.transcribe(audioData)
    return text
  })

  // ─── System ─────────────────────────────────────────────────────────────────

  ipcMain.handle('system:exec', async (_event, command: string) => {
    return shellService.execute(command)
  })

  ipcMain.handle('system:screenshot', async () => {
    const path = await screenshotService.capture()
    return path
  })

  ipcMain.handle('system:volume', async (_event, level: number) => {
    await volumeService.setVolume(level)
    return true
  })

  ipcMain.handle('system:open-app', async (_event, name: string) => {
    return appLaunchService.launch(name)
  })

  // ─── Config ─────────────────────────────────────────────────────────────────

  ipcMain.handle('config:get', () => {
    return configService.get()
  })

  ipcMain.handle('config:set', (_event, partial: Record<string, unknown>) => {
    configService.set(partial as Parameters<typeof configService.set>[0])
    const newConfig = configService.get()
    aiService.switchProvider(newConfig)
    shellService.updateConfig(newConfig)
    appLaunchService.updateConfig(newConfig)
    sttService.updateApiKey(newConfig.ai.groq.apiKey)
    widgetManager.updateConfig(newConfig)
    return true
  })

  // ─── Window ─────────────────────────────────────────────────────────────────

  ipcMain.on('window:click-through', (_event, enabled: boolean) => {
    overlayWindow.setIgnoreMouseEvents(enabled, { forward: true })
  })

  ipcMain.on('window:toggle', () => {
    const visible = getOverlayVisible()
    if (visible) {
      overlayWindow.hide()
      overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    } else {
      overlayWindow.show()
      overlayWindow.focus()
      overlayWindow.setIgnoreMouseEvents(false)
    }
    setOverlayVisible(!visible)
    overlayWindow.webContents.send('hotkey:toggle')
    hudWindow.webContents.send('hotkey:toggle')
  })

  // ─── Decorator ──────────────────────────────────────────────────────────────

  ipcMain.handle('decorator:toggle', (_event, enabled: boolean) => {
    windowDecorator.setEnabled(enabled)
    return true
  })
}
