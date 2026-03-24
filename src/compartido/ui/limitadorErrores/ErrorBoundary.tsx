import { Component, type ErrorInfo, type ReactNode } from 'react';
// CSS removed in refactoring
// import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registrar el error en un servicio de reporte de errores
    console.error('ErrorBoundary capturó un error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Aquí podrías enviar el error a un servicio como Sentry, LogRocket, etc.
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Renderizar la UI alternativa
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">¡Ups! Algo salió mal</h2>
            <p className="error-boundary__message">
              Ha ocurrido un error inesperado en la aplicación. Nuestros desarrolladores han sido notificados.
            </p>

            <div className="error-boundary__actions">
              <button
                className="error-boundary__retry-btn"
                onClick={this.handleRetry}
              >
                Intentar nuevamente
              </button>
              <button
                className="error-boundary__reload-btn"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Detalles técnicos (desarrollo)</summary>
                <pre className="error-boundary__error">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
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
