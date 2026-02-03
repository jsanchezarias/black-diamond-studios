import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './app/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('❌ Error capturado por ErrorBoundary:', error);
    console.error('❌ Error Info:', errorInfo);
    console.error('❌ Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Limpiar localStorage y recargar
    localStorage.removeItem('blackDiamondUser');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-red-950/20 border border-red-500/30 rounded-lg p-8 space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-red-500 mb-2">
                ⚠️ Error en la Aplicación
              </h1>
              <p className="text-gray-300">
                Ocurrió un error inesperado. Por favor revisa los detalles en la consola.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 p-4 rounded border border-red-500/20">
                <h2 className="text-red-400 font-semibold mb-2">Error:</h2>
                <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {this.state.errorInfo && (
              <details className="bg-black/40 p-4 rounded border border-red-500/20">
                <summary className="text-red-400 font-semibold cursor-pointer">
                  Stack Trace (click para expandir)
                </summary>
                <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700"
              >
                Reiniciar Aplicación
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Recargar Página
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 pt-4">
              <p>💡 Tip: Abre la consola del navegador (F12) para más detalles</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
