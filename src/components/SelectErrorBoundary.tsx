import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

/**
 * Error Boundary para capturar errores en el Select de Radix UI
 * Radix UI puede lanzar `throw null` en ciertas condiciones
 */
export class SelectErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    console.error('🚨 SelectErrorBoundary capturó error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 SelectErrorBoundary - Error completo:', {
      error,
      errorInfo,
      errorType: typeof error,
      errorValue: error,
      stack: errorInfo?.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-500 rounded bg-red-950/20 text-red-400">
          <p className="font-semibold">⚠️ Error en el selector</p>
          <p className="text-sm mt-1">
            {this.state.error instanceof Error 
              ? this.state.error.message 
              : `Error: ${String(this.state.error) || 'null'}`}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs underline"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
