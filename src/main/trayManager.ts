import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'

export function createTray(
  onToggle: () => void,
  onQuit: () => void
): Tray {
  let icon: Electron.NativeImage

  try {
    const iconPath = join(__dirname, '../../assets/icons/app-icon.png')
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  const tray = new Tray(icon)
  tray.setToolTip('JARVIS AI Overlay')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle JARVIS (Ctrl+Space)',
      click: onToggle,
    },
    { type: 'separator' },
    {
      label: 'Quit JARVIS',
      click: onQuit,
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    onToggle()
  })

  return tray
}
