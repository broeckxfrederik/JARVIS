import { AppConfig } from '../config/schema'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'
import { ClaudeProvider } from './ClaudeProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { OllamaProvider } from './OllamaProvider'

export class AIService {
  private provider: AIProvider
  private config: AppConfig
  public conversationHistory: Message[] = []

  constructor(config: AppConfig) {
    this.config = config
    this.provider = this.createProvider(config)
  }

  private createProvider(config: AppConfig): AIProvider {
    switch (config.ai.provider) {
      case 'claude':
        return new ClaudeProvider(config.ai.claude.apiKey, config.ai.claude.model)
      case 'openai':
        return new OpenAIProvider(config.ai.openai.apiKey, config.ai.openai.model)
      case 'ollama':
        return new OllamaProvider(config.ai.ollama.baseUrl, config.ai.ollama.model)
      default:
        return new ClaudeProvider(config.ai.claude.apiKey, config.ai.claude.model)
    }
  }

  getProvider(): AIProvider {
    return this.provider
  }

  switchProvider(config: AppConfig): void {
    this.config = config
    this.provider = this.createProvider(config)
  }

  async query(
    userMessage: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<string> {
    const systemMessage: Message = {
      role: 'system',
      content: this.config.ai.systemPrompt,
    }

    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    })

    const messages: Message[] = [systemMessage, ...this.conversationHistory]

    const fullText = await this.provider.stream(messages, onChunk)

    this.conversationHistory.push({
      role: 'assistant',
      content: fullText,
    })

    return fullText
  }

  async queryMessages(
    messages: Message[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<string> {
    const systemMessage: Message = {
      role: 'system',
      content: this.config.ai.systemPrompt,
    }

    const allMessages = [systemMessage, ...messages]
    return this.provider.stream(allMessages, onChunk)
  }

  clearHistory(): void {
    this.conversationHistory = []
  }

  isConfigured(): boolean {
    return this.provider.isConfigured()
  }
}
