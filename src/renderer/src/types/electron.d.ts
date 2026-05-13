export {}

declare global {
  interface Window {
    jarvis: {
      // AI
      query: (messages: Array<{ role: string; content: string }>, sessionId: string) => Promise<string>
      abortQuery: () => void
      onStreamChunk: (cb: (chunk: string) => void) => () => void
      onStreamDone: (cb: () => void) => () => void
      onProviderActive: (cb: (name: string) => void) => () => void

      // Voice
      transcribeAudio: (audioData: number[]) => Promise<string>
      speak: (text: string) => Promise<boolean>
      onWakeWord: (cb: () => void) => () => void
      onVoiceState: (cb: (state: string) => void) => () => void

      // System
      executeCommand: (cmd: string) => Promise<{ stdout: string; stderr: string }>
      takeScreenshot: () => Promise<string>
      setVolume: (level: number) => Promise<boolean>
      openApp: (name: string) => Promise<boolean>

      // Config
      getConfig: () => Promise<Record<string, unknown>>
      setConfig: (config: Record<string, unknown>) => Promise<boolean>

      // Window
      setClickThrough: (enabled: boolean) => void
      toggleWindow: () => void
      onHotkeyToggle: (cb: () => void) => () => void

      // Decorator
      onDecoratorUpdate: (cb: (info: { appName: string; title: string }) => void) => () => void
      toggleDecorator: (enabled: boolean) => Promise<boolean>

      // Widgets
      onWidgetAdd: (cb: (payload: unknown) => void) => () => void
      onWidgetClear: (cb: () => void) => () => void
    }
  }
}
