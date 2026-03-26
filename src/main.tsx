import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@app/App.tsx'
import { clearAllStorage } from '@shared/lib'

// Make clearAllStorage available in dev console
if (import.meta.env.DEV) {
  (window as any).clearAllStorage = clearAllStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
