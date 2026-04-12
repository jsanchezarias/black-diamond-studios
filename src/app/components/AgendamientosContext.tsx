import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
import { configurarVerificacionPeriodica, AgendamientoParaRecordatorio } from './NotificacionesRecordatorios';

export interface Agendamiento {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  tipoServicio: string;
  estado: 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show';
  notas?: string;
  creadoPor?: string;
  fechaCreacion?: string;
  motivoCancelacion?: string;
  canceladoPor?: string;
  fechaCancelacion?: string;
  montoPago: number;
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  metodoPago?: string;
  transaccionId?: string;
  fechaPago?: string;
  comprobantePago?: string;
  tarifaNombre?: string;
  tarifaDescripcion?: string;
}

// Mapper: DB row (snake_case) → Agendamiento (camelCase)
function rowToAgendamiento(row: any): Agendamiento {
  return {
    id: row.id,
    modeloEmail: row.modelo_email ?? row.modeloEmail ?? '',
    modeloNombre: row.modelo_nombre ?? row.modeloNombre ?? '',
    clienteId: row.cliente_id ?? row.clienteId ?? '',
    clienteNombre: row.cliente_nombre ?? row.clienteNombre ?? (row.clientes?.nombre ?? ''),
    clienteTelefono: row.cliente_telefono ?? row.clienteTelefono ?? (row.clientes?.telefono ?? ''),
    fecha: row.fecha ?? '',
    hora: row.hora ?? '',
    duracionMinutos: row.duracion_minutos ?? row.duracion ?? row.duracionMinutos ?? 60,
    tipoServicio: row.tipo_servicio ?? row.tipoServicio ?? 'sede',
    estado: row.estado ?? 'pendiente',
    notas: row.notas,
    creadoPor: row.creado_por ?? row.creadoPor,
    fechaCreacion: row.fecha_creacion ?? row.created_at,
    motivoCancelacion: row.motivo_cancelacion ?? row.motivoCancelacion,
    canceladoPor: row.cancelado_por ?? row.canceladoPor,
    fechaCancelacion: row.fecha_cancelacion ?? row.fechaCancelacion,
    montoPago: row.monto_pago ?? row.precio ?? row.montoPago ?? 0,
    estadoPago: row.estado_pago ?? row.estadoPago ?? 'pendiente',
    metodoPago: row.metodo_pago ?? row.metodoPago,
    transaccionId: row.transaccion_id ?? row.transaccionId,
    fechaPago: row.fecha_pago ?? row.fechaPago,
    comprobantePago: row.comprobante_pago ?? row.comprobantePago,
    tarifaNombre: row.tarifa_nombre ?? row.tarifaNombre ?? row.servicio,
    tarifaDescripcion: row.tarifa_descripcion ?? row.tarifaDescripcion,
  };
}

// Mapper: Agendamiento → DB row (snake_case)
function agendamientoToRow(a: Partial<Agendamiento>): Record<string, any> {
  const row: Record<string, any> = {};
  if (a.modeloEmail !== undefined) row.modelo_email = a.modeloEmail;
  if (a.modeloNombre !== undefined) row.modelo_nombre = a.modeloNombre;
  if (a.clienteId !== undefined) row.cliente_id = a.clienteId;
  if (a.clienteNombre !== undefined) row.cliente_nombre = a.clienteNombre;
  if (a.clienteTelefono !== undefined) row.cliente_telefono = a.clienteTelefono;
  if (a.fecha !== undefined) row.fecha = a.fecha;
  if (a.hora !== undefined) row.hora = a.hora;
  if (a.duracionMinutos !== undefined) {
    row.duracion_minutos = a.duracionMinutos;
    row.duracion = a.duracionMinutos; // ✅ Columna obligatoria legacy
  }
  if (a.tipoServicio !== undefined) row.tipo_servicio = a.tipoServicio;
  if (a.estado !== undefined) row.estado = a.estado;
  if (a.notas !== undefined) row.notas = a.notas;
  if (a.creadoPor !== undefined) row.creado_por = a.creadoPor;
  if (a.motivoCancelacion !== undefined) row.motivo_cancelacion = a.motivoCancelacion;
  if (a.canceladoPor !== undefined) row.cancelado_por = a.canceladoPor;
  if (a.fechaCancelacion !== undefined) row.fecha_cancelacion = a.fechaCancelacion;
  if (a.montoPago !== undefined) {
    row.monto_pago = a.montoPago;
    row.precio = a.montoPago; // ✅ Columna obligatoria legacy
  }
  if (a.estadoPago !== undefined) row.estado_pago = a.estadoPago;
  if (a.metodoPago !== undefined) row.metodo_pago = a.metodoPago;
  if (a.transaccionId !== undefined) row.transaccion_id = a.transaccionId;
  if (a.fechaPago !== undefined) row.fecha_pago = a.fechaPago;
  if (a.comprobantePago !== undefined) row.comprobante_pago = a.comprobantePago;
  if (a.tarifaNombre !== undefined) row.tarifa_nombre = a.tarifaNombre;
  if (a.tarifaDescripcion !== undefined) row.tarifa_descripcion = a.tarifaDescripcion;
  // ✅ Columna obligatoria: siempre debe tener valor (fallback en cadena)
  row.servicio = a.tarifaNombre ?? a.tipoServicio ?? 'Servicio general';
  return row;
}

interface AgendamientosContextType {
  agendamientos: Agendamiento[];
  agregarAgendamiento: (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion' | 'creadoPor'>) => Promise<{ success: boolean, error?: any, data?: any }>;
  actualizarAgendamiento: (id: string, agendamiento: Partial<Agendamiento>) => Promise<void>;
  eliminarAgendamiento: (id: string) => Promise<void>;
  obtenerAgendamientosPorModelo: (modeloEmail: string) => Agendamiento[];
  obtenerAgendamientosPendientes: (modeloEmail: string) => Agendamiento[];
  marcarComoCompletado: (id: string) => Promise<void>;
  cancelarAgendamiento: (id: string, motivo: string, canceladoPor: string) => Promise<void>;
  marcarComoNoShow: (id: string, motivo: string, marcadoPor: string) => Promise<void>;
  recargarAgendamientos: () => Promise<void>;
}

const AgendamientosContext = createContext<AgendamientosContextType | undefined>(undefined);

export function AgendamientosProvider({ children }: { children: ReactNode }) {
  const [agendamientos, setAgendamientos] = useState<Agendamiento[]>([]);

  useEffect(() => {
    cargarAgendamientos();

    // ✅ REALTIME: recargar agendamientos ante cualquier cambio
    const channel = supabase
      .channel('agendamientos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamientos' }, () => {
        cargarAgendamientos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cargarAgendamientos = async () => {
    try {
      const { data, error } = await supabase
        .from('agendamientos')
        .select('*')
        .order('fecha', { ascending: true });

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando agendamientos:', error.message);
        setAgendamientos([]);
        return;
      }

      const formateados = (data ?? []).map(rowToAgendamiento);
      setAgendamientos(formateados);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado cargando agendamientos:', error);
      setAgendamientos([]);
    }
  };

  const agregarAgendamiento = async (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion' | 'creadoPor'>) => {
    try {
      const row = agendamientoToRow(agendamiento);

      const { data, error } = await supabase
        .from('agendamientos')
        .insert(row)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error creando agendamiento:', error.message);
        return { success: false, error };
      }

      const nuevo = rowToAgendamiento(data);
      setAgendamientos(prev => [...prev, nuevo].sort((a, b) =>
        new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime()
      ));

      return { success: true, data: nuevo };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error en agregarAgendamiento:', error);
      return { success: false, error };
    }
  };

  const actualizarAgendamiento = async (id: string, agendamiento: Partial<Agendamiento>) => {
    try {
      const row = agendamientoToRow(agendamiento);

      const { error } = await supabase
        .from('agendamientos')
        .update(row)
        .eq('id', id);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando agendamiento:', error.message);
        throw new Error(error.message);
      }

      setAgendamientos(prev => prev.map(a => a.id === id ? { ...a, ...agendamiento } : a));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error en actualizarAgendamiento:', error);
      throw error;
    }
  };

  const eliminarAgendamiento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamientos')
        .delete()
        .eq('id', id);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error eliminando agendamiento:', error.message);
        throw new Error(error.message);
      }

      setAgendamientos(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error en eliminarAgendamiento:', error);
      throw error;
    }
  };

  const obtenerAgendamientosPorModelo = (modeloEmail: string) =>
    agendamientos.filter(a => a.modeloEmail === modeloEmail);

  const obtenerAgendamientosPendientes = (modeloEmail: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return agendamientos.filter(a => {
      const fechaA = new Date(a.fecha);
      return a.modeloEmail === modeloEmail &&
        a.estado !== 'completado' &&
        a.estado !== 'cancelado' &&
        fechaA >= hoy;
    }).sort((a, b) =>
      new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime()
    );
  };

  const marcarComoCompletado = async (id: string) => {
    await actualizarAgendamiento(id, { estado: 'completado' });

    // Crear registro en servicios_modelo si existe
    const ag = agendamientos.find(a => a.id === id);
    if (ag) {
      await supabase.from('servicios_modelo').insert({
        agendamiento_id: id,
        modelo_email: ag.modeloEmail,
        cliente_id: ag.clienteId,
        fecha: ag.fecha,
        hora: ag.hora,
        tipo_servicio: ag.tipoServicio,
        monto: ag.montoPago,
        estado: 'completado',
        created_at: new Date().toISOString(),
      }).select().maybeSingle();
    }
  };

  const cancelarAgendamiento = async (id: string, motivo: string, canceladoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'cancelado',
      motivoCancelacion: motivo,
      canceladoPor,
      fechaCancelacion: new Date().toISOString(),
    });
  };

  const marcarComoNoShow = async (id: string, motivo: string, marcadoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'no_show',
      motivoCancelacion: motivo,
      canceladoPor: marcadoPor,
      fechaCancelacion: new Date().toISOString(),
    });
  };

  const recargarAgendamientos = async () => {
    await cargarAgendamientos();
  };

  // Recordatorios automáticos
  useEffect(() => {
    if (agendamientos.length === 0) return;
    const activos: AgendamientoParaRecordatorio[] = agendamientos
      .filter(a => a.estado === 'confirmado' || a.estado === 'pendiente')
      .map(a => ({
        id: a.id,
        modeloEmail: a.modeloEmail,
        modeloNombre: a.modeloNombre,
        clienteNombre: a.clienteNombre,
        fecha: a.fecha,
        hora: a.hora,
        tipoServicio: a.tipoServicio,
        estado: a.estado,
      }));
    const cleanup = configurarVerificacionPeriodica(activos, 60);
    return cleanup;
  }, [agendamientos]);

  return (
    <AgendamientosContext.Provider
      value={{
        agendamientos,
        agregarAgendamiento,
        actualizarAgendamiento,
        eliminarAgendamiento,
        obtenerAgendamientosPorModelo,
        obtenerAgendamientosPendientes,
        marcarComoCompletado,
        cancelarAgendamiento,
        marcarComoNoShow,
        recargarAgendamientos,
      }}
    >
      {children}
    </AgendamientosContext.Provider>
  );
}

export function useAgendamientos() {
  const context = useContext(AgendamientosContext);
  if (context === undefined) {
    return {
      agendamientos: [],
      agregarAgendamiento: async () => ({ success: false, error: 'Provider no disponible' }),
      actualizarAgendamiento: async () => {},
      eliminarAgendamiento: async () => {},
      obtenerAgendamientosPorModelo: () => [],
      obtenerAgendamientosPendientes: () => [],
      marcarComoCompletado: async () => {},
      cancelarAgendamiento: async () => {},
      marcarComoNoShow: async () => {},
      recargarAgendamientos: async () => {},
    } as AgendamientosContextType;
  }
  return context;
}
