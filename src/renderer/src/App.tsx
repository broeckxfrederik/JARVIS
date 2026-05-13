import { useEffect, useState } from 'react'
import { MainOverlay } from './components/hud/MainOverlay'
import { MiniHUD } from './components/hud/MiniHUD'
import { WindowFrame } from './components/decorator/WindowFrame'
import { WidgetCanvas } from './components/widgets/WidgetCanvas'
import { useJarvisStore } from './store/jarvisStore'

type View = 'overlay' | 'hud' | 'decorator' | 'canvas'

export default function App() {
  const [view, setView] = useState<View>('overlay')
  const decoratorInfo = useJarvisStore((s) => s.decoratorInfo)

  useEffect(() => {
    const updateView = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'hud') setView('hud')
      else if (hash === 'decorator') setView('decorator')
      else if (hash === 'canvas') setView('canvas')
      else setView('overlay')
    }
    updateView()
    window.addEventListener('hashchange', updateView)
    return () => window.removeEventListener('hashchange', updateView)
  }, [])

  // Wire decorator updates for the decorator window
  useEffect(() => {
    if (view !== 'decorator') return
    if (typeof window === 'undefined' || !window.jarvis) return

    const cleanup = window.jarvis.onDecoratorUpdate((info) => {
      useJarvisStore.getState().setDecoratorInfo(info)
    })
    return cleanup
  }, [view])

  if (view === 'hud') {
    return <MiniHUD />
  }

  if (view === 'canvas') {
    return <WidgetCanvas />
  }

  if (view === 'decorator') {
    if (!decoratorInfo) return null
    return (
      <WindowFrame
        appName={decoratorInfo.appName}
        title={decoratorInfo.title}
      />
    )
  }

  return <MainOverlay />
}
