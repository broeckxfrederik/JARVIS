import screenshot from 'screenshot-desktop'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeFile } from 'fs/promises'

export class ScreenshotService {
  async capture(): Promise<string> {
    const imgBuffer = await screenshot({ format: 'png' })

    const filename = `jarvis-screenshot-${Date.now()}.png`
    const filePath = join(tmpdir(), filename)

    await writeFile(filePath, imgBuffer)

    return filePath
  }

  async captureToBuffer(): Promise<Buffer> {
    return screenshot({ format: 'png' }) as Promise<Buffer>
  }
}
