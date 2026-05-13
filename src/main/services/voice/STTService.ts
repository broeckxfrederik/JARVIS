import OpenAI from 'openai'
import { Readable } from 'stream'

export class STTService {
  private client: OpenAI | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    if (apiKey && apiKey.length > 10) {
      this.client = new OpenAI({ apiKey })
    }
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey
    if (apiKey && apiKey.length > 10) {
      this.client = new OpenAI({ apiKey })
    } else {
      this.client = null
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client)
  }

  async transcribe(audioData: number[]): Promise<string> {
    if (!this.client) {
      console.warn('STT: OpenAI API key not configured')
      return ''
    }

    try {
      const buffer = Buffer.from(audioData)

      // Create a readable stream from the buffer with a filename
      const readable = Readable.from(buffer) as NodeJS.ReadableStream & { path: string; name: string }
      readable.name = 'audio.webm'

      const transcription = await this.client.audio.transcriptions.create({
        file: new File([buffer], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
        language: 'en',
      })

      return transcription.text || ''
    } catch (err) {
      console.error('STT transcription error:', err)
      return ''
    }
  }
}
