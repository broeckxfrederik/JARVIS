import { contextBridge, ipcRenderer } from 'electron'

const jarvisAPI = {
  // ─── AI ───────────────────────────────────────────────────────────────────

  query: (messages: Array<{ role: string; content: string }>, sessionId: string) =>
    ipcRenderer.invoke('ai:query', { messages, sessionId }),

  abortQuery: () => ipcRenderer.send('ai:abort'),

  onStreamChunk: (cb: (chunk: string) => void) => {
    const handler = (_: unknown, chunk: string) => cb(chunk)
    ipcRenderer.on('ai:stream-chunk', handler)
    return () => ipcRenderer.removeListener('ai:stream-chunk', handler)
  },

  onStreamDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('ai:stream-done', handler)
    return () => ipcRenderer.removeListener('ai:stream-done', handler)
  },

  onProviderActive: (cb: (name: string) => void) => {
    const handler = (_: unknown, name: string) => cb(name)
    ipcRenderer.on('ai:provider-active', handler)
    return () => ipcRenderer.removeListener('ai:provider-active', handler)
  },

  // ─── Voice ────────────────────────────────────────────────────────────────

  transcribeAudio: (audioData: number[]) =>
    ipcRenderer.invoke('voice:transcribe', audioData),

  speak: (text: string) => ipcRenderer.invoke('voice:tts', text),

  onWakeWord: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('voice:wake-word', handler)
    return () => ipcRenderer.removeListener('voice:wake-word', handler)
  },

  onVoiceState: (cb: (state: string) => void) => {
    const handler = (_: unknown, state: string) => cb(state)
    ipcRenderer.on('voice:state', handler)
    return () => ipcRenderer.removeListener('voice:state', handler)
  },

  sendAudioChunk: (buf: Buffer) => ipcRenderer.send('voice:audio-chunk', buf),

  // ─── System ───────────────────────────────────────────────────────────────

  executeCommand: (cmd: string) => ipcRenderer.invoke('system:exec', cmd),

  takeScreenshot: () => ipcRenderer.invoke('system:screenshot'),

  setVolume: (level: number) => ipcRenderer.invoke('system:volume', level),

  openApp: (name: string) => ipcRenderer.invoke('system:open-app', name),

  // ─── Config ───────────────────────────────────────────────────────────────

  getConfig: () => ipcRenderer.invoke('config:get'),

  setConfig: (config: Record<string, unknown>) =>
    ipcRenderer.invoke('config:set', config),

  // ─── Window ───────────────────────────────────────────────────────────────

  setClickThrough: (enabled: boolean) =>
    ipcRenderer.send('window:click-through', enabled),

  toggleWindow: () => ipcRenderer.send('window:toggle'),

  rendererLog: (msg: string) => ipcRenderer.send('renderer:log', msg),

  onHotkeyToggle: (cb: (visible: boolean) => void) => {
    const handler = (_: unknown, visible: boolean) => cb(visible)
    ipcRenderer.on('hotkey:toggle', handler)
    return () => ipcRenderer.removeListener('hotkey:toggle', handler)
  },

  // ─── Decorator ────────────────────────────────────────────────────────────

  onDecoratorUpdate: (cb: (info: { appName: string; title: string }) => void) => {
    const handler = (_: unknown, info: { appName: string; title: string }) => cb(info)
    ipcRenderer.on('decorator:update', handler)
    return () => ipcRenderer.removeListener('decorator:update', handler)
  },

  toggleDecorator: (enabled: boolean) =>
    ipcRenderer.invoke('decorator:toggle', enabled),

  // ─── Widgets ──────────────────────────────────────────────────────────────

  onWidgetAdd: (cb: (payload: unknown) => void) => {
    const handler = (_: unknown, payload: unknown) => cb(payload)
    ipcRenderer.on('widget:add', handler)
    return () => ipcRenderer.removeListener('widget:add', handler)
  },

  onWidgetClear: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('widget:clear', handler)
    return () => ipcRenderer.removeListener('widget:clear', handler)
  },
}

contextBridge.exposeInMainWorld('jarvis', jarvisAPI)
