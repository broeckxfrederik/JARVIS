import log from 'electron-log'
import { AppConfig } from '../config/schema'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'
import { ClaudeProvider } from './ClaudeProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { OllamaProvider } from './OllamaProvider'

export class AIService {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  switchProvider(config: AppConfig): void {
    this.config = config
  }

  isConfigured(): boolean {
    return this.buildChain().some((p) => p.isConfigured())
  }

  /** Try each configured provider in order; fall back on rate-limit (429). */
  async queryMessages(
    messages: Message[],
    onChunk: (chunk: StreamChunk) => void,
    onProviderSwitch?: (providerName: string) => void
  ): Promise<string> {
    const systemMessage: Message = { role: 'system', content: this.config.ai.systemPrompt }
    const allMessages = [systemMessage, ...messages]
    const chain = this.buildChain()
    const errors: string[] = []

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i]

      if (!provider.isConfigured()) {
        log.info(`[AIService] Skipping ${provider.name} — not configured`)
        continue
      }

      log.info(`[AIService] Trying provider: ${provider.name}`)
      onProviderSwitch?.(provider.name)

      try {
        return await provider.stream(allMessages, onChunk)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)

        if (isRateLimited(err)) {
          log.warn(`[AIService] ${provider.name} rate limited — trying next provider`)
          errors.push(`${provider.name}: rate limited`)
          continue
        }

        if (isUnconfigured(err)) {
          log.warn(`[AIService] ${provider.name} not reachable — trying next provider`)
          errors.push(`${provider.name}: unreachable`)
          continue
        }

        // Unexpected error — surface immediately without cascading
        log.error(`[AIService] ${provider.name} failed:`, errMsg)
        throw err
      }
    }

    const summary = errors.join('; ')
    throw new Error(`All AI providers failed. ${summary}`)
  }

  private buildChain(): AIProvider[] {
    const { ai } = this.config
    const chain: AIProvider[] = []
    const seen = new Set<string>()

    // Primary provider first, then the rest of the chain
    const order = [ai.provider, ...ai.providerChain].filter((name) => {
      if (seen.has(name)) return false
      seen.add(name)
      return true
    })

    for (const name of order) {
      switch (name) {
        case 'claude':
          chain.push(new ClaudeProvider(ai.claude.apiKey, ai.claude.model))
          break
        case 'openai':
          chain.push(new OpenAIProvider(ai.openai.apiKey, ai.openai.model))
          break
        case 'ollama':
          chain.push(new OllamaProvider(ai.ollama.baseUrl, ai.ollama.model))
          break
      }
    }

    return chain
  }
}

function isRateLimited(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    return (err as { status: number }).status === 429
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')
  }
  return false
}

function isUnconfigured(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return (
      msg.includes('econnrefused') ||    // Ollama not running
      msg.includes('failed to fetch') ||
      msg.includes('placeholder')        // blank API key slipped through
    )
  }
  return false
}
