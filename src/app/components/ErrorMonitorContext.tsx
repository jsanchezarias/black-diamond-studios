import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AppError {
  id: string;
  tipo: 'critico' | 'advertencia' | 'info';
  categoria:
    | 'autenticacion'
    | 'base_datos'
    | 'componente'
    | 'red'
    | 'permisos'
    | 'realtime'
    | 'localStorage'
    | 'typescript'
    | 'router'
    | 'desconocido';
  mensaje: string;
  detalle?: string;
  archivo?: string;
  linea?: number;
  usuario?: string;
  rol?: string;
  timestamp: string;
  resuelto: boolean;
  stack?: string;
}

interface ErrorMonitorContextType {
  errores: AppError[];
  erroresCriticos: number;
  advertencias: number;
  agregarError: (error: Omit<AppError, 'id' | 'timestamp' | 'resuelto'>) => void;
  marcarResuelto: (id: string) => void;
  limpiarErrores: () => void;
}

const ErrorMonitorContext = createContext<ErrorMonitorContextType | undefined>(undefined);

// Bridge global: App.tsx puede llamar triggerGlobalError() sin estar dentro del provider
let _agregarError: ((e: Omit<AppError, 'id' | 'timestamp' | 'resuelto'>) => void) | null = null;

export function triggerGlobalError(error: Omit<AppError, 'id' | 'timestamp' | 'resuelto'>) {
  _agregarError?.(error);
}

export function ErrorMonitorProvider({ children }: { children: ReactNode }) {
  const [errores, setErrores] = useState<AppError[]>([]);

  const agregarError = useCallback((error: Omit<AppError, 'id' | 'timestamp' | 'resuelto'>) => {
    const newError: AppError = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      resuelto: false,
    };
    setErrores(prev => [newError, ...prev].slice(0, 200));
  }, []);

  const marcarResuelto = useCallback((id: string) => {
    setErrores(prev => prev.map(e => (e.id === id ? { ...e, resuelto: true } : e)));
  }, []);

  const limpiarErrores = useCallback(() => {
    setErrores([]);
  }, []);

  // Registrar la función en el bridge global cuando el provider esté montado
  useEffect(() => {
    _agregarError = agregarError;
    return () => {
      _agregarError = null;
    };
  }, [agregarError]);

  const erroresCriticos = errores.filter(e => e.tipo === 'critico' && !e.resuelto).length;
  const advertencias = errores.filter(e => e.tipo === 'advertencia' && !e.resuelto).length;

  return (
    <ErrorMonitorContext.Provider
      value={{ errores, erroresCriticos, advertencias, agregarError, marcarResuelto, limpiarErrores }}
    >
      {children}
    </ErrorMonitorContext.Provider>
  );
}

export function useErrorMonitor() {
  const context = useContext(ErrorMonitorContext);
  if (!context) throw new Error('useErrorMonitor debe usarse dentro de ErrorMonitorProvider');
  return context;
}
