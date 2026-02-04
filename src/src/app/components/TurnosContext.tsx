import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type EstadoModelo = 'Fuera de Turno' | 'Disponible' | 'En Servicio' | 'En Alimentación';

export interface RegistroTiempo {
  id: number;
  modeloEmail: string;
  tipo: 'entrada' | 'salida' | 'inicio_servicio' | 'fin_servicio' | 'inicio_alimentacion' | 'fin_alimentacion';
  timestamp: Date;
  nota?: string;
}

export interface Turno {
  id: number;
  modeloEmail: string;
  horaEntrada: Date | null;
  horaSalida: Date | null;
  estado: EstadoModelo;
  tiempoEnServicio: number; // en segundos
  tiempoEnAlimentacion: number; // en segundos
  tiempoDisponible: number; // en segundos
  registros: RegistroTiempo[];
}

interface TurnosContextType {
  turnos: Turno[];
  iniciarTurno: (modeloEmail: string) => void;
  finalizarTurno: (modeloEmail: string) => void;
  cambiarEstado: (modeloEmail: string, estado: EstadoModelo) => void;
  obtenerTurnoActual: (modeloEmail: string) => Turno | undefined;
  obtenerHistorialTurnos: (modeloEmail: string) => Turno[];
  obtenerEstadisticasTurnos: (modeloEmail: string) => {
    totalHorasTrabajadas: number;
    totalTiempoServicio: number;
    totalTiempoAlimentacion: number;
    totalTiempoDisponible: number;
    promedioEficiencia: number;
  };
}

const TurnosContext = createContext<TurnosContextType | undefined>(undefined);

export function TurnosProvider({ children }: { children: ReactNode }) {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  // Actualizar tiempos cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTurnos(prevTurnos => 
        prevTurnos.map(turno => {
          if (!turno.horaEntrada || turno.horaSalida) return turno;

          const ahora = new Date();
          const tiempoTranscurrido = Math.floor((ahora.getTime() - turno.horaEntrada.getTime()) / 1000);
          
          // Actualizar según el estado actual
          if (turno.estado === 'En Servicio') {
            return {
              ...turno,
              tiempoEnServicio: turno.tiempoEnServicio + 1,
            };
          } else if (turno.estado === 'En Alimentación') {
            return {
              ...turno,
              tiempoEnAlimentacion: turno.tiempoEnAlimentacion + 1,
            };
          } else if (turno.estado === 'Disponible') {
            return {
              ...turno,
              tiempoDisponible: turno.tiempoDisponible + 1,
            };
          }
          
          return turno;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const iniciarTurno = (modeloEmail: string) => {
    const turnoActivo = turnos.find(t => t.modeloEmail === modeloEmail && !t.horaSalida);
    
    if (turnoActivo) {
      // Ya hay un turno activo para esta modelo
      return;
    }

    const nuevoTurno: Turno = {
      id: Date.now(),
      modeloEmail,
      horaEntrada: new Date(),
      horaSalida: null,
      estado: 'Disponible',
      tiempoEnServicio: 0,
      tiempoEnAlimentacion: 0,
      tiempoDisponible: 0,
      registros: [
        {
          id: Date.now(),
          modeloEmail,
          tipo: 'entrada',
          timestamp: new Date(),
          nota: 'Inicio de turno',
        },
      ],
    };

    setTurnos(prev => [...prev, nuevoTurno]);
  };

  const finalizarTurno = (modeloEmail: string) => {
    setTurnos(prev => 
      prev.map(turno => {
        if (turno.modeloEmail === modeloEmail && !turno.horaSalida) {
          return {
            ...turno,
            horaSalida: new Date(),
            estado: 'Fuera de Turno',
            registros: [
              ...turno.registros,
              {
                id: Date.now(),
                modeloEmail,
                tipo: 'salida',
                timestamp: new Date(),
                nota: 'Fin de turno',
              },
            ],
          };
        }
        return turno;
      })
    );
  };

  const cambiarEstado = (modeloEmail: string, nuevoEstado: EstadoModelo) => {
    setTurnos(prev =>
      prev.map(turno => {
        if (turno.modeloEmail === modeloEmail && !turno.horaSalida) {
          const estadoAnterior = turno.estado;
          const nuevoRegistro: RegistroTiempo = {
            id: Date.now(),
            modeloEmail,
            tipo: nuevoEstado === 'En Servicio' 
              ? 'inicio_servicio' 
              : nuevoEstado === 'En Alimentación'
              ? 'inicio_alimentacion'
              : estadoAnterior === 'En Servicio'
              ? 'fin_servicio'
              : estadoAnterior === 'En Alimentación'
              ? 'fin_alimentacion'
              : 'entrada',
            timestamp: new Date(),
            nota: `Cambio de estado: ${estadoAnterior} → ${nuevoEstado}`,
          };

          return {
            ...turno,
            estado: nuevoEstado,
            registros: [...turno.registros, nuevoRegistro],
          };
        }
        return turno;
      })
    );
  };

  const obtenerTurnoActual = (modeloEmail: string) => {
    return turnos.find(t => t.modeloEmail === modeloEmail && !t.horaSalida);
  };

  const obtenerHistorialTurnos = (modeloEmail: string) => {
    return turnos.filter(t => t.modeloEmail === modeloEmail);
  };

  const obtenerEstadisticasTurnos = (modeloEmail: string) => {
    const turnosModelo = turnos.filter(t => t.modeloEmail === modeloEmail && t.horaSalida);
    
    if (turnosModelo.length === 0) {
      return {
        totalHorasTrabajadas: 0,
        totalTiempoServicio: 0,
        totalTiempoAlimentacion: 0,
        totalTiempoDisponible: 0,
        promedioEficiencia: 0,
      };
    }

    const totalTiempoServicio = turnosModelo.reduce((acc, t) => acc + t.tiempoEnServicio, 0);
    const totalTiempoAlimentacion = turnosModelo.reduce((acc, t) => acc + t.tiempoEnAlimentacion, 0);
    const totalTiempoDisponible = turnosModelo.reduce((acc, t) => acc + t.tiempoDisponible, 0);
    
    const totalHorasTrabajadas = turnosModelo.reduce((acc, turno) => {
      if (turno.horaEntrada && turno.horaSalida) {
        const duracion = (turno.horaSalida.getTime() - turno.horaEntrada.getTime()) / 1000;
        return acc + duracion;
      }
      return acc;
    }, 0);

    const promedioEficiencia = totalHorasTrabajadas > 0 
      ? (totalTiempoServicio / totalHorasTrabajadas) * 100 
      : 0;

    return {
      totalHorasTrabajadas,
      totalTiempoServicio,
      totalTiempoAlimentacion,
      totalTiempoDisponible,
      promedioEficiencia,
    };
  };

  return (
    <TurnosContext.Provider
      value={{
        turnos,
        iniciarTurno,
        finalizarTurno,
        cambiarEstado,
        obtenerTurnoActual,
        obtenerHistorialTurnos,
        obtenerEstadisticasTurnos,
      }}
    >
      {children}
    </TurnosContext.Provider>
  );
}

export function useTurnos() {
  const context = useContext(TurnosContext);
  if (context === undefined) {
    throw new Error('useTurnos debe usarse dentro de TurnosProvider');
  }
  return context;
}