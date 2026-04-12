import React, { Component, ErrorInfo, ReactNode } from 'react';

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

  static getDerivedStateFromError(error: any): State {
    // ✅ Manejar errores null o undefined
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 getDerivedStateFromError recibió:', error);
      console.error('🚨 Tipo de error:', typeof error);
    }
    
    // Crear un Error objeto si recibimos null o undefined
    const errorObj = error instanceof Error 
      ? error 
      : new Error(error ? String(error) : 'Unknown runtime error');
    
    return { hasError: true, error: errorObj };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ErrorBoundary capturó un error:', error);
      console.error('🚨 Stack trace:', errorInfo.componentStack);
    }
    
    // Crear un Error objeto si recibimos null o undefined
    const errorObj = error instanceof Error 
      ? error 
      : new Error(error ? String(error) : 'Unknown runtime error (null/undefined thrown)');
    
    this.setState({
      error: errorObj,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Renderizar fallback personalizado o uno por defecto
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen w-full flex items-center justify-center p-8" 
          style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}
        >
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 
              className="text-3xl font-bold mb-4" 
              style={{ fontFamily: 'Playfair Display, serif', color: '#c9a961' }}
            >
              Algo salió mal
            </h1>
            <p className="text-lg mb-6">
              La aplicación encontró un error inesperado.
            </p>
            
            {this.state.error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-left">
                <p className="font-mono text-sm text-red-300 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
                      Ver detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-96">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#c9a961', color: '#0f1014' }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
