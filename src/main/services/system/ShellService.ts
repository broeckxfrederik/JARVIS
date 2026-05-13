import { spawn } from 'child_process'
import { AppConfig } from '../config/schema'

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /format\s+[a-z]:/i,
  /del\s+\/[sf]/i,
  /shutdown/i,
  /mkfs/i,
  /dd\s+if=/i,
]

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number | null
  success: boolean
}

export class ShellService {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  updateConfig(config: AppConfig): void {
    this.config = config
  }

  private isDangerous(command: string): boolean {
    return DANGEROUS_PATTERNS.some(pattern => pattern.test(command))
  }

  async execute(command: string, timeoutMs = 30000): Promise<ShellResult> {
    if (!this.config.permissions.allowShellExecution) {
      return {
        stdout: '',
        stderr: 'Shell execution is disabled. Enable it in settings.',
        exitCode: -1,
        success: false,
      }
    }

    if (this.isDangerous(command)) {
      return {
        stdout: '',
        stderr: `Command blocked: potentially dangerous pattern detected.`,
        exitCode: -1,
        success: false,
      }
    }

    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''

      const isWindows = process.platform === 'win32'
      const args = isWindows
        ? ['-Command', command]
        : ['-c', command]
      const cmd = isWindows ? 'powershell.exe' : 'sh'

      const proc = spawn(cmd, args, {
        shell: false,
        env: process.env,
      })

      const timeout = setTimeout(() => {
        proc.kill()
        resolve({
          stdout,
          stderr: stderr + '\n[Process timed out]',
          exitCode: -1,
          success: false,
        })
      }, timeoutMs)

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        clearTimeout(timeout)
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          success: code === 0,
        })
      })

      proc.on('error', (err) => {
        clearTimeout(timeout)
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          success: false,
        })
      })
    })
  }
}
