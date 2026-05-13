import React, { useEffect, useRef } from 'react'
import { Message } from '../../store/jarvisStore'

interface ConversationPanelProps {
  messages: Message[]
  currentResponse: string
  isStreaming: boolean
}

export function ConversationPanel({
  messages,
  currentResponse,
  isStreaming,
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse])

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: 0,
      }}
    >
      {messages.length === 0 && !isStreaming && (
        <div
          style={{
            textAlign: 'center',
            color: 'rgba(0,212,255,0.3)',
            fontSize: '12px',
            marginTop: 'auto',
            marginBottom: 'auto',
            paddingTop: 40,
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⬡</div>
          <div>JARVIS ONLINE</div>
          <div style={{ fontSize: '10px', marginTop: 4, opacity: 0.6 }}>
            Type a message or press the mic button
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Currently streaming response */}
      {isStreaming && currentResponse && (
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '80%',
          }}
          className="fade-in"
        >
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(0,212,255,0.5)',
              marginBottom: 4,
              letterSpacing: '0.08em',
            }}
          >
            JARVIS
          </div>
          <div
            style={{
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              borderRadius: '2px 8px 8px 8px',
              padding: '8px 12px',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#00d4ff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {currentResponse}
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: '#00d4ff',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
              }}
              className="cursor-blink"
            />
          </div>
        </div>
      )}

      {/* Show animated dots when thinking but no content yet */}
      {isStreaming && !currentResponse && (
        <div style={{ alignSelf: 'flex-start' }} className="fade-in">
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(0,212,255,0.5)',
              marginBottom: 4,
              letterSpacing: '0.08em',
            }}
          >
            JARVIS
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '12px',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00d4ff',
                  animation: `wave 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
      }}
      className="fade-in"
    >
      <div
        style={{
          fontSize: '10px',
          color: isUser ? 'rgba(10,132,255,0.6)' : 'rgba(0,212,255,0.5)',
          marginBottom: 4,
          textAlign: isUser ? 'right' : 'left',
          letterSpacing: '0.08em',
        }}
      >
        {isUser ? 'YOU' : 'JARVIS'}
      </div>
      <div
        style={{
          background: isUser ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 212, 255, 0.08)',
          border: `1px solid ${isUser ? 'rgba(10,132,255,0.4)' : 'rgba(0,212,255,0.25)'}`,
          borderRadius: isUser ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
          padding: '8px 12px',
          fontSize: '13px',
          lineHeight: 1.5,
          color: isUser ? '#6fb3ff' : '#00d4ff',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
