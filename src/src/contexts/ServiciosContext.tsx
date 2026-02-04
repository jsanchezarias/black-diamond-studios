import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Contexto de Servicios - Black Diamond Studios
// Sistema completo de gestión de servicios activos y finalizados

export interface Servicio {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  agendamientoId?: number | null;
  tipoServicio: 'Sede' | 'Domicilio';
  habitacion?: string;
  tiempoServicio: '30 minutos' | '1 hora' | 'rato' | 'varias horas' | 'amanecida';
  costoServicio: number;
  metodoPago: 'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Convenio';
  comprobantePago?: string;
  adicionales: string;
  costoAdicionales: number;
  consumo: string;
  costoConsumo: number;
  horaInicio: Date;
  horaFin?: Date;
  duracionMinutos: number;
  tiempoRestante: number;
  tiempoNegativo?: number;
  multaPorTiempoGenerada?: boolean;
  estado: 'activo' | 'finalizado';
  notasCierre?: string;
  notasServicio?: string;
  tiemposAdicionales?: {
    tiempo: string;
    costo: number;
    comprobante?: string;
    timestamp: Date;
  }[];
  adicionalesExtra?: {
    descripcion: string;
    costo: number;
    comprobante?: string;
    timestamp: Date;
  }[];
  consumosDetallados?: {
    descripcion: string;
    costo: number;
    cantidad: number;
    timestamp: Date;
  }[];
  editadoPorAdmin?: boolean;
  historialEdiciones?: {
    fecha: Date;
    tipoServicioAnterior: string;
    tiempoServicioAnterior: string;
    costoServicioAnterior: number;
    costoAdicionalesAnterior: number;
    costoConsumoAnterior: number;
    tipoServicioNuevo: string;
    tiempoServicioNuevo: string;
    costoServicioNuevo: number;
    costoAdicionalesNuevo: number;
    costoConsumoNuevo: number;
    motivoEdicion: string;
  }[];
}

interface ServiciosContextType {
  serviciosActivos: Servicio[];
  serviciosFinalizados: Servicio[];
  habitaciones: { numero: string; ocupada: boolean; servicio?: Servicio }[];
  iniciarServicio: (servicio: Omit<Servicio, 'id' | 'horaInicio' | 'tiempoRestante' | 'estado'>) => void;
  finalizarServicio: (id: string, notasCierre: string) => void;
  obtenerServicioActivo: (modeloEmail: string) => Servicio | undefined;
  actualizarTiempoRestante: () => void;
  agregarTiempoAdicional: (servicioId: number | string, data: { tiempoAdicional: string; costoAdicional: number; comprobante?: string }) => void;
  agregarAdicionalAServicio: (servicioId: number | string, data: { descripcion: string; costo: number; comprobante?: string }) => void;
  editarServicioFinalizado: (servicioId: string, datos: {
    tipoServicio: 'Sede' | 'Domicilio';
    tiempoServicio: '30 minutos' | '1 hora' | 'rato' | 'varias horas' | 'amanecida';
    costoServicio: number;
    costoAdicionales: number;
    costoConsumo: number;
    motivoEdicion: string;
  }) => void;
  serviciosHoy: number;
  serviciosMes: number;
  ingresosHoy: number;
  ingresosMes: number;
  productosVendidos: number;
  ventasBoutique: number;
}

const ServiciosContext = createContext<ServiciosContextType | undefined>(undefined);

const DURACIONES: Record<string, number> = {
  '30 minutos': 30,
  '1 hora': 60,
  'rato': 45,
  'varias horas': 180,
  'amanecida': 480,
};

const HABITACIONES_DISPONIBLES = ['101', '102', '201', '202', '203'];

export function ServiciosProvider({ children }: { children: ReactNode }) {
  const [serviciosActivos, setServiciosActivos] = useState<Servicio[]>([]);
  const [serviciosFinalizados, setServiciosFinalizados] = useState<Servicio[]>([]);
  const [multasGeneradas, setMultasGeneradas] = useState<Set<string>>(new Set());

  // ⚠️ NOTA: Este archivo ServiciosContext.tsx en /src/contexts/ parece estar duplicado.
  // El contexto activo está en /src/app/components/ServiciosContext.tsx que SÍ usa Supabase.
  // Este archivo puede estar obsoleto y debería verificarse si aún se usa.

  const iniciarServicio = (servicioData: Omit<Servicio, 'id' | 'horaInicio' | 'tiempoRestante' | 'estado'>) => {
    const duracionMinutos = DURACIONES[servicioData.tiempoServicio] || 60;
    const nuevoServicio: Servicio = {
      ...servicioData,
      id: `servicio-${Date.now()}`,
      horaInicio: new Date(),
      duracionMinutos,
      tiempoRestante: duracionMinutos * 60,
      estado: 'activo',
      tiempoNegativo: 0,
      multaPorTiempoGenerada: false,
    };
    setServiciosActivos(prev => [...prev, nuevoServicio]);
  };

  const finalizarServicio = (id: string, notasCierre: string) => {
    setServiciosActivos(prev => {
      const servicio = prev.find(s => s.id === id);
      if (servicio) {
        const servicioFinalizado: Servicio = {
          ...servicio,
          horaFin: new Date(),
          estado: 'finalizado',
          notasCierre,
          tiempoRestante: 0,
        };
        setServiciosFinalizados(prevFin => [...prevFin, servicioFinalizado]);
      }
      return prev.filter(s => s.id !== id);
    });
  };

  const obtenerServicioActivo = (modeloEmail: string): Servicio | undefined => {
    return serviciosActivos.find(s => s.modeloEmail === modeloEmail);
  };

  const actualizarTiempoRestante = () => {
    setServiciosActivos(prev => 
      prev.map(servicio => {
        const ahora = new Date();
        const tiempoTranscurrido = Math.floor((ahora.getTime() - servicio.horaInicio.getTime()) / 1000);
        const tiempoLimite = servicio.duracionMinutos * 60;
        const tiempoRestante = tiempoLimite - tiempoTranscurrido;
        const tiempoNegativo = tiempoRestante < 0 ? Math.abs(tiempoRestante) : 0;
        
        if (tiempoRestante === 300 && tiempoRestante > 0) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGi77eeeTRAMUKXh8LhjHAU4jtbxy34sBSh+zO/bkUALFF2z6OqnVRQKRp3e8r1sIQUrgc7y2Yk2BxhpvO3nnk0QDFA=');
          audio.play().catch(err => console.log('No se pudo reproducir la alarma:', err));
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Servicio por terminar', {
              body: `El servicio de ${servicio.modeloNombre} termina en 5 minutos`,
              icon: '/icon.png'
            });
          }
        }
        
        return { 
          ...servicio, 
          tiempoRestante: Math.max(0, tiempoRestante),
          tiempoNegativo
        };
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(actualizarTiempoRestante, 1000);
    return () => clearInterval(interval);
  }, []); // ✅ Sin dependencias - el interval se ejecuta siempre y actualizarTiempoRestante usa prevState

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const habitaciones = HABITACIONES_DISPONIBLES.map(numero => {
    const servicio = serviciosActivos.find(s => s.habitacion === numero);
    return {
      numero,
      ocupada: !!servicio,
      servicio,
    };
  });

  const agregarTiempoAdicional = (servicioId: number | string, data: { tiempoAdicional: string; costoAdicional: number; comprobante?: string }) => {
    setServiciosActivos(prev => 
      prev.map(servicio => {
        if (servicio.id === servicioId) {
          const nuevoTiempoAdicional = {
            tiempo: data.tiempoAdicional,
            costo: data.costoAdicional,
            comprobante: data.comprobante,
            timestamp: new Date(),
          };
          const tiemposAdicionales = servicio.tiemposAdicionales ? [...servicio.tiemposAdicionales, nuevoTiempoAdicional] : [nuevoTiempoAdicional];
          
          let minutosAdicionales = 0;
          if (data.tiempoAdicional === '30 minutos') {
            minutosAdicionales = 30;
          } else if (data.tiempoAdicional === '1 hora') {
            minutosAdicionales = 60;
          } else if (data.tiempoAdicional === '2 horas') {
            minutosAdicionales = 120;
          } else if (data.tiempoAdicional === 'Otra') {
            minutosAdicionales = 30;
          }
          
          const nuevaDuracionMinutos = servicio.duracionMinutos + minutosAdicionales;
          
          return { 
            ...servicio, 
            tiemposAdicionales,
            duracionMinutos: nuevaDuracionMinutos,
          };
        }
        return servicio;
      })
    );
  };

  const agregarAdicionalAServicio = (servicioId: number | string, data: { descripcion: string; costo: number; comprobante?: string }) => {
    setServiciosActivos(prev => 
      prev.map(servicio => {
        if (servicio.id === servicioId) {
          const nuevoAdicional = {
            descripcion: data.descripcion,
            costo: data.costo,
            comprobante: data.comprobante,
            timestamp: new Date(),
          };
          const adicionalesExtra = servicio.adicionalesExtra ? [...servicio.adicionalesExtra, nuevoAdicional] : [nuevoAdicional];
          return { ...servicio, adicionalesExtra };
        }
        return servicio;
      })
    );
  };

  const editarServicioFinalizado = (servicioId: string, datos: {
    tipoServicio: 'Sede' | 'Domicilio';
    tiempoServicio: '30 minutos' | '1 hora' | 'rato' | 'varias horas' | 'amanecida';
    costoServicio: number;
    costoAdicionales: number;
    costoConsumo: number;
    motivoEdicion: string;
  }) => {
    setServiciosFinalizados(prev => 
      prev.map(servicio => {
        if (servicio.id === servicioId) {
          const nuevaEdicion = {
            fecha: new Date(),
            tipoServicioAnterior: servicio.tipoServicio,
            tiempoServicioAnterior: servicio.tiempoServicio,
            costoServicioAnterior: servicio.costoServicio,
            costoAdicionalesAnterior: servicio.costoAdicionales,
            costoConsumoAnterior: servicio.costoConsumo,
            tipoServicioNuevo: datos.tipoServicio,
            tiempoServicioNuevo: datos.tiempoServicio,
            costoServicioNuevo: datos.costoServicio,
            costoAdicionalesNuevo: datos.costoAdicionales,
            costoConsumoNuevo: datos.costoConsumo,
            motivoEdicion: datos.motivoEdicion,
          };
          const historialEdiciones = servicio.historialEdiciones ? [...servicio.historialEdiciones, nuevaEdicion] : [nuevaEdicion];
          return { 
            ...servicio, 
            tipoServicio: datos.tipoServicio,
            tiempoServicio: datos.tiempoServicio,
            costoServicio: datos.costoServicio,
            costoAdicionales: datos.costoAdicionales,
            costoConsumo: datos.costoConsumo,
            editadoPorAdmin: true,
            historialEdiciones,
          };
        }
        return servicio;
      })
    );
  };

  // Cálculo de estadísticas en tiempo real
  const serviciosHoy = serviciosFinalizados.filter(s => 
    s.horaFin && new Date(s.horaFin).toDateString() === new Date().toDateString()
  ).length;

  const serviciosMes = serviciosFinalizados.filter(s => 
    s.horaFin && new Date(s.horaFin).getMonth() === new Date().getMonth() && 
    new Date(s.horaFin).getFullYear() === new Date().getFullYear()
  ).length;

  const ingresosHoy = serviciosFinalizados.reduce((total, s) => {
    if (s.horaFin && new Date(s.horaFin).toDateString() === new Date().toDateString()) {
      const tiemposAd = (s.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
      const adicionalesEx = (s.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
      const consumosDet = (s.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
      return total + s.costoServicio + s.costoAdicionales + s.costoConsumo + tiemposAd + adicionalesEx + consumosDet;
    }
    return total;
  }, 0);

  const ingresosMes = serviciosFinalizados.reduce((total, s) => {
    if (s.horaFin && 
        new Date(s.horaFin).getMonth() === new Date().getMonth() && 
        new Date(s.horaFin).getFullYear() === new Date().getFullYear()) {
      const tiemposAd = (s.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
      const adicionalesEx = (s.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
      const consumosDet = (s.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
      return total + s.costoServicio + s.costoAdicionales + s.costoConsumo + tiemposAd + adicionalesEx + consumosDet;
    }
    return total;
  }, 0);

  const productosVendidos = serviciosFinalizados.reduce((total, s) => {
    if (s.horaFin && 
        new Date(s.horaFin).getMonth() === new Date().getMonth() && 
        new Date(s.horaFin).getFullYear() === new Date().getFullYear()) {
      return total + (s.adicionalesExtra ? s.adicionalesExtra.length : 0);
    }
    return total;
  }, 0);

  const ventasBoutique = serviciosFinalizados.reduce((total, s) => {
    if (s.horaFin && 
        new Date(s.horaFin).getMonth() === new Date().getMonth() && 
        new Date(s.horaFin).getFullYear() === new Date().getFullYear()) {
      return total + s.costoConsumo;
    }
    return total;
  }, 0);

  return (
    <ServiciosContext.Provider
      value={{
        serviciosActivos,
        serviciosFinalizados,
        habitaciones,
        iniciarServicio,
        finalizarServicio,
        obtenerServicioActivo,
        actualizarTiempoRestante,
        agregarTiempoAdicional,
        agregarAdicionalAServicio,
        editarServicioFinalizado,
        serviciosHoy,
        serviciosMes,
        ingresosHoy,
        ingresosMes,
        productosVendidos,
        ventasBoutique,
      }}
    >
      {children}
    </ServiciosContext.Provider>
  );
}

export function useServicios() {
  const context = useContext(ServiciosContext);
  if (!context) {
    throw new Error('useServicios debe usarse dentro de ServiciosProvider');
  }
  return context;
}