import axios from 'axios'
import log from 'electron-log'

export class WidgetGenerator {
  constructor(private ollamaBaseUrl: string, private model: string) {}

  async generateHtml(title: string, description: string): Promise<string> {
    const prompt = `Generate a self-contained HTML widget for a JARVIS AI desktop assistant overlay.

Widget topic: "${title}"
What to show: "${description}"

Requirements:
- Single HTML file with inline CSS and JS
- Dark background: #020a14
- Text color: #00d4ff (cyan)
- Font: monospace
- Compact, information-dense layout
- No external dependencies (no CDN links)
- If showing a table, use clean borders with rgba(0,212,255,0.3)
- If showing a list, use cyan bullet points
- Max height fits in ~250px
- Return ONLY the HTML, no explanation

Example structure:
<html><head><style>body{background:#020a14;color:#00d4ff;font-family:monospace;margin:8px;font-size:12px}...</style></head><body>...</body></html>`

    try {
      const res = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
      }, { timeout: 30000 })

      const text: string = res.data.response ?? ''
      // Extract HTML from response
      const htmlMatch = text.match(/<html[\s\S]*<\/html>/i) ??
                        text.match(/<body[\s\S]*<\/body>/i)
      if (htmlMatch) return htmlMatch[0]
      // If no HTML tags, wrap raw text
      if (text.trim().startsWith('<')) return text
      return `<html><head><style>body{background:#020a14;color:#00d4ff;font-family:monospace;margin:8px;font-size:12px}</style></head><body>${text}</body></html>`
    } catch (err) {
      log.error('[WidgetGenerator] Failed:', err)
      return `<html><head><style>body{background:#020a14;color:#00d4ff;font-family:monospace;margin:8px;font-size:12px}</style></head><body><p>Widget generation failed</p></body></html>`
    }
  }
}
