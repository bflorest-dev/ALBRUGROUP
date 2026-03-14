import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Problema #10: Error Boundary Component
 * 
 * Catches React errors and displays graceful error UI
 * Prevents the entire app from crashing
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourApp />
 *   </ErrorBoundary>
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state
    this.setState(prev => ({
      ...prev,
      errorInfo
    }));

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container" style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>¡Oops! Algo salió mal</h1>
            <p style={styles.message}>
              Se ha producido un error inesperado. Por favor, intenta recargar la página.
            </p>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Detalles del Error</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`
                  )}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  content: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    padding: '40px',
    maxWidth: '500px',
    textAlign: 'center' as const
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#1F2937'
  },
  message: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    color: '#6B7280',
    lineHeight: '1.5'
  },
  details: {
    marginBottom: '24px',
    textAlign: 'left' as const,
    borderTop: '1px solid #E5E7EB',
    paddingTop: '16px'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '500',
    color: '#2563EB',
    marginBottom: '12px'
  },
  errorText: {
    background: '#F3F4F6',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    color: '#1F2937',
    fontFamily: '"Courier New", monospace'
  },
  button: {
    padding: '10px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    background: '#2563EB',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};
