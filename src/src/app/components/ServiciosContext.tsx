import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// 🎯 SERVICIO: Registro inmutable de un servicio realizado (o no realizado)
export interface Servicio {
  id: string;
  
  // 📅 Información temporal
  fecha: string;
  hora: string;
  duracionEstimadaMinutos: number;
  duracionRealMinutos?: number; // Duración real del servicio
  
  // 👤 Información del CLIENTE (snapshot del momento)
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  
  // 💃 Información de la MODELO (snapshot del momento)
  modeloEmail: string;
  modeloNombre: string;
  modeloId?: string;
  
  // 💰 Información de TARIFA y SERVICIO
  tipoServicio: 'sede' | 'domicilio';
  tarifaNombre: string;
  tarifaDescripcion?: string;
  montoPactado: number; // Monto original pactado
  
  // 💳 Información de PAGO
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  metodoPago?: string;
  transaccionId?: string;
  fechaPago?: string;
  comprobantePago?: string;
  montoPagado?: number; // Puede ser diferente al pactado (descuentos, propinas, etc)
  propina?: number;
  
  // 📊 ESTADO del servicio
  estado: 'completado' | 'cancelado' | 'no_show';
  
  // 📝 Notas y detalles
  notasPreServicio?: string; // Notas del agendamiento original
  notasPostServicio?: string; // Notas después del servicio
  
  // ⭐ Calificación (opcional)
  calificacionCliente?: number; // 1-5 estrellas
  reviewCliente?: string;
  calificacionModelo?: number; // La modelo califica al cliente
  reviewModelo?: string;
  
  // ❌ Información de CANCELACIÓN o NO_SHOW
  motivoCancelacion?: string;
  canceladoPor?: string; // 'cliente' | 'modelo' | 'admin' | 'sistema'
  fechaCancelacion?: string;
  
  // 💸 MULTA (si aplica por no_show)
  multaAplicada?: boolean;
  montoMulta?: number;
  motivoMulta?: string;
  multaPagada?: boolean;
  
  // 🕐 Metadatos
  fechaCreacion: string; // Cuándo se creó este registro de servicio
  creadoPor: string; // Quién lo creó (sistema, admin, etc)
  agendamientoId: string; // Referencia al agendamiento original
}

// 📊 POLÍTICA DE PENALIZACIÓN
export interface PoliticaPenalizacion {
  noShowsParaMulta: number; // Número de no_shows para aplicar multa
  noShowsParaBloqueo: number; // Número de no_shows para bloquear
  montoMultaBase: number; // Multa base por no_show
  porcentajeMultaSobreTarifa: number; // % de la tarifa como multa (ej: 50%)
  diasParaPagarMulta: number; // Días para pagar antes de bloqueo
}

interface ServiciosContextType {
  servicios: Servicio[];
  politicaPenalizacion: PoliticaPenalizacion;
  
  // CRUD de servicios
  crearServicio: (servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'creadoPor'>) => Promise<{ success: boolean, error?: any, data?: any }>;
  actualizarServicio: (id: string, servicio: Partial<Servicio>) => Promise<void>;
  obtenerServicioPorId: (id: string) => Servicio | undefined;
  
  // Consultas por cliente
  obtenerServiciosPorCliente: (clienteId: string) => Servicio[];
  obtenerNoShowsPorCliente: (clienteId: string) => Servicio[];
  contarNoShowsCliente: (clienteId: string) => number;
  obtenerMultasPendientesCliente: (clienteId: string) => Servicio[];
  calcularTotalMultasCliente: (clienteId: string) => number;
  
  // Consultas por modelo
  obtenerServiciosPorModelo: (modeloEmail: string) => Servicio[];
  obtenerIngresosModelo: (modeloEmail: string, fechaInicio?: string, fechaFin?: string) => number;
  
  // Conversión de agendamiento a servicio
  crearServicioDesdeAgendamiento: (agendamientoId: string, estado: 'completado' | 'cancelado' | 'no_show', datos?: Partial<Servicio>) => Promise<{ success: boolean, error?: any, data?: any }>;
  
  // Sistema de multas
  aplicarMultaPorNoShow: (servicioId: string) => Promise<void>;
  marcarMultaComoPagada: (servicioId: string) => Promise<void>;
  
  // Utilidades
  recargarServicios: () => Promise<void>;
}

const ServiciosContext = createContext<ServiciosContextType | undefined>(undefined);

// 🎯 Política de penalización por defecto
const POLITICA_DEFAULT: PoliticaPenalizacion = {
  noShowsParaMulta: 2, // Al 2do no_show se aplica multa
  noShowsParaBloqueo: 4, // Al 4to no_show se bloquea
  montoMultaBase: 50000, // $50k multa base
  porcentajeMultaSobreTarifa: 30, // 30% de la tarifa
  diasParaPagarMulta: 7, // 7 días para pagar
};

export function ServiciosProvider({ children }: { children: ReactNode }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [politicaPenalizacion] = useState<PoliticaPenalizacion>(POLITICA_DEFAULT);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      console.log('🔄 Cargando servicios desde servidor...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', errorText);
        setServicios([]);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const serviciosOrdenados = result.data.sort((a: Servicio, b: Servicio) => {
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        });

        setServicios(serviciosOrdenados);
        console.log(`✅ ${serviciosOrdenados.length} servicios cargados desde servidor`);
      } else {
        setServicios([]);
        console.log('📋 No hay servicios registrados');
      }
    } catch (error) {
      console.error('❌ Error cargando servicios:', error);
      setServicios([]);
    }
  };

  const crearServicio = async (servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'creadoPor'>) => {
    try {
      console.log('📝 Creando servicio...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(servicio),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error guardando servicio:', errorData);
        return { success: false, error: errorData };
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Servicio creado exitosamente');
        await cargarServicios();
        return { success: true, data: result.data };
      } else {
        console.error('❌ Error en respuesta del servidor:', result);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error en crearServicio:', error);
      return { success: false, error };
    }
  };

  const actualizarServicio = async (id: string, servicio: Partial<Servicio>) => {
    try {
      console.log('🔄 Actualizando servicio:', id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(servicio),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error actualizando servicio:', errorData);
        throw new Error(errorData.error || 'Error actualizando servicio');
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Servicio actualizado exitosamente');
        await cargarServicios();
      } else {
        throw new Error(result.error || 'Error actualizando servicio');
      }
    } catch (error) {
      console.error('❌ Error en actualizarServicio:', error);
      throw error;
    }
  };

  const obtenerServicioPorId = (id: string) => {
    return servicios.find(s => s.id === id);
  };

  const obtenerServiciosPorCliente = (clienteId: string) => {
    return servicios
      .filter(s => s.clienteId === clienteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const obtenerNoShowsPorCliente = (clienteId: string) => {
    return servicios.filter(s => s.clienteId === clienteId && s.estado === 'no_show');
  };

  const contarNoShowsCliente = (clienteId: string) => {
    return obtenerNoShowsPorCliente(clienteId).length;
  };

  const obtenerMultasPendientesCliente = (clienteId: string) => {
    return servicios.filter(s => 
      s.clienteId === clienteId && 
      s.multaAplicada === true && 
      s.multaPagada !== true
    );
  };

  const calcularTotalMultasCliente = (clienteId: string) => {
    const multasPendientes = obtenerMultasPendientesCliente(clienteId);
    return multasPendientes.reduce((total, s) => total + (s.montoMulta || 0), 0);
  };

  const obtenerServiciosPorModelo = (modeloEmail: string) => {
    return servicios
      .filter(s => s.modeloEmail === modeloEmail)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const obtenerIngresosModelo = (modeloEmail: string, fechaInicio?: string, fechaFin?: string) => {
    let serviciosModelo = servicios.filter(s => 
      s.modeloEmail === modeloEmail && 
      s.estado === 'completado' &&
      s.estadoPago === 'pagado'
    );

    if (fechaInicio) {
      serviciosModelo = serviciosModelo.filter(s => s.fecha >= fechaInicio);
    }
    if (fechaFin) {
      serviciosModelo = serviciosModelo.filter(s => s.fecha <= fechaFin);
    }

    return serviciosModelo.reduce((total, s) => total + (s.montoPagado || s.montoPactado), 0);
  };

  const crearServicioDesdeAgendamiento = async (
    agendamientoId: string, 
    estado: 'completado' | 'cancelado' | 'no_show',
    datos?: Partial<Servicio>
  ) => {
    try {
      console.log(`📝 Creando servicio desde agendamiento ${agendamientoId} con estado ${estado}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios/desde-agendamiento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agendamientoId,
            estado,
            ...datos,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error creando servicio desde agendamiento:', errorData);
        return { success: false, error: errorData };
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Servicio creado desde agendamiento exitosamente');
        await cargarServicios();
        return { success: true, data: result.data };
      } else {
        console.error('❌ Error en respuesta del servidor:', result);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error en crearServicioDesdeAgendamiento:', error);
      return { success: false, error };
    }
  };

  const aplicarMultaPorNoShow = async (servicioId: string) => {
    try {
      const servicio = obtenerServicioPorId(servicioId);
      if (!servicio) {
        throw new Error('Servicio no encontrado');
      }

      // Calcular multa
      const montoMulta = Math.max(
        politicaPenalizacion.montoMultaBase,
        servicio.montoPactado * (politicaPenalizacion.porcentajeMultaSobreTarifa / 100)
      );

      await actualizarServicio(servicioId, {
        multaAplicada: true,
        montoMulta,
        motivoMulta: `Multa por no presentarse al servicio. Política: ${politicaPenalizacion.porcentajeMultaSobreTarifa}% de la tarifa o mínimo $${politicaPenalizacion.montoMultaBase.toLocaleString()}`,
        multaPagada: false,
      });

      console.log(`💸 Multa de $${montoMulta.toLocaleString()} aplicada al servicio ${servicioId}`);
    } catch (error) {
      console.error('❌ Error aplicando multa:', error);
      throw error;
    }
  };

  const marcarMultaComoPagada = async (servicioId: string) => {
    try {
      await actualizarServicio(servicioId, {
        multaPagada: true,
      });

      console.log(`✅ Multa del servicio ${servicioId} marcada como pagada`);
    } catch (error) {
      console.error('❌ Error marcando multa como pagada:', error);
      throw error;
    }
  };

  const recargarServicios = async () => {
    await cargarServicios();
  };

  return (
    <ServiciosContext.Provider
      value={{
        servicios,
        politicaPenalizacion,
        crearServicio,
        actualizarServicio,
        obtenerServicioPorId,
        obtenerServiciosPorCliente,
        obtenerNoShowsPorCliente,
        contarNoShowsCliente,
        obtenerMultasPendientesCliente,
        calcularTotalMultasCliente,
        obtenerServiciosPorModelo,
        obtenerIngresosModelo,
        crearServicioDesdeAgendamiento,
        aplicarMultaPorNoShow,
        marcarMultaComoPagada,
        recargarServicios,
      }}
    >
      {children}
    </ServiciosContext.Provider>
  );
}

export function useServicios() {
  const context = useContext(ServiciosContext);
  if (context === undefined) {
    throw new Error('useServicios debe usarse dentro de ServiciosProvider');
  }
  return context;
}
