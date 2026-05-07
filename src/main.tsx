import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from '@app/App.tsx'
import { clearAllStorage } from '@shared/lib'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchInterval: 5000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

// Make clearAllStorage available in dev console
if (import.meta.env.DEV) {
  (window as any).clearAllStorage = clearAllStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </StrictMode>,
)
