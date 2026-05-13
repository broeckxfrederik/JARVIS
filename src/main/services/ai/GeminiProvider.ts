import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { AIProvider, Message, StreamChunk } from './AIProviderInterface'

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private genAI: GoogleGenerativeAI
  private model: string
  private apiKey: string

  constructor(apiKey: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey
    this.model = model
    this.genAI = new GoogleGenerativeAI(apiKey || 'placeholder')
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10)
  }

  async complete(messages: Message[]): Promise<string> {
    const { systemInstruction, history, lastUserMessage } = this.splitMessages(messages)
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction,
      safetySettings: SAFETY,
    })
    const chat = genModel.startChat({ history })
    const result = await chat.sendMessage(lastUserMessage)
    return result.response.text()
  }

  async stream(messages: Message[], onChunk: (chunk: StreamChunk) => void): Promise<string> {
    const { systemInstruction, history, lastUserMessage } = this.splitMessages(messages)
    if (!lastUserMessage.trim()) {
      throw new Error('GeminiProvider: no user message to send')
    }
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction,
      safetySettings: SAFETY,
    })
    const chat = genModel.startChat({ history })
    const result = await chat.sendMessageStream(lastUserMessage)

    let fullText = ''
    for await (const chunk of result.stream) {
      const delta = chunk.text()
      if (delta) {
        fullText += delta
        onChunk({ delta, done: false })
      }
    }

    onChunk({ delta: '', done: true })
    return fullText
  }

  private splitMessages(messages: Message[]) {
    const systemMsg = messages.find((m) => m.role === 'system')
    const chatMessages = messages.filter((m) => m.role !== 'system')

    // Gemini requires alternating user/model turns; last message must be user
    const lastUserMessage = chatMessages.at(-1)?.content ?? ''
    const historyMessages = chatMessages.slice(0, -1)

    const history = historyMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    return {
      systemInstruction: systemMsg?.content,
      history,
      lastUserMessage,
    }
  }
}
