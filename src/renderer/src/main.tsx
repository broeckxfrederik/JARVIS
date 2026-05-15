import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { useJarvisStore } from './store/jarvisStore'

// Register hotkey toggle at module level so React StrictMode lifecycle never cleans it up.
// Main process sends an explicit boolean payload — no inversion needed.
if (typeof window !== 'undefined' && window.jarvis) {
  window.jarvis.onHotkeyToggle((visible: boolean) => {
    console.log(`[main.tsx] hotkey:toggle received. visible=${visible}`)
    try { window.jarvis.rendererLog?.(`main.tsx: hotkey:toggle received. visible=${visible}`) } catch {}
    useJarvisStore.getState().setVisible(visible)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
