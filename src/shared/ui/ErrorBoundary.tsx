import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Render error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  render(): React.ReactNode {
    const { children, fallback, showDetails } = this.props;
    const shouldShowDetails = showDetails ?? import.meta.env.DEV;

    if (!this.state.hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <div role="alert" style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 12 }}>Se produjo un error inesperado.</h1>
        <p style={{ marginBottom: 12 }}>
          Recarga la pagina y vuelve a intentarlo. Si el problema persiste, revisa la consola.
        </p>
        {shouldShowDetails && this.state.error ? (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12 }}>
            {this.state.error.stack || this.state.error.message}
          </pre>
        ) : null}
      </div>
    );
  }
}
