import axios from 'axios'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama'
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
    this.baseUrl = baseUrl
    this.model = model
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl)
  }

  async complete(messages: Message[]): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/api/chat`, {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
    })
    return response.data?.message?.content ?? ''
  }

  async stream(messages: Message[], onChunk: (chunk: StreamChunk) => void): Promise<string> {
    let fullText = ''

    const response = await axios.post(
      `${this.baseUrl}/api/chat`,
      {
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      },
      { responseType: 'stream' }
    )

    return new Promise((resolve, reject) => {
      let buffer = ''
      let resolved = false

      const finish = () => {
        if (resolved) return
        resolved = true
        onChunk({ delta: '', done: true })
        resolve(fullText)
      }

      const processLine = (line: string) => {
        if (!line.trim()) return
        try {
          const parsed = JSON.parse(line)
          const delta = parsed.message?.content ?? ''
          if (delta) {
            fullText += delta
            onChunk({ delta, done: false })
          }
          if (parsed.done) finish()
        } catch {
          // Skip malformed JSON lines
        }
      }

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) processLine(line)
      })

      response.data.on('error', reject)
      response.data.on('end', () => {
        // Flush any remaining partial line
        if (buffer.trim()) processLine(buffer)
        finish()
      })
    })
  }
}
