import { spawn } from 'child_process'
import { AppConfig } from '../config/schema'

const WIN_APP_MAP: Record<string, string> = {
  notepad: 'notepad.exe',
  calculator: 'calc.exe',
  paint: 'mspaint.exe',
  explorer: 'explorer.exe',
  'file explorer': 'explorer.exe',
  terminal: 'wt.exe',
  'windows terminal': 'wt.exe',
  cmd: 'cmd.exe',
  powershell: 'powershell.exe',
  chrome: 'chrome.exe',
  'google chrome': 'chrome.exe',
  firefox: 'firefox.exe',
  edge: 'msedge.exe',
  'microsoft edge': 'msedge.exe',
  discord: 'discord.exe',
  spotify: 'spotify.exe',
  vscode: 'code.exe',
  'visual studio code': 'code.exe',
  wordpad: 'wordpad.exe',
  'task manager': 'taskmgr.exe',
  settings: 'ms-settings:',
  'control panel': 'control.exe',
}

const LINUX_APP_MAP: Record<string, string> = {
  terminal: 'gnome-terminal',
  'file manager': 'nautilus',
  browser: 'xdg-open https://',
  firefox: 'firefox',
  chrome: 'google-chrome',
  vscode: 'code',
  'visual studio code': 'code',
}

export class AppLaunchService {
  private config: AppConfig | null = null

  constructor(config?: AppConfig) {
    this.config = config ?? null
  }

  updateConfig(config: AppConfig): void {
    this.config = config
  }

  async launch(appName: string): Promise<{ success: boolean; message: string }> {
    if (this.config && !this.config.permissions.allowAppLaunch) {
      return { success: false, message: 'App launching is disabled in settings.' }
    }

    const normalized = appName.toLowerCase().trim()

    if (process.platform === 'win32') {
      return this.launchWindows(normalized)
    } else if (process.platform === 'linux') {
      return this.launchLinux(normalized)
    } else if (process.platform === 'darwin') {
      return this.launchMac(appName)
    }

    return { success: false, message: `Unsupported platform: ${process.platform}` }
  }

  private launchWindows(appName: string): Promise<{ success: boolean; message: string }> {
    const command = WIN_APP_MAP[appName]

    return new Promise((resolve) => {
      if (!command) {
        // Try launching directly
        const proc = spawn('cmd.exe', ['/c', 'start', '', appName], {
          shell: false,
          detached: true,
          stdio: 'ignore',
        })
        proc.unref()
        proc.on('error', () => {
          resolve({ success: false, message: `Could not find app: ${appName}` })
        })
        proc.on('spawn', () => {
          resolve({ success: true, message: `Launching ${appName}...` })
        })
        return
      }

      const proc = spawn('cmd.exe', ['/c', 'start', '', command], {
        shell: false,
        detached: true,
        stdio: 'ignore',
      })
      proc.unref()
      proc.on('error', () => {
        resolve({ success: false, message: `Failed to launch ${appName}` })
      })
      proc.on('spawn', () => {
        resolve({ success: true, message: `Launching ${appName}...` })
      })
    })
  }

  private launchLinux(appName: string): Promise<{ success: boolean; message: string }> {
    const command = LINUX_APP_MAP[appName] ?? appName

    return new Promise((resolve) => {
      const parts = command.split(' ')
      const proc = spawn(parts[0], parts.slice(1), {
        detached: true,
        stdio: 'ignore',
      })
      proc.unref()
      proc.on('error', () => {
        resolve({ success: false, message: `Failed to launch ${appName}` })
      })
      proc.on('spawn', () => {
        resolve({ success: true, message: `Launching ${appName}...` })
      })
    })
  }

  private launchMac(appName: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const proc = spawn('open', ['-a', appName], {
        detached: true,
        stdio: 'ignore',
      })
      proc.unref()
      proc.on('error', () => {
        resolve({ success: false, message: `Failed to launch ${appName}` })
      })
      proc.on('spawn', () => {
        resolve({ success: true, message: `Launching ${appName}...` })
      })
    })
  }
}
