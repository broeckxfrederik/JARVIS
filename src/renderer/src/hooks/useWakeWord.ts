import { useEffect, useRef } from 'react'

/**
 * Continuously captures microphone audio at 16 kHz and forwards 256 ms PCM
 * chunks to the main process for sherpa-onnx wake-word detection.
 * Only active while the component is mounted (HUD window — always visible).
 */
export function useWakeWord(): void {
  const activeRef = useRef(false)

  useEffect(() => {
    if (!window.jarvis) return

    let audioCtx: AudioContext | null = null
    let processor: ScriptProcessorNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let mediaStream: MediaStream | null = null
    activeRef.current = true

    navigator.mediaDevices
      .getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        if (!activeRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        mediaStream = stream

        // Request 16 kHz context — Chrome/Electron honour this
        audioCtx = new AudioContext({ sampleRate: 16000 })
        source = audioCtx.createMediaStreamSource(stream)

        // 4096 samples @ 16 kHz = 256 ms per chunk — enough for streaming KWS
        processor = audioCtx.createScriptProcessor(4096, 1, 1)
        processor.onaudioprocess = (e) => {
          if (!activeRef.current) return
          const samples = e.inputBuffer.getChannelData(0) // Float32Array view
          // Convert to Buffer for efficient IPC transfer
          const buf = Buffer.from(samples.buffer.slice(
            samples.byteOffset,
            samples.byteOffset + samples.byteLength,
          ))
          window.jarvis.sendAudioChunk(buf)
        }

        source.connect(processor)
        // Connect to destination to prevent Chrome from suspending the node
        processor.connect(audioCtx.destination)
      })
      .catch((err) => {
        console.warn('[WakeWord] Mic access denied:', err)
      })

    return () => {
      activeRef.current = false
      processor?.disconnect()
      source?.disconnect()
      mediaStream?.getTracks().forEach((t) => t.stop())
      audioCtx?.close()
    }
  }, [])
}
