import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useJarvis } from '../../hooks/useJarvis'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { CircularHUD } from './CircularHUD'
import { ConversationPanel } from './ConversationPanel'
import { StatusBar } from './StatusBar'

export function MainOverlay() {
  const jarvis = useJarvis()
  const voice = useVoiceInput()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localInput, setLocalInput] = useState('')

  // Enable/disable click-through based on visibility
  useEffect(() => {
    window.jarvis?.rendererLog(`MainOverlay isVisible effect ran. isVisible=${jarvis.isVisible}`)
    if (typeof window !== 'undefined' && window.jarvis) {
      if (jarvis.isVisible) {
        window.jarvis.setClickThrough(false)
        inputRef.current?.focus()
      } else {
        window.jarvis.setClickThrough(true)
      }
    }
  }, [jarvis.isVisible])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const text = localInput.trim()
      if (!text || jarvis.state === 'thinking') return
      setLocalInput('')
      await jarvis.sendMessage(text)
    },
    [localInput, jarvis]
  )

  const handleVoiceClick = useCallback(async () => {
    if (voice.isRecording) {
      const text = await voice.stopRecording()
      if (text) {
        await jarvis.sendMessage(text)
      }
    } else {
      await voice.startRecording()
    }
  }, [voice, jarvis])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.jarvis?.rendererLog(`Escape pressed. isVisible=${jarvis.isVisible}`)
        window.jarvis?.toggleWindow()
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [jarvis, handleSubmit]
  )

  if (!jarvis.isVisible) {
    return null
  }

  const isStreaming = jarvis.state === 'thinking'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 60px 0',
        pointerEvents: 'none',
      }}
    >
      {/* Main panel */}
      <div
        className="hud-panel"
        style={{
          width: 700,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'all',
          animation: 'fade-in 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.15)',
          }}
        >
          <CircularHUD state={jarvis.state} size={56} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                letterSpacing: '0.2em',
                color: '#00d4ff',
                textShadow: '0 0 10px rgba(0,212,255,0.5)',
              }}
            >
              J.A.R.V.I.S
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(0,212,255,0.5)',
                letterSpacing: '0.1em',
                marginTop: 2,
              }}
            >
              Just A Rather Very Intelligent System
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              window.jarvis?.rendererLog(`Close button clicked. isVisible=${jarvis.isVisible}`)
              window.jarvis?.toggleWindow()
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'rgba(0,212,255,0.6)',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '10px',
              letterSpacing: '0.1em',
              borderRadius: 2,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,60,60,0.6)'
              e.currentTarget.style.color = 'rgba(255,60,60,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
              e.currentTarget.style.color = 'rgba(0,212,255,0.6)'
            }}
          >
            [ESC]
          </button>
        </div>

        {/* Conversation */}
        <ConversationPanel
          messages={jarvis.messages}
          currentResponse={jarvis.currentResponse}
          isStreaming={isStreaming}
        />

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(0,212,255,0.15)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {/* Voice button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            style={{
              background: voice.isRecording
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(0,212,255,0.05)',
              border: `1px solid ${voice.isRecording ? 'rgba(34,197,94,0.6)' : 'rgba(0,212,255,0.3)'}`,
              color: voice.isRecording ? '#22c55e' : 'rgba(0,212,255,0.7)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '14px',
              borderRadius: 2,
              flexShrink: 0,
              transition: 'all 0.2s',
              animation: voice.isRecording ? 'pulse-glow 1s ease-in-out infinite' : undefined,
            }}
            title={voice.isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {voice.isRecording ? '⏹' : '🎤'}
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Query JARVIS..."
            disabled={jarvis.state === 'thinking'}
            style={{
              flex: 1,
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: 2,
              padding: '6px 10px',
              color: '#00d4ff',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              letterSpacing: '0.02em',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0,212,255,0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,212,255,0.25)'
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!localInput.trim() || jarvis.state === 'thinking'}
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.4)',
              color: '#00d4ff',
              cursor: 'pointer',
              padding: '6px 14px',
              fontSize: '12px',
              letterSpacing: '0.1em',
              borderRadius: 2,
              flexShrink: 0,
              opacity: !localInput.trim() || jarvis.state === 'thinking' ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            SEND
          </button>
        </form>

        {/* Status bar */}
        <StatusBar state={jarvis.state} />
      </div>
    </div>
  )
}
