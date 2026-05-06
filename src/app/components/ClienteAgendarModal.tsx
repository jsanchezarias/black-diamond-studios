import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Sparkles, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/info';

interface Service {
  name: string;
  duration: string;
  price: string;
  priceHome?: string;
  description: string;
}

interface ModelData {
  id: string;
  name: string;
  age: number;
  photo: string;
  description: string;
  services: Service[];
  location: string;
  domicilio: boolean;
  available: boolean;
}

interface ClienteAgendarModalProps {
  modelo: ModelData;
  modeloEmail: string;
  clienteId: string;
  clienteEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Horas disponibles: 10:00 – 23:00 cada 30 min
const HORAS = Array.from({ length: 27 }, (_, i) => {
  const total = 600 + i * 30; // desde 10:00
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

export function ClienteAgendarModal({
  modelo,
  modeloEmail,
  clienteId,
  clienteEmail,
  onClose,
  onSuccess,
}: ClienteAgendarModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicioIdx, setServicioIdx] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState<'sede' | 'domicilio'>('sede');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Si ya hay un servicio pre-seleccionado lo marcamos (viene del ModelCard)
  useEffect(() => {
    if (modelo.services?.length === 1) setServicioIdx(0);
  }, [modelo]);

  const servicioSeleccionado = servicioIdx !== null ? modelo.services[servicioIdx] : null;

  const precio = servicioSeleccionado
    ? (ubicacion === 'domicilio' && servicioSeleccionado.priceHome
        ? servicioSeleccionado.priceHome
        : servicioSeleccionado.price)
    : '';

  const validar = () => {
    if (!fecha) return 'Selecciona una fecha.';
    if (fecha < today) return 'La fecha no puede ser pasada.';
    if (!hora) return 'Selecciona una hora.';
    if (servicioIdx === null) return 'Selecciona un servicio.';
    return '';
  };

  const confirmar = async () => {
    const err = validar();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      // Obtener nombre del cliente
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', clienteId)
        .maybeSingle();
      const clienteNombre = (usuarioData?.nombre || clienteEmail.split('@')[0]).trim();

      // Obtener ID de la modelo por email
      const { data: modeloDB } = await supabase
        .from('usuarios')
        .select('id, nombre, nombreArtistico, nombre_artistico')
        .eq('email', modeloEmail)
        .maybeSingle();
      const modeloNombreReal = (modeloDB?.nombreArtistico || modeloDB?.nombre_artistico || modeloDB?.nombre || modelo.name).trim();

      // INSERT agendamiento
      const { data: agendamientoData, error: insertError } = await supabase
        .from('agendamientos')
        .insert({
          cliente_id: clienteId,
          modelo_id: modeloDB?.id || null,
          modelo_email: modeloEmail,
          modelo_nombre: modeloNombreReal,
          cliente_nombre: clienteNombre,
          fecha: fecha,
          hora: hora,
          servicio: servicioSeleccionado!.name,
          tipo_servicio: ubicacion,
          duracion: (() => {
            const raw = servicioSeleccionado!.duration || '';
            const n = parseInt(raw);
            // Si el string contiene 'hora' o el número es <= 12, interpretar como HORAS
            const esHoras = /hora/i.test(raw) || (n > 0 && n <= 12 && !/min/i.test(raw));
            return esHoras ? n * 60 : (n || 60);
          })(),
          duracion_minutos: (() => {
            const raw = servicioSeleccionado!.duration || '';
            const n = parseInt(raw);
            const esHoras = /hora/i.test(raw) || (n > 0 && n <= 12 && !/min/i.test(raw));
            return esHoras ? n * 60 : (n || 60);
          })(),
          precio: parseFloat((precio || '0').replace(/\./g, '').replace(',', '.')) || 0,
          monto_pago: parseFloat((precio || '0').replace(/\./g, '').replace(',', '.')) || 0,
          tarifa_nombre: servicioSeleccionado!.name,
          tarifa_descripcion: servicioSeleccionado!.description || '',
          estado: 'pendiente',
          estado_pago: 'pendiente',
          ubicacion: ubicacion,
          notas: notas || null,
          creado_por: clienteEmail,
          fecha_creacion: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        setError('Error al crear la solicitud: ' + insertError.message);
        setLoading(false);
        return;
      }

      // ── Notificaciones en paralelo ─────────────────────────────────────────
      const notifPromises: Promise<any>[] = [];

      // Buscar programadores para notificarlos
      const { data: programadores } = await supabase
        .from('usuarios')
        .select('id')
        .eq('role', 'programador');

      // 1️⃣ Notificación para el CLIENTE (badge en su ClienteNavbar)
      notifPromises.push(
        supabase.from('notificaciones').insert({
          usuario_id: clienteId,
          para_usuario_id: clienteId,
          tipo: 'agendamiento_pendiente',
          titulo: '📅 Solicitud enviada',
          mensaje: `Tu solicitud con ${modeloNombreReal} para el ${fecha} a las ${hora} está pendiente de confirmación.`,
          leida: false,
          referencia_id: agendamientoData.id,
          datos: { agendamientoId: agendamientoData.id, modeloNombre: modeloNombreReal, fecha, hora, servicio: servicioSeleccionado!.name },
        })
      );

      // 2️⃣ Notificación para cada PROGRAMADOR
      if (programadores?.length) {
        notifPromises.push(
          supabase.from('notificaciones').insert(
            programadores.map((p: any) => ({
              usuario_id: p.id,
              para_usuario_id: p.id,
              para_rol: 'programador',
              tipo: 'agendamiento_nuevo',
              titulo: '📅 Nueva solicitud de cita',
              mensaje: `${clienteNombre} solicita cita con ${modeloNombreReal} el ${fecha} a las ${hora} — ${servicioSeleccionado!.name} (${ubicacion === 'sede' ? 'En Sede' : 'A Domicilio'})`,
              leida: false,
              referencia_id: agendamientoData.id,
              datos: { agendamientoId: agendamientoData.id, clienteNombre, modeloNombre: modeloNombreReal, fecha, hora, servicio: servicioSeleccionado!.name, ubicacion },
            }))
          )
        );
      }

      await Promise.all(notifPromises);

      setSuccess(true);
      setTimeout(() => { onSuccess(); }, 2000);
    } catch (e: any) {
      setError('Error inesperado: ' + (e?.message || 'intenta de nuevo'));
    }
    setLoading(false);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[95vh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, #16181c 0%, #111316 100%)',
          border: '1px solid rgba(201,169,97,0.18)',
          boxShadow: '0 0 60px rgba(201,169,97,0.1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4" style={{ background: 'rgba(22,24,28,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(201,169,97,0.1)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {modelo.photo ? (
              <img
                src={modelo.photo}
                alt={modelo.name}
                className="w-12 h-12 rounded-xl object-cover"
                style={{ border: '2px solid rgba(201,169,97,0.4)' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,169,97,0.1)', border: '2px solid rgba(201,169,97,0.2)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#c9a961' }} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#c9a961' }} />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#c9a961' }}>Confirmar Agendamiento</span>
              </div>
              <h2 className="text-lg font-bold text-white">{modelo.name}</h2>
            </div>
          </div>
        </div>

        {/* Estado de éxito */}
        {success ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">¡Solicitud enviada!</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Tu solicitud fue registrada. El programador la revisará y te confirmará pronto.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Servicio */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9a961' }}>
                <Sparkles className="w-4 h-4" /> Servicio *
              </label>
              {modelo.services?.length > 0 ? (
                <div className="space-y-2">
                  {modelo.services.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setServicioIdx(i)}
                      className="w-full text-left p-3 rounded-xl transition-all duration-200"
                      style={{
                        background: servicioIdx === i ? 'rgba(201,169,97,0.12)' : 'rgba(255,255,255,0.03)',
                        border: servicioIdx === i ? '1.5px solid rgba(201,169,97,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white">{s.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{s.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: '#c9a961' }}>
                            ${ubicacion === 'domicilio' && s.priceHome ? s.priceHome : s.price}
                          </p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{s.duration} min</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#6b7280' }}>Esta modelo no tiene servicios configurados aún.</p>
              )}
            </div>

            {/* Ubicación */}
            {modelo.domicilio && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9a961' }}>
                  <MapPin className="w-4 h-4" /> Ubicación *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sede', 'domicilio'] as const).map(loc => (
                    <button
                      key={loc}
                      onClick={() => setUbicacion(loc)}
                      className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                      style={{
                        background: ubicacion === loc ? 'rgba(201,169,97,0.15)' : 'rgba(255,255,255,0.03)',
                        border: ubicacion === loc ? '1.5px solid rgba(201,169,97,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                        color: ubicacion === loc ? '#c9a961' : '#6b7280',
                      }}
                    >
                      {loc === 'sede' ? '🏢 En Sede' : '🏠 A Domicilio'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha y Hora en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9a961' }}>
                  <Calendar className="w-4 h-4" /> Fecha *
                </label>
                <input
                  type="date"
                  min={today}
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: '#111',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    colorScheme: 'dark',
                  }}
                  onFocus={e => (e.target.style.border = '1.5px solid rgba(201,169,97,0.5)')}
                  onBlur={e => (e.target.style.border = '1.5px solid rgba(255,255,255,0.2)')}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9a961' }}>
                  <Clock className="w-4 h-4" /> Hora *
                </label>
                <select
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: '#111 !important',
                    border: '1.5px solid rgba(255,255,255,0.2) !important',
                    color: 'white !important',
                    colorScheme: 'dark',
                  }}
                  onFocus={e => (e.target.style.border = '1.5px solid rgba(201,169,97,0.5)')}
                  onBlur={e => (e.target.style.border = '1.5px solid rgba(255,255,255,0.2)')}
                >
                  <option value="" className="bg-[#111] text-white" style={{ background: '#111 !important', color: 'white !important' }}>-- Seleccionar --</option>
                  {HORAS.map(h => (
                    <option key={h} value={h} className="bg-[#111] text-white" style={{ background: '#111 !important', color: 'white !important' }}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: '#c9a961' }}>📝 Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Alguna indicación especial para el programador..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => (e.target.style.border = '1.5px solid rgba(201,169,97,0.5)')}
                onBlur={e => (e.target.style.border = '1.5px solid rgba(255,255,255,0.1)')}
              />
            </div>

            {/* Resumen del precio */}
            {servicioSeleccionado && fecha && hora && (
              <div className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(201,169,97,0.06)', border: '1px solid rgba(201,169,97,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c9a961' }}>Resumen de tu solicitud</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-white">
                    <span style={{ color: '#9ca3af' }}>Modelo</span>
                    <span className="font-semibold">{modelo.name}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span style={{ color: '#9ca3af' }}>Servicio</span>
                    <span>{servicioSeleccionado.name}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span style={{ color: '#9ca3af' }}>Fecha y Hora</span>
                    <span>{fecha} — {hora}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span style={{ color: '#9ca3af' }}>Duración</span>
                    <span>{servicioSeleccionado.duration} min</span>
                  </div>
                  <div className="flex justify-between font-bold" style={{ color: '#c9a961' }}>
                    <span>Valor estimado</span>
                    <span>${precio}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={onClose}
                disabled={loading}
                className="py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ border: '1.5px solid rgba(201,169,97,0.4)', color: '#c9a961', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={loading || success}
                className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #c9a961, #a07c3a)', color: '#0f1014' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Confirmar solicitud</>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
