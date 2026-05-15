import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { useJarvisStore } from './store/jarvisStore'

// Drive overlay visibility from the Page Visibility API.
// Electron fires visibilitychange when BrowserWindow.show()/hide() is called,
// so this works with zero IPC dependency and can never be missed.
document.addEventListener('visibilitychange', () => {
  useJarvisStore.getState().setVisible(document.visibilityState === 'visible')
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
