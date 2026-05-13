import say from 'say'

export class TTSService {
  private isSpeaking = false

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isSpeaking = true
      say.speak(text, undefined, 1.0, (err) => {
        this.isSpeaking = false
        if (err) {
          // Non-fatal: TTS may not be available in all environments
          console.error('TTS error:', err)
          resolve()
        } else {
          resolve()
        }
      })
    })
  }

  stop(): void {
    try {
      say.stop()
    } catch {
      // ignore
    }
    this.isSpeaking = false
  }

  get speaking(): boolean {
    return this.isSpeaking
  }
}
