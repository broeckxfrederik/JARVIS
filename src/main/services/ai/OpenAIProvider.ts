import OpenAI from 'openai'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI
  private model: string
  private apiKey: string

  constructor(apiKey: string, model = 'gpt-4o') {
    this.apiKey = apiKey
    this.model = model
    this.client = new OpenAI({ apiKey: apiKey || 'placeholder' })
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10)
  }

  async complete(messages: Message[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    return response.choices[0]?.message?.content ?? ''
  }

  async stream(messages: Message[], onChunk: (chunk: StreamChunk) => void): Promise<string> {
    let fullText = ''

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        fullText += delta
        onChunk({ delta, done: false })
      }
    }

    onChunk({ delta: '', done: true })
    return fullText
  }
}
