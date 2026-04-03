import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';

export interface Servicio {
  id: string;
  fecha: string;
  hora: string;
  duracionEstimadaMinutos: number;
  duracionRealMinutos?: number;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  modeloEmail: string;
  modeloNombre: string;
  modeloId?: string;
  tipoServicio: 'sede' | 'domicilio';
  tarifaNombre: string;
  tarifaDescripcion?: string;
  montoPactado: number;
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  metodoPago?: string;
  transaccionId?: string;
  fechaPago?: string;
  comprobantePago?: string;
  montoPagado?: number;
  propina?: number;
  estado: 'completado' | 'cancelado' | 'no_show';
  notasPreServicio?: string;
  notasPostServicio?: string;
  calificacionCliente?: number;
  reviewCliente?: string;
  calificacionModelo?: number;
  reviewModelo?: string;
  motivoCancelacion?: string;
  canceladoPor?: string;
  fechaCancelacion?: string;
  multaAplicada?: boolean;
  montoMulta?: number;
  motivoMulta?: string;
  multaPagada?: boolean;
  fechaCreacion: string;
  creadoPor: string;
  agendamientoId: string;
}

export interface PoliticaPenalizacion {
  noShowsParaMulta: number;
  noShowsParaBloqueo: number;
  montoMultaBase: number;
  porcentajeMultaSobreTarifa: number;
  diasParaPagarMulta: number;
}

interface ServiciosContextType {
  servicios: Servicio[];
  politicaPenalizacion: PoliticaPenalizacion;
  crearServicio: (servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'creadoPor'>) => Promise<{ success: boolean, error?: any, data?: any }>;
  actualizarServicio: (id: string, servicio: Partial<Servicio>) => Promise<void>;
  obtenerServicioPorId: (id: string) => Servicio | undefined;
  obtenerServiciosPorCliente: (clienteId: string) => Servicio[];
  obtenerNoShowsPorCliente: (clienteId: string) => Servicio[];
  contarNoShowsCliente: (clienteId: string) => number;
  obtenerMultasPendientesCliente: (clienteId: string) => Servicio[];
  calcularTotalMultasCliente: (clienteId: string) => number;
  obtenerServiciosPorModelo: (modeloEmail: string) => Servicio[];
  obtenerIngresosModelo: (modeloEmail: string, fechaInicio?: string, fechaFin?: string) => number;
  crearServicioDesdeAgendamiento: (agendamientoId: string, estado: 'completado' | 'cancelado' | 'no_show', datos?: Partial<Servicio>) => Promise<{ success: boolean, error?: any, data?: any }>;
  aplicarMultaPorNoShow: (servicioId: string) => Promise<void>;
  marcarMultaComoPagada: (servicioId: string) => Promise<void>;
  recargarServicios: () => Promise<void>;
}

const ServiciosContext = createContext<ServiciosContextType | undefined>(undefined);

const POLITICA_DEFAULT: PoliticaPenalizacion = {
  noShowsParaMulta: 2,
  noShowsParaBloqueo: 4,
  montoMultaBase: 50000,
  porcentajeMultaSobreTarifa: 30,
  diasParaPagarMulta: 7,
};

// Mapper: DB row → Servicio
function rowToServicio(row: any): Servicio {
  return {
    id: row.id,
    fecha: row.fecha ?? '',
    hora: row.hora ?? '',
    duracionEstimadaMinutos: row.duracion_estimada_minutos ?? row.duracion ?? 60,
    duracionRealMinutos: row.duracion_real_minutos,
    clienteId: row.cliente_id ?? '',
    clienteNombre: row.cliente_nombre ?? '',
    clienteTelefono: row.cliente_telefono ?? '',
    clienteEmail: row.cliente_email,
    modeloEmail: row.modelo_email ?? '',
    modeloNombre: row.modelo_nombre ?? '',
    modeloId: row.modelo_id,
    tipoServicio: row.tipo_servicio ?? 'sede',
    tarifaNombre: row.tarifa_nombre ?? row.servicio ?? '',
    tarifaDescripcion: row.tarifa_descripcion,
    montoPactado: row.monto_pactado ?? row.monto ?? 0,
    estadoPago: row.estado_pago ?? 'pendiente',
    metodoPago: row.metodo_pago,
    transaccionId: row.transaccion_id,
    fechaPago: row.fecha_pago,
    comprobantePago: row.comprobante_pago,
    montoPagado: row.monto_pagado,
    propina: row.propina,
    estado: row.estado ?? 'completado',
    notasPreServicio: row.notas_pre_servicio ?? row.notas,
    notasPostServicio: row.notas_post_servicio,
    calificacionCliente: row.calificacion_cliente,
    reviewCliente: row.review_cliente,
    calificacionModelo: row.calificacion_modelo ?? row.calificacion,
    reviewModelo: row.review_modelo,
    motivoCancelacion: row.motivo_cancelacion,
    canceladoPor: row.cancelado_por,
    fechaCancelacion: row.fecha_cancelacion,
    multaAplicada: row.multa_aplicada ?? false,
    montoMulta: row.monto_multa,
    motivoMulta: row.motivo_multa,
    multaPagada: row.multa_pagada ?? false,
    fechaCreacion: row.fecha_creacion ?? row.created_at ?? new Date().toISOString(),
    creadoPor: row.creado_por ?? 'sistema',
    agendamientoId: row.agendamiento_id ?? '',
  };
}

// Mapper: Servicio → DB row
function servicioToRow(s: Partial<Servicio>): Record<string, any> {
  const row: Record<string, any> = {};
  if (s.fecha !== undefined) row.fecha = s.fecha;
  if (s.hora !== undefined) row.hora = s.hora;
  if (s.duracionEstimadaMinutos !== undefined) row.duracion_estimada_minutos = s.duracionEstimadaMinutos;
  if (s.duracionRealMinutos !== undefined) row.duracion_real_minutos = s.duracionRealMinutos;
  if (s.clienteId !== undefined) row.cliente_id = s.clienteId;
  if (s.clienteNombre !== undefined) row.cliente_nombre = s.clienteNombre;
  if (s.clienteTelefono !== undefined) row.cliente_telefono = s.clienteTelefono;
  if (s.clienteEmail !== undefined) row.cliente_email = s.clienteEmail;
  if (s.modeloEmail !== undefined) row.modelo_email = s.modeloEmail;
  if (s.modeloNombre !== undefined) row.modelo_nombre = s.modeloNombre;
  if (s.modeloId !== undefined) row.modelo_id = s.modeloId;
  if (s.tipoServicio !== undefined) row.tipo_servicio = s.tipoServicio;
  if (s.tarifaNombre !== undefined) row.tarifa_nombre = s.tarifaNombre;
  if (s.tarifaDescripcion !== undefined) row.tarifa_descripcion = s.tarifaDescripcion;
  if (s.montoPactado !== undefined) row.monto_pactado = s.montoPactado;
  if (s.estadoPago !== undefined) row.estado_pago = s.estadoPago;
  if (s.metodoPago !== undefined) row.metodo_pago = s.metodoPago;
  if (s.montoPagado !== undefined) row.monto_pagado = s.montoPagado;
  if (s.propina !== undefined) row.propina = s.propina;
  if (s.estado !== undefined) row.estado = s.estado;
  if (s.notasPreServicio !== undefined) row.notas_pre_servicio = s.notasPreServicio;
  if (s.notasPostServicio !== undefined) row.notas_post_servicio = s.notasPostServicio;
  if (s.calificacionCliente !== undefined) row.calificacion_cliente = s.calificacionCliente;
  if (s.calificacionModelo !== undefined) row.calificacion_modelo = s.calificacionModelo;
  if (s.motivoCancelacion !== undefined) row.motivo_cancelacion = s.motivoCancelacion;
  if (s.canceladoPor !== undefined) row.cancelado_por = s.canceladoPor;
  if (s.fechaCancelacion !== undefined) row.fecha_cancelacion = s.fechaCancelacion;
  if (s.multaAplicada !== undefined) row.multa_aplicada = s.multaAplicada;
  if (s.montoMulta !== undefined) row.monto_multa = s.montoMulta;
  if (s.motivoMulta !== undefined) row.motivo_multa = s.motivoMulta;
  if (s.multaPagada !== undefined) row.multa_pagada = s.multaPagada;
  if (s.agendamientoId !== undefined) row.agendamiento_id = s.agendamientoId;
  if (s.creadoPor !== undefined) row.creado_por = s.creadoPor;
  return row;
}

export function ServiciosProvider({ children }: { children: ReactNode }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [politicaPenalizacion] = useState<PoliticaPenalizacion>(POLITICA_DEFAULT);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      // Intentar desde servicios_modelo (tabla existente en Supabase)
      const { data, error } = await supabase
        .from('servicios_modelo')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando servicios:', error.message);
        setServicios([]);
        return;
      }

      const formateados = (data ?? []).map(rowToServicio);
      setServicios(formateados);
      console.log(`✅ ${formateados.length} servicios cargados`);
    } catch (error) {
      console.error('❌ Error inesperado cargando servicios:', error);
      setServicios([]);
    }
  };

  const crearServicio = async (servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'creadoPor'>) => {
    try {
      const row = {
        ...servicioToRow(servicio),
        creado_por: 'sistema',
        fecha_creacion: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('servicios_modelo')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando servicio:', error.message);
        return { success: false, error };
      }

      const nuevo = rowToServicio(data);
      setServicios(prev => [nuevo, ...prev]);
      return { success: true, data: nuevo };
    } catch (error) {
      console.error('❌ Error en crearServicio:', error);
      return { success: false, error };
    }
  };

  const actualizarServicio = async (id: string, servicio: Partial<Servicio>) => {
    try {
      const row = servicioToRow(servicio);

      const { error } = await supabase
        .from('servicios_modelo')
        .update(row)
        .eq('id', id);

      if (error) throw new Error(error.message);

      setServicios(prev => prev.map(s => s.id === id ? { ...s, ...servicio } : s));
    } catch (error) {
      console.error('❌ Error en actualizarServicio:', error);
      throw error;
    }
  };

  const obtenerServicioPorId = (id: string) => servicios.find(s => s.id === id);

  const obtenerServiciosPorCliente = (clienteId: string) =>
    servicios.filter(s => s.clienteId === clienteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const obtenerNoShowsPorCliente = (clienteId: string) =>
    servicios.filter(s => s.clienteId === clienteId && s.estado === 'no_show');

  const contarNoShowsCliente = (clienteId: string) =>
    obtenerNoShowsPorCliente(clienteId).length;

  const obtenerMultasPendientesCliente = (clienteId: string) =>
    servicios.filter(s => s.clienteId === clienteId && s.multaAplicada && !s.multaPagada);

  const calcularTotalMultasCliente = (clienteId: string) =>
    obtenerMultasPendientesCliente(clienteId).reduce((t, s) => t + (s.montoMulta || 0), 0);

  const obtenerServiciosPorModelo = (modeloEmail: string) =>
    servicios.filter(s => s.modeloEmail === modeloEmail)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const obtenerIngresosModelo = (modeloEmail: string, fechaInicio?: string, fechaFin?: string) => {
    let lista = servicios.filter(s =>
      s.modeloEmail === modeloEmail && s.estado === 'completado' && s.estadoPago === 'pagado'
    );
    if (fechaInicio) lista = lista.filter(s => s.fecha >= fechaInicio);
    if (fechaFin) lista = lista.filter(s => s.fecha <= fechaFin);
    return lista.reduce((t, s) => t + (s.montoPagado ?? s.montoPactado), 0);
  };

  const crearServicioDesdeAgendamiento = async (
    agendamientoId: string,
    estado: 'completado' | 'cancelado' | 'no_show',
    datos?: Partial<Servicio>
  ) => {
    try {
      // Obtener datos del agendamiento
      const { data: ag, error: agError } = await supabase
        .from('agendamientos')
        .select('*')
        .eq('id', agendamientoId)
        .single();

      if (agError || !ag) {
        return { success: false, error: 'Agendamiento no encontrado' };
      }

      const servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'creadoPor'> = {
        fecha: ag.fecha,
        hora: ag.hora,
        duracionEstimadaMinutos: ag.duracion_minutos ?? ag.duracion ?? 60,
        clienteId: ag.cliente_id ?? '',
        clienteNombre: ag.cliente_nombre ?? '',
        clienteTelefono: ag.cliente_telefono ?? '',
        modeloEmail: ag.modelo_email ?? '',
        modeloNombre: ag.modelo_nombre ?? '',
        tipoServicio: ag.tipo_servicio ?? 'sede',
        tarifaNombre: ag.tarifa_nombre ?? ag.servicio ?? 'Servicio',
        montoPactado: ag.monto_pago ?? ag.precio ?? 0,
        estadoPago: ag.estado_pago ?? 'pendiente',
        estado,
        agendamientoId,
        motivoCancelacion: estado !== 'completado' ? ag.motivo_cancelacion : undefined,
        canceladoPor: estado !== 'completado' ? ag.cancelado_por : undefined,
        ...datos,
      };

      return await crearServicio(servicio);
    } catch (error) {
      console.error('❌ Error en crearServicioDesdeAgendamiento:', error);
      return { success: false, error };
    }
  };

  const aplicarMultaPorNoShow = async (servicioId: string) => {
    const servicio = obtenerServicioPorId(servicioId);
    if (!servicio) throw new Error('Servicio no encontrado');
    const montoMulta = Math.max(
      politicaPenalizacion.montoMultaBase,
      servicio.montoPactado * (politicaPenalizacion.porcentajeMultaSobreTarifa / 100)
    );
    await actualizarServicio(servicioId, {
      multaAplicada: true,
      montoMulta,
      motivoMulta: `No-show. Multa: ${politicaPenalizacion.porcentajeMultaSobreTarifa}% o mínimo $${politicaPenalizacion.montoMultaBase.toLocaleString()}`,
      multaPagada: false,
    });
  };

  const marcarMultaComoPagada = async (servicioId: string) => {
    await actualizarServicio(servicioId, { multaPagada: true });
  };

  const recargarServicios = async () => { await cargarServicios(); };

  return (
    <ServiciosContext.Provider value={{
      servicios, politicaPenalizacion, crearServicio, actualizarServicio,
      obtenerServicioPorId, obtenerServiciosPorCliente, obtenerNoShowsPorCliente,
      contarNoShowsCliente, obtenerMultasPendientesCliente, calcularTotalMultasCliente,
      obtenerServiciosPorModelo, obtenerIngresosModelo, crearServicioDesdeAgendamiento,
      aplicarMultaPorNoShow, marcarMultaComoPagada, recargarServicios,
    }}>
      {children}
    </ServiciosContext.Provider>
  );
}

export function useServicios() {
  const context = useContext(ServiciosContext);
  if (context === undefined) {
    return {
      servicios: [], politicaPenalizacion: POLITICA_DEFAULT,
      crearServicio: async () => ({ success: false }),
      actualizarServicio: async () => {},
      obtenerServicioPorId: () => undefined,
      obtenerServiciosPorCliente: () => [],
      obtenerNoShowsPorCliente: () => [],
      contarNoShowsCliente: () => 0,
      obtenerMultasPendientesCliente: () => [],
      calcularTotalMultasCliente: () => 0,
      obtenerServiciosPorModelo: () => [],
      obtenerIngresosModelo: () => 0,
      crearServicioDesdeAgendamiento: async () => ({ success: false }),
      aplicarMultaPorNoShow: async () => {},
      marcarMultaComoPagada: async () => {},
      recargarServicios: async () => {},
    } as ServiciosContextType;
  }
  return context;
}
