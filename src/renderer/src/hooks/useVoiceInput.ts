import { useState, useRef, useCallback } from 'react'
import { useJarvisStore } from '../store/jarvisStore'

export interface VoiceInputHook {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string>
  error: string | null
}

export function useVoiceInput(): VoiceInputHook {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const store = useJarvisStore()

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.start(100) // collect data every 100ms
      setIsRecording(true)
      store.setState('listening')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setError(msg)
      console.error('Failed to start recording:', err)
    }
  }, [store])

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false)
        resolve('')
        return
      }

      recorder.onstop = async () => {
        // Stop all tracks
        recorder.stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        store.setState('transcribing')

        if (chunksRef.current.length === 0) {
          store.setState('idle')
          resolve('')
          return
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const arrayBuffer = await blob.arrayBuffer()
        const audioData = Array.from(new Uint8Array(arrayBuffer))

        try {
          const text = await window.jarvis.transcribeAudio(audioData)
          resolve(text || '')
        } catch (err) {
          console.error('Transcription failed:', err)
          resolve('')
        } finally {
          store.setState('idle')
        }
      }

      recorder.stop()
    })
  }, [store])

  return { isRecording, startRecording, stopRecording, error }
}
