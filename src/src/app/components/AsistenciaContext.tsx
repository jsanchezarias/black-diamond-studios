import { createContext, useContext, useState, ReactNode } from 'react';

export interface SolicitudEntrada {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  fecha: Date;
  selfieUrl: string; // URL de la selfie en Supabase Storage o base64
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentariosAdmin?: string;
  aprobadoPor?: string;
  fechaRespuesta?: Date;
}

export interface RegistroAsistencia {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  fecha: Date;
  horaLlegada: Date;
  horaSalida?: Date;
  horasTrabajadas?: number;
  estado: 'En Turno' | 'Finalizado';
  observaciones?: string;
  solicitudEntradaId?: string; // Referencia a la solicitud aprobada
}

interface AsistenciaContextType {
  registros: RegistroAsistencia[];
  solicitudesEntrada: SolicitudEntrada[];
  registrarLlegada: (modeloEmail: string, modeloNombre: string, observaciones?: string) => void;
  registrarSalida: (modeloEmail: string, observaciones?: string) => void;
  obtenerRegistroActual: (modeloEmail: string) => RegistroAsistencia | undefined;
  obtenerRegistrosPorModelo: (modeloEmail: string) => RegistroAsistencia[];
  obtenerRegistrosDelDia: () => RegistroAsistencia[];
  obtenerEstadisticas: (modeloEmail: string) => {
    totalDias: number;
    totalHoras: number;
    promedioHorasPorDia: number;
    diasEsteMes: number;
  };
  // Nuevas funciones para solicitudes de entrada
  crearSolicitudEntrada: (modeloEmail: string, modeloNombre: string, selfieUrl: string) => void;
  aprobarSolicitudEntrada: (solicitudId: string, aprobadoPor: string, comentarios?: string) => void;
  rechazarSolicitudEntrada: (solicitudId: string, rechazadoPor: string, comentarios: string) => void;
  obtenerSolicitudesPendientes: () => SolicitudEntrada[];
  obtenerSolicitudPorModelo: (modeloEmail: string) => SolicitudEntrada | undefined;
}

const AsistenciaContext = createContext<AsistenciaContextType | undefined>(undefined);

export function AsistenciaProvider({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [solicitudesEntrada, setSolicitudesEntrada] = useState<SolicitudEntrada[]>([]);

  // Crear solicitud de entrada con selfie
  const crearSolicitudEntrada = (modeloEmail: string, modeloNombre: string, selfieUrl: string) => {
    const nuevaSolicitud: SolicitudEntrada = {
      id: `solicitud-${Date.now()}`,
      modeloEmail,
      modeloNombre,
      fecha: new Date(),
      selfieUrl,
      estado: 'pendiente',
    };

    setSolicitudesEntrada(prev => [...prev, nuevaSolicitud]);
  };

  // Aprobar solicitud y registrar llegada automáticamente
  const aprobarSolicitudEntrada = (solicitudId: string, aprobadoPor: string, comentarios?: string) => {
    setSolicitudesEntrada(prev =>
      prev.map(solicitud => {
        if (solicitud.id === solicitudId && solicitud.estado === 'pendiente') {
          // Registrar la llegada automáticamente
          const nuevoRegistro: RegistroAsistencia = {
            id: `asistencia-${Date.now()}`,
            modeloEmail: solicitud.modeloEmail,
            modeloNombre: solicitud.modeloNombre,
            fecha: new Date(),
            horaLlegada: new Date(),
            estado: 'En Turno',
            solicitudEntradaId: solicitudId,
          };
          setRegistros(prev => [...prev, nuevoRegistro]);

          return {
            ...solicitud,
            estado: 'aprobada' as const,
            aprobadoPor,
            comentariosAdmin: comentarios,
            fechaRespuesta: new Date(),
          };
        }
        return solicitud;
      })
    );
  };

  // Rechazar solicitud
  const rechazarSolicitudEntrada = (solicitudId: string, rechazadoPor: string, comentarios: string) => {
    setSolicitudesEntrada(prev =>
      prev.map(solicitud => {
        if (solicitud.id === solicitudId && solicitud.estado === 'pendiente') {
          return {
            ...solicitud,
            estado: 'rechazada' as const,
            aprobadoPor: rechazadoPor,
            comentariosAdmin: comentarios,
            fechaRespuesta: new Date(),
          };
        }
        return solicitud;
      })
    );
  };

  // Obtener solicitudes pendientes
  const obtenerSolicitudesPendientes = (): SolicitudEntrada[] => {
    return solicitudesEntrada
      .filter(s => s.estado === 'pendiente')
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  };

  // Obtener solicitud de hoy por modelo (para verificar estado)
  const obtenerSolicitudPorModelo = (modeloEmail: string): SolicitudEntrada | undefined => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return solicitudesEntrada
      .filter(s => {
        const fechaSolicitud = new Date(s.fecha);
        fechaSolicitud.setHours(0, 0, 0, 0);
        return s.modeloEmail === modeloEmail && fechaSolicitud.getTime() === hoy.getTime();
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];
  };

  const registrarLlegada = (modeloEmail: string, modeloNombre: string, observaciones?: string) => {
    const nuevoRegistro: RegistroAsistencia = {
      id: `asistencia-${Date.now()}`,
      modeloEmail,
      modeloNombre,
      fecha: new Date(),
      horaLlegada: new Date(),
      estado: 'En Turno',
      observaciones,
    };

    setRegistros(prev => [...prev, nuevoRegistro]);
  };

  const registrarSalida = (modeloEmail: string, observaciones?: string) => {
    setRegistros(prev => 
      prev.map(registro => {
        if (
          registro.modeloEmail === modeloEmail && 
          registro.estado === 'En Turno'
        ) {
          const horaSalida = new Date();
          const horasTrabajadas = (horaSalida.getTime() - registro.horaLlegada.getTime()) / (1000 * 60 * 60);
          
          return {
            ...registro,
            horaSalida,
            horasTrabajadas,
            estado: 'Finalizado' as const,
            observaciones: observaciones || registro.observaciones,
          };
        }
        return registro;
      })
    );
  };

  const obtenerRegistroActual = (modeloEmail: string): RegistroAsistencia | undefined => {
    return registros.find(r => r.modeloEmail === modeloEmail && r.estado === 'En Turno');
  };

  const obtenerRegistrosPorModelo = (modeloEmail: string): RegistroAsistencia[] => {
    return registros
      .filter(r => r.modeloEmail === modeloEmail)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  };

  const obtenerRegistrosDelDia = (): RegistroAsistencia[] => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return registros.filter(r => {
      const fechaRegistro = new Date(r.fecha);
      fechaRegistro.setHours(0, 0, 0, 0);
      return fechaRegistro.getTime() === hoy.getTime();
    });
  };

  const obtenerEstadisticas = (modeloEmail: string) => {
    const registrosModelo = registros.filter(
      r => r.modeloEmail === modeloEmail && r.estado === 'Finalizado'
    );

    const totalDias = registrosModelo.length;
    const totalHoras = registrosModelo.reduce((sum, r) => sum + (r.horasTrabajadas || 0), 0);
    const promedioHorasPorDia = totalDias > 0 ? totalHoras / totalDias : 0;

    // Días este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const diasEsteMes = registrosModelo.filter(r => {
      const fechaRegistro = new Date(r.fecha);
      return fechaRegistro >= inicioMes;
    }).length;

    return {
      totalDias,
      totalHoras,
      promedioHorasPorDia,
      diasEsteMes,
    };
  };

  return (
    <AsistenciaContext.Provider
      value={{
        registros,
        solicitudesEntrada,
        registrarLlegada,
        registrarSalida,
        obtenerRegistroActual,
        obtenerRegistrosPorModelo,
        obtenerRegistrosDelDia,
        obtenerEstadisticas,
        // Nuevas funciones para solicitudes de entrada
        crearSolicitudEntrada,
        aprobarSolicitudEntrada,
        rechazarSolicitudEntrada,
        obtenerSolicitudesPendientes,
        obtenerSolicitudPorModelo,
      }}
    >
      {children}
    </AsistenciaContext.Provider>
  );
}

export function useAsistencia() {
  const context = useContext(AsistenciaContext);
  if (!context) {
    throw new Error('useAsistencia debe usarse dentro de AsistenciaProvider');
  }
  return context;
}