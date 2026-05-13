import { create } from 'zustand'

export type JarvisState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface JarvisStore {
  state: JarvisState
  messages: Message[]
  currentResponse: string
  isVisible: boolean
  inputText: string
  decoratorInfo: { appName: string; title: string } | null

  setState: (s: JarvisState) => void
  addMessage: (msg: Omit<Message, 'id'>) => void
  appendResponse: (delta: string) => void
  commitResponse: () => void
  clearCurrentResponse: () => void
  setVisible: (v: boolean) => void
  setInputText: (t: string) => void
  setDecoratorInfo: (info: { appName: string; title: string } | null) => void
}

export const useJarvisStore = create<JarvisStore>((set, get) => ({
  state: 'idle',
  messages: [],
  currentResponse: '',
  isVisible: false,
  inputText: '',
  decoratorInfo: null,

  setState: (state) => set({ state }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: `${Date.now()}-${Math.random()}` }],
    })),

  appendResponse: (delta) =>
    set((s) => ({ currentResponse: s.currentResponse + delta })),

  commitResponse: () =>
    set((s) => {
      if (!s.currentResponse) return s
      return {
        messages: [
          ...s.messages,
          {
            id: `${Date.now()}-${Math.random()}`,
            role: 'assistant' as const,
            content: s.currentResponse,
            timestamp: Date.now(),
          },
        ],
        currentResponse: '',
      }
    }),

  clearCurrentResponse: () => set({ currentResponse: '' }),

  setVisible: (isVisible) => set({ isVisible }),

  setInputText: (inputText) => set({ inputText }),

  setDecoratorInfo: (decoratorInfo) => set({ decoratorInfo }),
}))
