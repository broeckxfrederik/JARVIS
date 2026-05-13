import { z } from 'zod'

export const ConfigSchema = z.object({
  ai: z.object({
    provider: z.enum(['gemini', 'groq', 'ollama']).default('gemini'),
    providerChain: z.array(z.enum(['gemini', 'groq', 'ollama'])).default(['gemini', 'groq', 'ollama']),
    gemini: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('gemini-1.5-flash'),
    }).default({}),
    groq: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('llama-3.3-70b-versatile'),
    }).default({}),
    ollama: z.object({
      baseUrl: z.string().default('http://localhost:11434'),
      model: z.string().default('llama3'),
    }).default({}),
    systemPrompt: z.string().default(
      'You are JARVIS, an intelligent AI assistant. Be concise, helpful, and slightly witty. ' +
      'Respond in short paragraphs. You can help with system tasks, answer questions, and control the computer.'
    ),
  }).default({}),
  voice: z.object({
    wakeWordEnabled: z.boolean().default(false),
    sttProvider: z.enum(['whisper-api']).default('whisper-api'),
    ttsProvider: z.enum(['os-native']).default('os-native'),
    picovoiceApiKey: z.string().default(''),
  }).default({}),
  hotkey: z.object({
    toggle: z.string().default('Ctrl+Space'),
  }).default({}),
  ui: z.object({
    opacity: z.number().min(0).max(1).default(0.92),
    hudPosition: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
    theme: z.enum(['blue', 'green', 'red']).default('blue'),
  }).default({}),
  permissions: z.object({
    allowShellExecution: z.boolean().default(false),
    allowFileOperations: z.boolean().default(true),
    allowAppLaunch: z.boolean().default(true),
  }).default({}),
  decorator: z.object({
    enabled: z.boolean().default(true),
  }).default({}),
})

export type AppConfig = z.infer<typeof ConfigSchema>
