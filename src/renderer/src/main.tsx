import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { useJarvisStore } from './store/jarvisStore'

// Register before React mounts so the listener is never deferred by React 18's
// scheduler on hidden/offscreen windows — eliminates the race on first hotkey.
if (typeof window !== 'undefined' && window.jarvis) {
  window.jarvis.onOverlayVisible((visible) => {
    useJarvisStore.getState().setVisible(visible)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
