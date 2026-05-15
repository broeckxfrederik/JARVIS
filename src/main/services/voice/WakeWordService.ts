import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import log from 'electron-log'

export class WakeWordService {
  private spotter: any = null
  private stream: any = null
  private ready = false
  private onDetected: () => void

  constructor(onDetected: () => void) {
    this.onDetected = onDetected
  }

  async init(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sherpa = require('sherpa-onnx-node')

      const assetsDir = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(process.cwd(), 'assets')

      const modelDir = path.join(assetsDir, 'wake-words', 'model')
      const keywordsPath = path.join(assetsDir, 'wake-words', 'keywords.txt')

      const encoderPath = path.join(modelDir, 'encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx')
      const decoderPath = path.join(modelDir, 'decoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx')
      const joinerPath  = path.join(modelDir, 'joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx')
      const tokensPath  = path.join(modelDir, 'tokens.txt')

      if (!fs.existsSync(encoderPath)) {
        log.warn('[WakeWord] Model not found — run: node scripts/download-wake-word-model.js')
        return false
      }
      if (!fs.existsSync(keywordsPath)) {
        log.warn('[WakeWord] keywords.txt not found at', keywordsPath)
        return false
      }

      this.spotter = new sherpa.KeywordSpotter({
        feat: { sampleRate: 16000, featureDim: 80 },
        model: {
          transducer: {
            encoder: encoderPath,
            decoder: decoderPath,
            joiner: joinerPath,
          },
          tokens: tokensPath,
          numThreads: 1,
          provider: 'cpu',
          debug: 0,
        },
        maxActivePaths: 4,
        keywordsFile: keywordsPath,
        keywordsScore: 1.5,
        keywordsThreshold: 0.25,
        numTrailingBlanks: 1,
      })

      this.stream = this.spotter.createStream()
      this.ready = true
      log.info('[WakeWord] Initialized — listening for wake word')
      return true
    } catch (err) {
      log.warn('[WakeWord] Failed to initialize sherpa-onnx:', err)
      return false
    }
  }

  processAudio(buf: Buffer): void {
    if (!this.ready || !this.spotter || !this.stream) return
    try {
      const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
      this.stream.acceptWaveform({ sampleRate: 16000, samples })
      while (this.spotter.isReady(this.stream)) {
        this.spotter.decode(this.stream)
      }
      const result = this.spotter.getResult(this.stream)
      if (result.keyword.trim() !== '') {
        log.info('[WakeWord] Detected:', result.keyword)
        this.onDetected()
        this.spotter.reset(this.stream)
      }
    } catch (err) {
      log.error('[WakeWord] Error processing audio:', err)
    }
  }

  isReady(): boolean {
    return this.ready
  }

  destroy(): void {
    this.stream = null
    this.spotter = null
    this.ready = false
  }
}
