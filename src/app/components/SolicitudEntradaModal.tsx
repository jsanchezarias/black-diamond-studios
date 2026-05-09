import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface SolicitudData {
  id: string;
  selfie_url: string | null;
  hora_solicitud: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  modelo_id: string;
  usuarios: {
    id: string;
    nombre_artistico: string | null;
    nombre: string | null;
    email: string;
  } | null;
}

interface Props {
  solicitudId: string;
  onClose: () => void;
}

export function SolicitudEntradaModal({ solicitudId, onClose }: Props) {
  const [solicitud, setSolicitud] = useState<SolicitudData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    fetchSolicitud();
  }, [solicitudId]);

  const fetchSolicitud = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('solicitudes_entrada')
      .select(`
        id, selfie_url, hora_solicitud, estado, modelo_id,
        usuarios!modelo_id (id, nombre_artistico, nombre, email)
      `)
      .eq('id', solicitudId)
      .single();

    if (!error && data) setSolicitud(data as unknown as SolicitudData);
    setCargando(false);
  };

  const aprobar = async () => {
    if (!solicitud) return;
    setProcesando(true);
    try {
      const ahora = new Date().toISOString();
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const nombreModelo = solicitud.usuarios?.nombre_artistico ?? solicitud.usuarios?.nombre ?? '';

      // 1. Crear jornada
      const { data: jornadaData, error: jorErr } = await supabase
        .from('jornadas')
        .insert({
          modelo_id: solicitud.modelo_id,
          modelo_email: solicitud.usuarios?.email,
          modelo_nombre: nombreModelo,
          fecha: new Date().toISOString().split('T')[0],
          hora_inicio_jornada: ahora,
          horas_requeridas: 8,
          estado: 'en_curso',
          solicitud_entrada_id: solicitudId,
        })
        .select()
        .single();
      if (jorErr) throw jorErr;

      // 2. Actualizar solicitud
      await supabase
        .from('solicitudes_entrada')
        .update({
          estado: 'aprobada',
          hora_respuesta: ahora,
          respondida_por: adminUser?.id,
          jornada_id: jornadaData.id,
          hora_inicio_jornada: ahora,
          hora_aprobacion: ahora,
          aprobado_por: adminUser?.email,
        })
        .eq('id', solicitudId);

      // 3. Crear asistencia
      await supabase.from('asistencias').insert({
        modelo_id: solicitud.modelo_id,
        modelo_email: solicitud.usuarios?.email,
        modelo_nombre: nombreModelo,
        fecha: new Date().toISOString().split('T')[0],
        hora_llegada: ahora,
        estado: 'En Turno',
        solicitud_entrada_id: solicitudId,
        selfie_url: solicitud.selfie_url,
      });

      // 4. Notificar a la modelo
      await supabase.from('notificaciones').insert({
        para_usuario_id: solicitud.modelo_id,
        titulo: '✅ Entrada aprobada',
        mensaje: 'Tu solicitud de entrada fue aprobada. Turno iniciado.',
        tipo: 'entrada_aprobada',
        leida: false,
      });

      setSolicitud(prev => prev ? { ...prev, estado: 'aprobada' } : null);
      toast.success('✅ Entrada aprobada — Modelo notificada');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      toast.error('Error al aprobar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async () => {
    if (!solicitud || !motivoRechazo.trim()) {
      toast.error('Escribe el motivo del rechazo');
      return;
    }
    setProcesando(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      await supabase
        .from('solicitudes_entrada')
        .update({
          estado: 'rechazada',
          hora_respuesta: new Date().toISOString(),
          respondida_por: adminUser?.id,
          motivo_rechazo: motivoRechazo,
        })
        .eq('id', solicitudId);

      await supabase.from('notificaciones').insert({
        para_usuario_id: solicitud.modelo_id,
        titulo: '❌ Solicitud de entrada rechazada',
        mensaje: `Motivo: ${motivoRechazo}`,
        tipo: 'solicitud_entrada_rechazada',
        leida: false,
      });

      setSolicitud(prev => prev ? { ...prev, estado: 'rechazada' } : null);
      toast.error('Entrada rechazada — Modelo notificada');
      setTimeout(() => {
        onClose();
        setMostrarRechazo(false);
        setMotivoRechazo('');
      }, 1500);
    } catch (err: any) {
      toast.error('Error al rechazar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const nombreModelo = solicitud?.usuarios?.nombre_artistico ?? solicitud?.usuarios?.nombre ?? 'Modelo';

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#16181c] rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
          <h3 className="text-[#c9a961] font-bold text-lg">
            📸 Solicitud de entrada
          </h3>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col items-center space-y-4">
          {cargando ? (
            <div className="py-10 text-[#888] text-sm animate-pulse">Cargando solicitud...</div>
          ) : !solicitud ? (
            <div className="py-10 text-red-400 text-sm">No se encontró la solicitud</div>
          ) : (
            <>
              {/* Selfie */}
              {solicitud.selfie_url ? (
                <img
                  src={solicitud.selfie_url}
                  alt="Selfie de entrada"
                  className="w-48 h-48 rounded-full object-cover border-4 border-[#c9a961] shadow-lg shadow-[#c9a961]/20"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-[#2a2a2a] flex items-center justify-center text-6xl">
                  👩
                </div>
              )}

              {/* Info modelo */}
              <div className="text-center">
                <p className="text-[#e8e6e3] font-bold text-lg">{nombreModelo}</p>
                <p className="text-[#888] text-sm">{solicitud.usuarios?.email}</p>
                <p className="text-[#888] text-xs mt-1">
                  🕐 Solicitó a las{' '}
                  {new Date(solicitud.hora_solicitud).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Badge de estado */}
              {solicitud.estado === 'pendiente' ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-400 text-sm text-center">
                  ⏳ Esperando tu aprobación
                </div>
              ) : solicitud.estado === 'aprobada' ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 text-sm">
                  ✅ Ya fue aprobada
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
                  ❌ Ya fue rechazada
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones — solo si pendiente y sin form de rechazo */}
        {solicitud?.estado === 'pendiente' && !mostrarRechazo && (
          <div className="p-4 border-t border-[#2a2a2a] flex gap-3">
            <button
              onClick={() => setMostrarRechazo(true)}
              disabled={procesando}
              className="flex-1 py-3 rounded-xl border border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              ❌ Rechazar
            </button>
            <button
              onClick={aprobar}
              disabled={procesando}
              className="flex-1 py-3 rounded-xl bg-[#c9a961] text-[#0f1014] font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#b8943f] transition-colors"
            >
              {procesando ? '⏳ Procesando...' : '✅ Aprobar entrada'}
            </button>
          </div>
        )}

        {/* Formulario de rechazo */}
        {mostrarRechazo && (
          <div className="p-4 border-t border-[#2a2a2a] space-y-3">
            <p className="text-[#888] text-sm">Motivo del rechazo (obligatorio):</p>
            <textarea
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              placeholder="Escribe el motivo..."
              className="w-full bg-[#0f1014] border border-[#2a2a2a] rounded-lg p-3 text-[#e8e6e3] text-sm resize-none h-20 focus:border-[#c9a961] outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setMostrarRechazo(false); setMotivoRechazo(''); }}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#888] text-sm hover:bg-[#2a2a2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={rechazar}
                disabled={!motivoRechazo.trim() || procesando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                {procesando ? '⏳ Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
