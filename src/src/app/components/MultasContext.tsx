import { createContext, useContext, useState, ReactNode } from 'react';

export interface Multa {
  id: number;
  modeloId: number;
  modeloNombre: string;
  modeloEmail?: string; // Agregado para compatibilidad con el sistema
  concepto: string;
  monto: number;
  fecha: string;
  estado: 'pendiente' | 'pagada' | 'cancelada';
}

interface MultasContextType {
  multas: Multa[];
  agregarMulta: (multa: Omit<Multa, 'id' | 'fecha' | 'estado'>) => void;
  eliminarMulta: (id: number) => void;
  actualizarEstadoMulta: (id: number, estado: 'pendiente' | 'pagada' | 'cancelada') => void;
  obtenerMultasPorModelo: (modeloId: number) => Multa[];
  obtenerMultasPorEmail: (modeloEmail: string) => Multa[];
  obtenerTotalMultasPendientes: (modeloId: number) => number;
  obtenerTotalMultasPendientesPorEmail: (modeloEmail: string) => number;
}

const MultasContext = createContext<MultasContextType | undefined>(undefined);

export function MultasProvider({ children }: { children: ReactNode }) {
  // ✅ SIN DATOS DEMO - Sistema listo para producción
  const [multas, setMultas] = useState<Multa[]>([]);

  const agregarMulta = (multa: Omit<Multa, 'id' | 'fecha' | 'estado'>) => {
    const newId = Math.max(...multas.map(m => m.id), 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    
    setMultas(prev => [
      ...prev,
      {
        ...multa,
        id: newId,
        fecha: today,
        estado: 'pendiente',
      },
    ]);
  };

  const eliminarMulta = (id: number) => {
    setMultas(prev => prev.filter(m => m.id !== id));
  };

  const actualizarEstadoMulta = (id: number, estado: 'pendiente' | 'pagada' | 'cancelada') => {
    setMultas(prev => prev.map(m => (m.id === id ? { ...m, estado } : m)));
  };

  const obtenerMultasPorModelo = (modeloId: number) => {
    return multas.filter(m => m.modeloId === modeloId);
  };

  const obtenerMultasPorEmail = (modeloEmail: string) => {
    return multas.filter(m => m.modeloEmail === modeloEmail);
  };

  const obtenerTotalMultasPendientes = (modeloId: number) => {
    return multas
      .filter(m => m.modeloId === modeloId && m.estado === 'pendiente')
      .reduce((total, m) => total + m.monto, 0);
  };

  const obtenerTotalMultasPendientesPorEmail = (modeloEmail: string) => {
    return multas
      .filter(m => m.modeloEmail === modeloEmail && m.estado === 'pendiente')
      .reduce((total, m) => total + m.monto, 0);
  };

  return (
    <MultasContext.Provider
      value={{
        multas,
        agregarMulta,
        eliminarMulta,
        actualizarEstadoMulta,
        obtenerMultasPorModelo,
        obtenerMultasPorEmail,
        obtenerTotalMultasPendientes,
        obtenerTotalMultasPendientesPorEmail,
      }}
    >
      {children}
    </MultasContext.Provider>
  );
}

export function useMultas() {
  const context = useContext(MultasContext);
  if (context === undefined) {
    throw new Error('useMultas debe usarse dentro de MultasProvider');
  }
  return context;
}
