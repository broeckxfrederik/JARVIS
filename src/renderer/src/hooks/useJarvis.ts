import { useEffect, useCallback, useRef } from 'react'
import { useJarvisStore, Message } from '../store/jarvisStore'

export function useJarvis() {
  const store = useJarvisStore()
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Wire IPC events to store
  useEffect(() => {
    if (typeof window === 'undefined' || !window.jarvis) return

    const cleanups: Array<() => void> = []

    // Stream chunk handler
    const cleanChunk = window.jarvis.onStreamChunk((chunk) => {
      if (isMountedRef.current) {
        store.appendResponse(chunk)
      }
    })
    cleanups.push(cleanChunk)

    // Stream done handler — commit response and speak it
    const cleanDone = window.jarvis.onStreamDone(() => {
      if (!isMountedRef.current) return
      const response = useJarvisStore.getState().currentResponse
      store.commitResponse()
      store.setState('speaking')
      window.jarvis.speak(response).finally(() => {
        if (isMountedRef.current) store.setState('idle')
      })
    })
    cleanups.push(cleanDone)

    // Hotkey toggle
    const cleanHotkey = window.jarvis.onHotkeyToggle(() => {
      if (isMountedRef.current) {
        const next = !store.isVisible
        store.setVisible(next)
      }
    })
    cleanups.push(cleanHotkey)

    // Active provider (fires when query starts or fallback occurs)
    const cleanProvider = window.jarvis.onProviderActive((name) => {
      if (isMountedRef.current) store.setActiveProvider(name)
    })
    cleanups.push(cleanProvider)

    // Wake word
    const cleanWake = window.jarvis.onWakeWord(() => {
      if (isMountedRef.current) {
        store.setVisible(true)
        store.setState('listening')
      }
    })
    cleanups.push(cleanWake)

    // Voice state
    const cleanVoice = window.jarvis.onVoiceState((state) => {
      if (isMountedRef.current) {
        const validStates = ['idle', 'listening', 'transcribing', 'thinking', 'speaking']
        if (validStates.includes(state)) {
          store.setState(state as Parameters<typeof store.setState>[0])
        }
      }
    })
    cleanups.push(cleanVoice)

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      // Snapshot history BEFORE adding the new message to avoid stale closure issues
      const historySnapshot = useJarvisStore.getState().messages

      store.addMessage({ role: 'user', content: text, timestamp: Date.now() })
      store.setState('thinking')
      store.clearCurrentResponse()

      // Build messages for AI: prior history + the new user message (no duplication)
      const messagesForAI: Pick<Message, 'role' | 'content'>[] = [
        ...historySnapshot.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      try {
        await window.jarvis.query(messagesForAI, `session-${Date.now()}`)
      } catch (err) {
        store.addMessage({
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          timestamp: Date.now(),
        })
        store.setState('idle')
      }
    },
    [store]
  )

  const speakText = useCallback(async (text: string) => {
    store.setState('speaking')
    await window.jarvis.speak(text)
    store.setState('idle')
  }, [store])

  return {
    ...store,
    sendMessage,
    speakText,
  }
}
