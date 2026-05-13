import OpenAI, { toFile } from 'openai'

export class STTService {
  private client: OpenAI | null = null
  private model: string

  constructor(apiKey: string, baseURL = 'https://api.groq.com/openai/v1', model = 'whisper-large-v3') {
    this.model = model
    if (apiKey && apiKey.length > 10) {
      this.client = new OpenAI({ apiKey, baseURL })
    }
  }

  updateApiKey(apiKey: string, baseURL = 'https://api.groq.com/openai/v1'): void {
    if (apiKey && apiKey.length > 10) {
      this.client = new OpenAI({ apiKey, baseURL })
    } else {
      this.client = null
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client)
  }

  async transcribe(audioData: number[]): Promise<string> {
    if (!this.client) {
      console.warn('[STT] No API key configured — transcription skipped')
      return ''
    }

    try {
      const buffer = Buffer.from(audioData)
      const transcription = await this.client.audio.transcriptions.create({
        file: await toFile(buffer, 'audio.webm', { type: 'audio/webm' }),
        model: this.model,
        language: 'en',
      })
      return transcription.text ?? ''
    } catch (err) {
      console.error('[STT] Transcription error:', err)
      return ''
    }
  }
}
