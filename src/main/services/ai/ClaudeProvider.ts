import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude'
  private client: Anthropic
  private model: string
  private apiKey: string

  constructor(apiKey: string, model = 'claude-opus-4-5') {
    this.apiKey = apiKey
    this.model = model
    this.client = new Anthropic({ apiKey: apiKey || 'placeholder' })
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10)
  }

  async complete(messages: Message[]): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system')
    const userMessages = messages.filter(m => m.role !== 'system')

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemMsg?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = response.content[0]
    if (content.type === 'text') return content.text
    return ''
  }

  async stream(messages: Message[], onChunk: (chunk: StreamChunk) => void): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system')
    const userMessages = messages.filter(m => m.role !== 'system')

    let fullText = ''

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemMsg?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const delta = event.delta.text
        fullText += delta
        onChunk({ delta, done: false })
      }
    }

    onChunk({ delta: '', done: true })
    return fullText
  }
}
