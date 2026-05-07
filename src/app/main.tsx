import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@app/styles/index.css'
import App from './App.tsx'
import { clearAllStorage } from '@shared/lib'

// Make clearAllStorage available in dev console
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).clearAllStorage = clearAllStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
