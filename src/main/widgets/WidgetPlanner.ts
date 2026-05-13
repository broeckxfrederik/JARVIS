import axios from 'axios'
import log from 'electron-log'
import { AppConfig } from '../services/config/schema'
import { WidgetSpec } from './types'

export class WidgetPlanner {
  constructor(private config: AppConfig) {}

  async plan(query: string): Promise<WidgetSpec[]> {
    const prompt = `You are a widget planner for JARVIS AI assistant. Given a user query, return ONLY a JSON array of info panels to display alongside the chat answer. Return [] for simple queries (coding, math, opinions) that don't need visual panels.

Available widget types:
- weather: show current weather {"type":"weather","title":"Weather","location":"city name"}
- map: show a map {"type":"map","title":"Map","location":"city or place name"}
- info: show a fact card {"type":"info","title":"panel title","content":"2-3 sentences of key facts"}
- list: show a bulleted list {"type":"list","title":"panel title","items":["item1","item2","item3"]}
- custom: for anything else {"type":"custom","title":"panel title","description":"describe exactly what this widget should show, eg: a timeline of Antwerp's history, a table of Antwerp port statistics"}

Query: "${query}"

Return ONLY a valid JSON array. No explanation, no markdown, no code blocks. Example:
[{"type":"weather","title":"Antwerp Weather","location":"Antwerp"},{"type":"map","title":"Antwerp Map","location":"Antwerp, Belgium"},{"type":"info","title":"About Antwerp","content":"Antwerp is Belgium's second-largest city..."}]`

    // Try Groq first (fastest), then Gemini, then Ollama
    const result = await this.callFastest(prompt)
    return this.parse(result)
  }

  private async callFastest(prompt: string): Promise<string> {
    const { ai } = this.config

    // Try Groq
    if (ai.groq.apiKey && ai.groq.apiKey.length > 10) {
      try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: ai.groq.apiKey, baseURL: 'https://api.groq.com/openai/v1' })
        const res = await client.chat.completions.create({
          model: ai.groq.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        })
        return res.choices[0]?.message?.content ?? '[]'
      } catch (e) {
        log.warn('[WidgetPlanner] Groq failed:', e)
      }
    }

    // Try Gemini
    if (ai.gemini.apiKey && ai.gemini.apiKey.length > 10) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(ai.gemini.apiKey)
        const model = genAI.getGenerativeModel({ model: ai.gemini.model })
        const result = await model.generateContent(prompt)
        return result.response.text()
      } catch (e) {
        log.warn('[WidgetPlanner] Gemini failed:', e)
      }
    }

    // Fall back to Ollama
    try {
      const res = await axios.post(`${ai.ollama.baseUrl}/api/generate`, {
        model: ai.ollama.model,
        prompt,
        stream: false,
      })
      return res.data.response ?? '[]'
    } catch (e) {
      log.warn('[WidgetPlanner] Ollama failed:', e)
      return '[]'
    }
  }

  private parse(text: string): WidgetSpec[] {
    try {
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return []
      const parsed = JSON.parse(match[0])
      if (!Array.isArray(parsed)) return []
      return parsed.filter(w => w && typeof w.type === 'string').slice(0, 5) // max 5 widgets
    } catch {
      return []
    }
  }
}
