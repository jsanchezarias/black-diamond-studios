import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
import { configurarVerificacionPeriodica, AgendamientoParaRecordatorio } from './NotificacionesRecordatorios';
// import { notificarNuevoAgendamiento, notificarAgendamientoConfirmado, notificarProgramadores } from './NotificacionesHelpers';

export interface Agendamiento {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  modeloId?: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  tipoServicio: string;
  estado: 'pendiente' | 'confirmado' | 'aprobado' | 'en_curso' | 'activo' | 'completado' | 'cancelado' | 'no_show' | 'finalizado' | 'aceptado_programador' | 'solicitud_cliente' | 'creado_por_modelo';
  notas?: string;
  creadoPor?: string;
  creadoPorRol?: string;
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
  clienteRefId?: string;
}

export const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  // Try to parse assuming YYYY-MM-DD
  const [year, month, day] = fecha.split('-');
  if (year && month && day) {
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return new Date(fecha).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatearHora = (hora: string) => {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  const hNum = parseInt(h);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

// Mapper: DB row (snake_case) → Agendamiento (camelCase)
function rowToAgendamiento(row: any): Agendamiento {
  if (!row) return {} as Agendamiento;
  try {
    return {
      id: row.id,
      modeloEmail: row.modelo_email ?? row.modeloEmail ?? '',
      modeloNombre: row.modelo_nombre ?? row.modeloNombre ?? '',
      modeloId: row.modelo_id ?? row.modeloId ?? '',
      clienteId: row.cliente_id ?? row.clienteId ?? '',
      clienteNombre: row.cliente_nombre ?? row.clienteNombre ?? (row.clientes?.nombre ?? ''),
      clienteTelefono: row.cliente_telefono ?? row.clienteTelefono ?? (row.clientes?.telefono ?? ''),
      fecha: (row.fecha ? (typeof row.fecha === 'string' ? row.fecha.split('T')[0].split(' ')[0] : String(row.fecha)) : ''),
      hora: row.hora ?? '',
      duracionMinutos: row.duracion_minutos ?? row.duracion ?? row.duracionMinutos ?? 60,
      tipoServicio: row.tipo_servicio ?? row.tipoServicio ?? 'sede',
      estado: row.estado ?? 'pendiente',
      notas: row.notas,
      creadoPor: row.creado_por ?? row.creadoPor,
      creadoPorRol: row.creado_por_rol ?? row.creadoPorRol,
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
      clienteRefId: row.cliente_ref_id ?? undefined,
    };
  } catch (e) {
    console.error('❌ Error mapeando agendamiento:', e, row);
    return { id: row?.id || 'error' } as Agendamiento;
  }
}

// Mapper: Agendamiento → DB row (snake_case)
function agendamientoToRow(a: Partial<Agendamiento>): Record<string, any> {
  const row: Record<string, any> = {};
  if (a.modeloEmail !== undefined) row.modelo_email = a.modeloEmail;
  if (a.modeloNombre !== undefined) row.modelo_nombre = a.modeloNombre;
  if (a.modeloId !== undefined) row.modelo_id = a.modeloId;
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
  if (a.creadoPorRol !== undefined) row.creado_por_rol = a.creadoPorRol;
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
  if (a.clienteRefId !== undefined) row.cliente_ref_id = a.clienteRefId;
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
  // ── Nuevas funciones v2 ──────────────────────────────────────────────────────
  aprobarAgendamiento: (id: string, aprobadoPor: string) => Promise<void>;
  rechazarAgendamiento: (id: string, motivo: string, rechazadoPor: string) => Promise<void>;
  cambiarEstado: (id: string, nuevoEstado: Agendamiento['estado'], meta?: Partial<Agendamiento>) => Promise<void>;
  getAgendamientosHoy: () => Agendamiento[];
  getAgendamientosPendientesAprobacion: () => Agendamiento[];
  terminarServicioCompleto: (id: string, notas?: string, montoTotalCosto?: number) => Promise<{ success: boolean; error?: any }>;
}

const AgendamientosContext = createContext<AgendamientosContextType | undefined>(undefined);

export function AgendamientosProvider({ children }: { children: ReactNode }) {
  const [agendamientos, setAgendamientos] = useState<Agendamiento[]>([]);

  useEffect(() => {
    // REALTIME: recargar agendamientos ante cualquier cambio
    const channel = supabase
      .channel('agendamientos-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agendamientos' }, (payload) => {
        if (!payload.new) return;
        setAgendamientos(prev => {
          const nuevo = rowToAgendamiento(payload.new);
          // Evitar duplicados
          if (prev.some(a => a.id === nuevo.id)) return prev;
          
          const actualizado = [...prev, nuevo];
          return actualizado.sort((a, b) => {
            try {
              const fechaA = new Date((a.fecha || '2000-01-01') + 'T' + (a.hora || '00:00'));
              const fechaB = new Date((b.fecha || '2000-01-01') + 'T' + (b.hora || '00:00'));
              return fechaA.getTime() - fechaB.getTime();
            } catch { return 0; }
          });
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendamientos' }, (payload) => {
        if (!payload.new) return;
        setAgendamientos(prev => {
          const actualizado = rowToAgendamiento(payload.new);
          return prev.map(a => a.id === actualizado.id ? actualizado : a).sort((a, b) => {
            try {
              const fechaA = new Date((a.fecha || '2000-01-01') + 'T' + (a.hora || '00:00'));
              const fechaB = new Date((b.fecha || '2000-01-01') + 'T' + (b.hora || '00:00'));
              return fechaA.getTime() - fechaB.getTime();
            } catch { return 0; }
          });
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'agendamientos' }, (payload) => {
        if (!payload.old?.id) return;
        setAgendamientos(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cargarAgendamientos = async () => {
    try {
      // 1. Obtener sesión activa (si existe)
      // const { data: { session } } = await supabase.auth.getSession();
      await supabase.auth.getSession();
      
      // 💡 NOTA: Permitimos continuar sin sesión para que los clientes públicos
      // puedan ver sus propios agendamientos (el RLS se encarga de la seguridad)

      // 2. Cargar agendamientos de los últimos 90 días y futuros
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 90);
      const { data, error } = await supabase
        .from('agendamientos')
        .select('*')
        .gte('fecha', fechaLimite.toISOString().split('T')[0])
        .or('eliminado.is.null,eliminado.eq.false')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .limit(500);

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
      setAgendamientos(prev => {
        const actualizado = [...prev, nuevo];
        return actualizado.sort((a, b) => {
          const fechaA = new Date(a.fecha + 'T' + (a.hora || '00:00'));
          const fechaB = new Date(b.fecha + 'T' + (b.hora || '00:00'));
          return fechaA.getTime() - fechaB.getTime();
        });
      });

      // 🔔 Notificar a los programadores
      // Buscamos a los usuarios con rol programador para que les llegue la notificación
      const { data: programadores } = await supabase
        .from('usuarios')
        .select('id')
        .eq('role', 'programador');

      if (programadores && programadores.length > 0) {
        const notifications = programadores.map(p => ({
          usuario_id: p.id,
          para_rol: 'programador',
          tipo: 'agendamiento_nuevo',
          titulo: '📅 Nueva Reserva',
          mensaje: `Nueva reserva de ${nuevo.clienteNombre} para el ${nuevo.fecha} ${nuevo.hora}`,
          leida: false,
          referencia_id: nuevo.id,
          datos: {
            agendamientoId: nuevo.id,
            clienteNombre: nuevo.clienteNombre,
            fecha: nuevo.fecha,
            hora: nuevo.hora,
            servicio: nuevo.tipoServicio
          }
        }));

        await supabase.from('notificaciones').insert(notifications);
      }

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
        .update({ eliminado: true, eliminado_en: new Date().toISOString() })
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
    }).sort((a, b) => {
      const msA = new Date(a.fecha + 'T' + (a.hora || '00:00')).getTime();
      const msB = new Date(b.fecha + 'T' + (b.hora || '00:00')).getTime();
      return msA - msB;
    });
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

  // ── Nuevas funciones v2 ──────────────────────────────────────────────────────

  const aprobarAgendamiento = async (id: string, aprobadoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'aprobado',
      notas: `Aprobado por ${aprobadoPor} el ${new Date().toLocaleString('es-CO')}`,
    });

    // 🔔 Notificar a la modelo que su agendamiento fue aprobado (NUEVO FLUJO)
    const ag = agendamientos.find(a => a.id === id);
    if (ag) {
      // Intentar obtener el ID del usuario modelo por su email
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', ag.modeloEmail)
        .maybeSingle();

      if (userData?.id) {
        await supabase.from('notificaciones').insert({
          para_usuario_id: userData.id,
          tipo: 'reserva_aprobada',
          titulo: '✅ Reserva Aprobada',
          mensaje: `Tu reserva con ${ag.clienteNombre} para el ${ag.fecha} a las ${ag.hora} ha sido aprobada.`,
          leida: false,
          datos: { agendamientoId: id }
        });
      }
    }
  };

  const rechazarAgendamiento = async (id: string, motivo: string, rechazadoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'cancelado',
      motivoCancelacion: motivo,
      canceladoPor: rechazadoPor,
      fechaCancelacion: new Date().toISOString(),
    });
  };

  const cambiarEstado = async (id: string, nuevoEstado: Agendamiento['estado'], meta?: Partial<Agendamiento>) => {
    await actualizarAgendamiento(id, { estado: nuevoEstado, ...meta });
  };

  const getAgendamientosHoy = (): Agendamiento[] => {
    const hoy = new Date().toISOString().split('T')[0];
    return agendamientos
      .filter(a => a.fecha === hoy)
      .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
  };

  const getAgendamientosPendientesAprobacion = (): Agendamiento[] => {
    return agendamientos.filter(a => a.estado === 'pendiente');
  };

  const terminarServicioCompleto = async (id: string, notas?: string, montoTotalCosto?: number): Promise<{ success: boolean; error?: any }> => {
    try {
      const ag = agendamientos.find(a => a.id === id);
      if (!ag) throw new Error('Agendamiento no encontrado');

      const horaFinActual = new Date().toISOString();

      // 1. Actualizar Agendamiento
      const resAg = await supabase
        .from('agendamientos')
        .update({
          estado: 'completado',
          hora_fin_real: horaFinActual,
          notas: notas ? (ag.notas ? ag.notas + '\n\nNotas cierre: ' + notas : notas) : ag.notas
        })
        .eq('id', id);
        
      if (resAg.error) throw resAg.error;

      // NOTA: Los pagos y las habitaciones son gestionados por admin/programador.
      // El cambio de agendamiento a 'completado' dispara el trigger on_servicio_completado
      // que notifica a admin/owner/contador automáticamente.

      // 2. Obtener datos del modelo para registrar sus ganancias
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id, porcentaje_ganancia')
        .eq('email', ag.modeloEmail)
        .maybeSingle();

      const modeloId = userData?.id ?? null;

      // 3. Registrar Ganancias de la Modelo en 'gastos' (categoria 'pago_modelo')
      if (modeloId) {
        const montoBase = montoTotalCosto || ag.montoPago || 0;
        // Fallback a 60% si no hay porcentaje configurado
        const porcentaje = (userData as any)?.porcentaje_ganancia || 60;
        const montoModelo = (montoBase * porcentaje) / 100;

        await supabase
          .from('gastos')
          .insert({
            categoria: 'pago_modelo',
            descripcion: `Pago de servicio completado - ${ag.tipoServicio} - ${ag.clienteNombre}`,
            monto: montoModelo,
            fecha: horaFinActual,
            agendamiento_id: id,
            modelo_id: modeloId,
            modelo_nombre: ag.modeloNombre,
            created_by: modeloId
          });
      }

      // Actualizar estado local
      setAgendamientos(prev => prev.map(a => a.id === id ? { ...a, estado: 'completado' } : a));

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error en terminarServicioCompleto:', error);
      return { success: false, error };
    }
  };

  // Recordatorios automáticos
  useEffect(() => {
    if (agendamientos.length === 0) return;
    const activos: AgendamientoParaRecordatorio[] = agendamientos
      .filter(a => a.estado === 'confirmado' || a.estado === 'aprobado' || a.estado === 'pendiente')
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
        aprobarAgendamiento,
        rechazarAgendamiento,
        cambiarEstado,
        getAgendamientosHoy,
        getAgendamientosPendientesAprobacion,
        terminarServicioCompleto,
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
      aprobarAgendamiento: async () => {},
      rechazarAgendamiento: async () => {},
      cambiarEstado: async () => {},
      getAgendamientosHoy: () => [],
      getAgendamientosPendientesAprobacion: () => [],
      terminarServicioCompleto: async () => ({ success: false, error: 'Provider no disponible' }),
    } as AgendamientosContextType;
  }
  return context;
}
