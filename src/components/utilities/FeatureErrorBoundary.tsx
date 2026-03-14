import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * FeatureErrorBoundary - Granular Error Boundary for Feature Modules
 * 
 * Unlike the global ErrorBoundary in App.tsx, this catches errors within
 * specific feature modules (COMMUNITY, ADMINISTRADOR, etc.) and displays
 * feature-specific fallback UI without affecting other features.
 * 
 * Problem it solves:
 * - If COMMUNITY feature crashes, entire RRHHLayout breaks
 * - With 10 developers, probability of errors increases
 * 
 * Solution:
 * - Isolate errors to their feature module
 * - Show graceful fallback UI per feature
 * - Continue app operation for other features
 * 
 * Usage:
 *   <FeatureErrorBoundary featureName="COMMUNITY">
 *     <CommunityDashboard />
 *   </FeatureErrorBoundary>
 */

export interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string; // e.g., "COMMUNITY", "ADMINISTRADOR", "RRHH"
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

export interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  public state: FeatureErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  /**
   * Update state so the next render will show the fallback UI
   */
  public static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  /**
   * Called after an error has been thrown by a descendant component
   * Log the error and trigger optional error callback
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo: errorInfo
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(
        `[FeatureErrorBoundary - ${this.props.featureName}] Error caught:`,
        error,
        errorInfo
      );
    }

    // Call optional error callback (e.g., to send to error tracking service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state - allows user to retry the feature
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚠️</span>
            </div>

            <h2 style={styles.title}>
              Oops! Error en {this.props.featureName}
            </h2>

            <p style={styles.message}>
              Ha ocurrido un error inesperado en el módulo {this.props.featureName}.
              El resto de la aplicación continúa funcionando normalmente.
            </p>

            <div style={styles.actions}>
              <button style={styles.retryButton} onClick={this.handleReset}>
                Intentar nuevamente
              </button>
              <button
                style={styles.backButton}
                onClick={() => window.history.back()}
              >
                Volver atrás
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>
                  Detalles técnicos (Desarrollo)
                </summary>
                <pre style={styles.errorText}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    `\n\n${'Component Stack:'}\n${this.state.errorInfo.componentStack}`
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline styles for FeatureErrorBoundary
 * Using inline styles to avoid CSS dependencies for critical UI
 */
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    margin: '1rem 0'
  } as React.CSSProperties,

  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    textAlign: 'center'
  } as React.CSSProperties,

  iconContainer: {
    marginBottom: '1rem'
  } as React.CSSProperties,

  icon: {
    fontSize: '3rem',
    display: 'inline-block'
  } as React.CSSProperties,

  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '0.5rem',
    margin: '0 0 0.5rem 0'
  } as React.CSSProperties,

  message: {
    fontSize: '1rem',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
    margin: '0 0 1.5rem 0'
  } as React.CSSProperties,

  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  } as React.CSSProperties,

  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  } as React.CSSProperties,

  backButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e9ecef',
    color: '#333',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  } as React.CSSProperties,

  details: {
    textAlign: 'left',
    marginTop: '1.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    overflow: 'hidden'
  } as React.CSSProperties,

  summary: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#495057',
    userSelect: 'none'
  } as React.CSSProperties,

  errorText: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    color: '#dc3545',
    fontSize: '0.8rem',
    fontFamily: "'Courier New', monospace",
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    margin: '0',
    overflowX: 'auto',
    maxHeight: '300px',
    overflowY: 'auto'
  } as React.CSSProperties
};
