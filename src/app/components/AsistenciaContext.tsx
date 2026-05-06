import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';

export interface SolicitudEntrada {
  id: string;
  modeloId: string;
  modeloEmail: string;
  modeloNombre: string;
  fecha: Date;
  selfieUrl: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentariosAdmin?: string;
  aprobadoPor?: string;
  fechaRespuesta?: Date;
  jornadaId?: string;
}

export interface RegistroAsistencia {
  id: string;
  modeloId?: string;
  modeloEmail: string;
  modeloNombre: string;
  fecha: Date;
  horaLlegada: Date;
  horaSalida?: Date;
  horasTrabajadas?: number;
  estado: 'En Turno' | 'Finalizado';
  observaciones?: string;
  solicitudEntradaId?: string;
  selfieUrl?: string;
}

export interface Jornada {
  id: string;
  modeloId: string;
  modeloEmail: string;
  modeloNombre: string;
  fecha: string;
  horaInicio: Date;
  horaFin?: Date;
  horasTrabajadas?: number;
  horasRequeridas: number;
  jornadaCompleta?: boolean;
  estado: 'en_curso' | 'completada' | 'cerrada_auto';
  multaGenerada: boolean;
  multaId?: string;
}

export interface ConfiguracionJornada {
  id: string;
  horasJornada: number;
  montoMultaJornada: number;
  descripcionMulta: string;
}

interface AsistenciaContextType {
  registros: RegistroAsistencia[];
  solicitudesEntrada: SolicitudEntrada[];
  jornadas: Jornada[];
  configuracion: ConfiguracionJornada | null;
  loading: boolean;
  registrarSalida: (modeloEmail: string, observaciones?: string) => Promise<void>;
  obtenerRegistroActual: (modeloEmail: string) => RegistroAsistencia | undefined;
  obtenerRegistrosPorModelo: (modeloEmail: string) => RegistroAsistencia[];
  obtenerRegistrosDelDia: () => RegistroAsistencia[];
  obtenerEstadisticas: (modeloEmail: string) => {
    totalDias: number;
    totalHoras: number;
    promedioHorasPorDia: number;
    diasEsteMes: number;
  };
  crearSolicitudEntrada: (modeloEmail: string, modeloNombre: string, selfieUrl: string) => Promise<void>;
  aprobarSolicitudEntrada: (solicitudId: string, aprobadoPor: string, comentarios?: string) => Promise<void>;
  rechazarSolicitudEntrada: (solicitudId: string, rechazadoPor: string, comentarios: string) => Promise<void>;
  obtenerSolicitudesPendientes: () => SolicitudEntrada[];
  obtenerSolicitudPorModelo: (modeloEmail: string) => SolicitudEntrada | undefined;
  
  // Control de Jornada
  obtenerJornadaActual: (modeloEmail: string) => Jornada | undefined;
  finalizarJornada: (jornadaId: string, notas?: string) => Promise<void>;
  actualizarConfiguracion: (config: Partial<ConfiguracionJornada>) => Promise<void>;
}

const AsistenciaContext = createContext<AsistenciaContextType | undefined>(undefined);

function mapSolicitud(row: any): SolicitudEntrada {
  const u = row.usuarios ?? row.usuario ?? {};
  return {
    id: row.id,
    modeloId: row.modelo_id,
    modeloEmail: u.email ?? row.modelo_email ?? '',
    modeloNombre: u.nombre_artistico ?? u.nombre ?? row.modelo_nombre ?? '',
    fecha: new Date(row.hora_solicitud),
    selfieUrl: row.selfie_url,
    estado: row.estado,
    comentariosAdmin: row.motivo_rechazo,
    aprobadoPor: row.respondida_por,
    fechaRespuesta: row.hora_respuesta ? new Date(row.hora_respuesta) : undefined,
    jornadaId: row.jornada_id,
  };
}

function mapAsistencia(row: any): RegistroAsistencia {
  return {
    id: row.id,
    modeloId: row.modelo_id,
    modeloEmail: row.modelo_email,
    modeloNombre: row.modelo_nombre,
    fecha: new Date(row.fecha),
    horaLlegada: new Date(row.hora_llegada),
    horaSalida: row.hora_salida ? new Date(row.hora_salida) : undefined,
    horasTrabajadas: row.horas_trabajadas != null ? Number(row.horas_trabajadas) : undefined,
    estado: row.estado,
    observaciones: row.observaciones,
    solicitudEntradaId: row.solicitud_entrada_id,
    selfieUrl: row.selfie_url,
  };
}

function mapJornada(row: any): Jornada {
  return {
    id: row.id,
    modeloId: row.modelo_id,
    modeloEmail: row.modelo_email,
    modeloNombre: row.modelo_nombre,
    fecha: row.fecha,
    horaInicio: new Date(row.hora_inicio_jornada),
    horaFin: row.hora_fin_jornada ? new Date(row.hora_fin_jornada) : undefined,
    horasTrabajadas: row.horas_trabajadas ? Number(row.horas_trabajadas) : undefined,
    horasRequeridas: row.horas_requeridas ?? 8,
    jornadaCompleta: row.jornada_completa,
    estado: row.estado,
    multaGenerada: row.multa_generada ?? false,
    multaId: row.multa_id,
  };
}

export function AsistenciaProvider({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [solicitudesEntrada, setSolicitudesEntrada] = useState<SolicitudEntrada[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionJornada | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [
        { data: asist }, 
        { data: solicits }, 
        { data: jors }, 
        { data: conf }
      ] = await Promise.all([
        supabase
          .from('asistencias')
          .select('*')
          .order('hora_llegada', { ascending: false })
          .limit(200),
        supabase
          .from('solicitudes_entrada')
          .select('*, usuarios!modelo_id(nombre_artistico, nombre, email)')
          .order('hora_solicitud', { ascending: false })
          .limit(100),
        supabase
          .from('jornadas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('configuracion_jornada')
          .select('*')
          .eq('activo', true)
          .maybeSingle()
      ]);
      
      if (asist) setRegistros(asist.map(mapAsistencia));
      if (solicits) setSolicitudesEntrada(solicits.map(mapSolicitud));
      if (jors) setJornadas(jors.map(mapJornada));
      if (conf) {
        setConfiguracion({
          id: conf.id,
          horasJornada: conf.horas_jornada,
          montoMultaJornada: conf.monto_multa_jornada,
          descripcionMulta: conf.descripcion_multa
        });
      }
    } catch (e) {
      console.error('Error cargando asistencia:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();

    const channel = supabase
      .channel('asistencia_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_entrada' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jornadas' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion_jornada' }, cargarDatos)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cargarDatos]);

  const crearSolicitudEntrada = async (modeloEmail: string, modeloNombre: string, selfieUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('solicitudes_entrada')
      .insert({
        modelo_id: user.id,
        selfie_url: selfieUrl,
        estado: 'pendiente',
        fecha: new Date().toISOString().split('T')[0],
        hora_solicitud: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    setSolicitudesEntrada(prev => [{
      id: data.id,
      modeloId: user.id,
      modeloEmail,
      modeloNombre,
      fecha: new Date(data.hora_solicitud),
      selfieUrl,
      estado: 'pendiente' as const,
    }, ...prev]);

    await supabase.from('notificaciones').insert({
      para_rol: 'administrador',
      titulo: '📸 Solicitud de entrada',
      mensaje: `${modeloNombre} quiere registrar su entrada al turno`,
      tipo: 'solicitud_entrada',
      leida: false,
    });
  };

  const aprobarSolicitudEntrada = async (solicitudId: string, aprobadoPor: string, comentarios?: string) => {
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    const solicitud = solicitudesEntrada.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const ahora = new Date().toISOString();

    // 1. Crear la Jornada
    const { data: jornadaData, error: jorErr } = await supabase
      .from('jornadas')
      .insert({
        modelo_id: solicitud.modeloId,
        modelo_email: solicitud.modeloEmail,
        modelo_nombre: solicitud.modeloNombre,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio_jornada: ahora,
        horas_requeridas: configuracion?.horasJornada ?? 8,
        estado: 'en_curso',
        solicitud_entrada_id: solicitudId
      })
      .select()
      .single();

    if (jorErr) throw jorErr;

    // 2. Actualizar la Solicitud
    const { error: updErr } = await supabase
      .from('solicitudes_entrada')
      .update({ 
        estado: 'aprobada', 
        hora_respuesta: ahora, 
        respondida_por: adminUser?.id,
        jornada_id: jornadaData.id,
        hora_inicio_jornada: ahora,
        hora_aprobacion: ahora,
        aprobado_por: adminUser?.email || aprobadoPor
      })
      .eq('id', solicitudId);
    if (updErr) throw updErr;

    // 3. Crear Asistencia (legacy compatibility)
    const { data: asistRow, error: insErr } = await supabase
      .from('asistencias')
      .insert({
        modelo_id: solicitud.modeloId,
        modelo_email: solicitud.modeloEmail,
        modelo_nombre: solicitud.modeloNombre,
        fecha: new Date().toISOString().split('T')[0],
        hora_llegada: ahora,
        estado: 'En Turno',
        solicitud_entrada_id: solicitudId,
        selfie_url: solicitud.selfieUrl,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // 4. Notificar a la modelo
    await supabase.from('notificaciones').insert({
      para_usuario_id: solicitud.modeloId,
      titulo: '✅ Entrada aprobada',
      mensaje: comentarios ?? '¡Tu entrada fue aprobada! Tu jornada de 8 horas ha comenzado.',
      tipo: 'solicitud_entrada_aprobada',
      datos: { jornada_id: jornadaData.id },
      leida: false,
    });

    setSolicitudesEntrada(prev =>
      prev.map(s => s.id === solicitudId
        ? { ...s, estado: 'aprobada' as const, aprobadoPor, fechaRespuesta: new Date(), jornadaId: jornadaData.id }
        : s
      )
    );
    if (jornadaData) setJornadas(prev => [mapJornada(jornadaData), ...prev]);
    if (asistRow) setRegistros(prev => [mapAsistencia(asistRow), ...prev]);
  };

  const rechazarSolicitudEntrada = async (solicitudId: string, rechazadoPor: string, comentarios: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const solicitud = solicitudesEntrada.find(s => s.id === solicitudId);

    const { error } = await supabase
      .from('solicitudes_entrada')
      .update({
        estado: 'rechazada',
        hora_respuesta: new Date().toISOString(),
        respondida_por: user?.id,
        motivo_rechazo: comentarios,
      })
      .eq('id', solicitudId);
    if (error) throw error;

    if (solicitud?.modeloId) {
      await supabase.from('notificaciones').insert({
        para_usuario_id: solicitud.modeloId,
        titulo: '❌ Solicitud de entrada rechazada',
        mensaje: `Motivo: ${comentarios}`,
        tipo: 'solicitud_entrada_rechazada',
        leida: false,
      });
    }

    setSolicitudesEntrada(prev =>
      prev.map(s => s.id === solicitudId
        ? { ...s, estado: 'rechazada' as const, comentariosAdmin: comentarios, aprobadoPor: rechazadoPor, fechaRespuesta: new Date() }
        : s
      )
    );
    rechazadoPor;
  };

  const registrarSalida = async (modeloEmail: string, observaciones?: string) => {
    const registro = registros.find(r => r.modeloEmail === modeloEmail && r.estado === 'En Turno');
    if (!registro) return;

    const jornadaActual = jornadas.find(j => j.modeloEmail === modeloEmail && j.estado === 'en_curso');
    if (jornadaActual) {
      await finalizarJornada(jornadaActual.id, observaciones);
      return;
    }

    // Fallback para asistencias viejas sin jornada
    const horaSalida = new Date();
    const horasTrabajadas = Math.round(
      ((horaSalida.getTime() - registro.horaLlegada.getTime()) / (1000 * 60 * 60)) * 100
    ) / 100;

    await supabase
      .from('asistencias')
      .update({
        hora_salida: horaSalida.toISOString(),
        horas_trabajadas: horasTrabajadas,
        estado: 'Finalizado',
        observaciones: observaciones ?? registro.observaciones,
      })
      .eq('id', registro.id);
      
    setRegistros(prev =>
      prev.map(r =>
        r.id === registro.id
          ? { ...r, horaSalida, horasTrabajadas, estado: 'Finalizado' as const }
          : r
      )
    );
  };

  const finalizarJornada = async (jornadaId: string, notas?: string) => {
    const jornada = jornadas.find(j => j.id === jornadaId);
    if (!jornada) return;

    const horaFin = new Date();
    const diffMs = horaFin.getTime() - jornada.horaInicio.getTime();
    const horasTrabajadas = Math.round((diffMs / 3600000) * 100) / 100;
    const jornadaCompleta = horasTrabajadas >= jornada.horasRequeridas;

    let multaId = null;

    // Si jornada es incompleta, generar multa
    if (!jornadaCompleta && configuracion) {
      const { data: multaData, error: multaErr } = await supabase
        .from('multas')
        .insert({
          modelo_id: jornada.modeloId,
          modelo_email: jornada.modeloEmail,
          modelo_nombre: jornada.modeloNombre,
          tipo: 'jornada_incompleta',
          motivo: `Jornada incompleta (${horasTrabajadas}h de ${jornada.horasRequeridas}h requeridas)`,
          monto: configuracion.montoMultaJornada || 50000,
          horas_trabajadas: horasTrabajadas,
          horas_requeridas: jornada.horasRequeridas,
          horas_faltantes: Math.max(0, jornada.horasRequeridas - horasTrabajadas),
          jornada_id: jornadaId,
          estado: 'activa',
          notas: notas
        })
        .select()
        .single();
      
      if (!multaErr && multaData) {
        multaId = multaData.id;
        
        // Notificar multa
        await supabase.from('notificaciones').insert({
          para_usuario_id: jornada.modeloId,
          titulo: '⚠️ Multa por jornada incompleta',
          mensaje: `Se ha generado una multa de $${configuracion.montoMultaJornada.toLocaleString()} por no completar las 8 horas de turno.`,
          tipo: 'multa_jornada',
          datos: { jornada_id: jornadaId, multa_id: multaId },
          leida: false,
        });
      }
    }

    // Actualizar Jornada
    const { error: jorErr } = await supabase
      .from('jornadas')
      .update({
        hora_fin_jornada: horaFin.toISOString(),
        horas_trabajadas: horasTrabajadas,
        jornada_completa: jornadaCompleta,
        estado: 'completada',
        multa_generada: !!multaId,
        multa_id: multaId,
        updated_at: new Date().toISOString()
      })
      .eq('id', jornadaId);
    
    if (jorErr) throw jorErr;

    // Sincronizar con asistencias (legacy)
    await supabase
      .from('asistencias')
      .update({
        hora_salida: horaFin.toISOString(),
        horas_trabajadas: horasTrabajadas,
        estado: 'Finalizado',
        observaciones: notas
      })
      .eq('solicitud_entrada_id', jornada.id) // o buscar por email+fecha
      .or(`solicitud_entrada_id.eq.${jornada.id},modelo_email.eq.${jornada.modeloEmail},estado.eq.En Turno`);

    await cargarDatos();
  };

  const actualizarConfiguracion = async (config: Partial<ConfiguracionJornada>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('configuracion_jornada')
      .update({
        horas_jornada: config.horasJornada,
        monto_multa_jornada: config.montoMultaJornada,
        descripcion_multa: config.descripcionMulta,
        updated_by: user?.email,
        updated_at: new Date().toISOString()
      })
      .eq('activo', true);
    if (error) throw error;
    await cargarDatos();
  };

  const obtenerJornadaActual = (modeloEmail: string) =>
    jornadas.find(j => j.modeloEmail === modeloEmail && j.estado === 'en_curso');

  const obtenerRegistroActual = (modeloEmail: string) =>
    registros.find(r => r.modeloEmail === modeloEmail && r.estado === 'En Turno');

  const obtenerRegistrosPorModelo = (modeloEmail: string) =>
    registros
      .filter(r => r.modeloEmail === modeloEmail)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const obtenerRegistrosDelDia = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return registros.filter(r => {
      const f = new Date(r.fecha);
      f.setHours(0, 0, 0, 0);
      return f.getTime() === hoy.getTime();
    });
  };

  const obtenerEstadisticas = (modeloEmail: string) => {
    const mine = registros.filter(r => r.modeloEmail === modeloEmail && r.estado === 'Finalizado');
    const totalDias = mine.length;
    const totalHoras = mine.reduce((s, r) => s + (r.horasTrabajadas ?? 0), 0);
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const diasEsteMes = mine.filter(r => new Date(r.fecha) >= inicioMes).length;
    return {
      totalDias,
      totalHoras,
      promedioHorasPorDia: totalDias > 0 ? totalHoras / totalDias : 0,
      diasEsteMes,
    };
  };

  const obtenerSolicitudesPendientes = () =>
    solicitudesEntrada
      .filter(s => s.estado === 'pendiente')
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const obtenerSolicitudPorModelo = (modeloEmail: string): SolicitudEntrada | undefined => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return solicitudesEntrada
      .filter(s => {
        const f = new Date(s.fecha);
        f.setHours(0, 0, 0, 0);
        return s.modeloEmail === modeloEmail && f.getTime() === hoy.getTime();
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];
  };

  return (
    <AsistenciaContext.Provider value={{
      registros,
      solicitudesEntrada,
      jornadas,
      configuracion,
      loading,
      registrarSalida,
      obtenerRegistroActual,
      obtenerRegistrosPorModelo,
      obtenerRegistrosDelDia,
      obtenerEstadisticas,
      crearSolicitudEntrada,
      aprobarSolicitudEntrada,
      rechazarSolicitudEntrada,
      obtenerSolicitudesPendientes,
      obtenerSolicitudPorModelo,
      obtenerJornadaActual,
      finalizarJornada,
      actualizarConfiguracion,
    }}>
      {children}
    </AsistenciaContext.Provider>
  );
}

export function useAsistencia() {
  const ctx = useContext(AsistenciaContext);
  if (!ctx) throw new Error('useAsistencia debe usarse dentro de AsistenciaProvider');
  return ctx;
}
