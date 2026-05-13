import { spawn } from 'child_process'

export class VolumeService {
  async setVolume(level: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)))

    if (process.platform === 'win32') {
      await this.setVolumeWindows(clamped)
    } else if (process.platform === 'linux') {
      await this.setVolumeLinux(clamped)
    } else if (process.platform === 'darwin') {
      await this.setVolumeMac(clamped)
    }
  }

  private runCommand(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve) => {
      const proc = spawn(cmd, args, { shell: false })
      proc.on('close', () => resolve())
      proc.on('error', () => resolve()) // non-fatal
    })
  }

  private async setVolumeWindows(level: number): Promise<void> {
    // Use PowerShell to set system volume via Windows Audio API
    const script = `
$vol = [uint32](${level} / 100.0 * 65535)
$volHigh = $vol
$volLow = $vol
$combined = ($volHigh -shl 16) -bor $volLow
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinVol {
    [DllImport("winmm.dll")]
    public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);
}
'@
[WinVol]::waveOutSetVolume([IntPtr]::Zero, $combined)
`
    await this.runCommand('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
  }

  private async setVolumeLinux(level: number): Promise<void> {
    await this.runCommand('amixer', ['-q', 'set', 'Master', `${level}%`])
  }

  private async setVolumeMac(level: number): Promise<void> {
    const script = `set volume output volume ${level}`
    await this.runCommand('osascript', ['-e', script])
  }

  async getVolume(): Promise<number> {
    if (process.platform === 'win32') {
      return this.getVolumeWindows()
    }
    return 50 // fallback
  }

  private async getVolumeWindows(): Promise<number> {
    return new Promise((resolve) => {
      const script = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinVol {
    [DllImport("winmm.dll")]
    public static extern int waveOutGetVolume(IntPtr hwo, out uint dwVolume);
}
'@
$vol = 0
[WinVol]::waveOutGetVolume([IntPtr]::Zero, [ref]$vol)
$level = [uint32]($vol -band 0xFFFF)
[Math]::Round($level / 65535.0 * 100)
`
      const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
      let output = ''
      proc.stdout.on('data', (d: Buffer) => { output += d.toString() })
      proc.on('close', () => {
        const parsed = parseInt(output.trim(), 10)
        resolve(isNaN(parsed) ? 50 : parsed)
      })
      proc.on('error', () => resolve(50))
    })
  }
}
