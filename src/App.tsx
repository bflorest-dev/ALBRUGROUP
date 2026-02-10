import './App.css'
import { MainLayout } from './components/templates/DashboardTemplate'
import { DataProvider } from './contexts/DataContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ErrorBoundary } from './components/molecules/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <NotificationProvider>
          <DataProvider>
            <MainLayout />
          </DataProvider>
        </NotificationProvider>
      </div>
    </ErrorBoundary>
  )
}

export default App
