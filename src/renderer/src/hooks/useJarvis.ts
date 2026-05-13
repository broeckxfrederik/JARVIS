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

    // Stream done handler
    const cleanDone = window.jarvis.onStreamDone(() => {
      if (isMountedRef.current) {
        store.commitResponse()
        store.setState('idle')
      }
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

      store.addMessage({
        role: 'user',
        content: text,
        timestamp: Date.now(),
      })
      store.setState('thinking')
      store.clearCurrentResponse()

      const messages: Message[] = [
        ...store.messages,
        { id: 'pending', role: 'user', content: text, timestamp: Date.now() },
      ]

      try {
        await window.jarvis.query(
          messages.map((m) => ({ role: m.role, content: m.content })),
          `session-${Date.now()}`
        )
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
