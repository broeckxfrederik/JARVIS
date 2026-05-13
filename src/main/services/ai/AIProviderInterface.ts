export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamChunk {
  delta: string
  done: boolean
}

export interface AIProvider {
  readonly name: string
  isConfigured(): boolean
  complete(messages: Message[]): Promise<string>
  stream(messages: Message[], onChunk: (chunk: StreamChunk) => void): Promise<string>
}
