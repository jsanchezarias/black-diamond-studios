import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '../utils/supabase/info';
import { toast } from 'sonner';

const GOLD = '#c9a961';
const BG = '#16181c';
const BDR = '#2a2a2a';

const ETIQUETAS_POSITIVAS = [
  { id: 'puntual', label: '⏰ Puntual' },
  { id: 'respetuoso', label: '🤝 Respetuoso' },
  { id: 'buen_trato', label: '😊 Buen trato' },
  { id: 'volveria', label: '🔄 Volvería' },
  { id: 'recomendado', label: '👍 Recomendado' },
  { id: 'limpio', label: '✨ Limpio' },
  { id: 'pago_rapido', label: '💰 Pago rápido' },
];

const ETIQUETAS_NEGATIVAS = [
  { id: 'impuntual', label: '⚠️ Impuntual' },
  { id: 'grosero', label: '⚠️ Grosero' },
  { id: 'problema_pago', label: '⚠️ Problema con pago' },
  { id: 'mal_trato', label: '⚠️ Mal trato' },
  { id: 'no_volveria', label: '⚠️ No volvería' },
];

const DESCRIPCIONES = ['', '😞 Muy malo', '😐 Regular', '🙂 Bueno', '😊 Muy bueno', '🌟 Excelente'];

function EstrellaSelector({
  valor,
  onChange,
  label,
  size = 'md',
}: {
  valor: number;
  onChange: (v: number) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const textSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl';
  const minW = size === 'lg' ? 'min-w-[48px] min-h-[48px]' : 'min-w-[36px] min-h-[36px]';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && (
        <span className="text-sm w-32 flex-shrink-0" style={{ color: '#888' }}>
          {label}
        </span>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            onMouseEnter={() => setHover(e)}
            onMouseLeave={() => setHover(0)}
            className={`${textSize} ${minW} flex items-center justify-center transition-transform duration-100 active:scale-110`}
          >
            <span style={{ color: e <= (hover || valor) ? GOLD : '#444' }}>
              {e <= (hover || valor) ? '★' : '☆'}
            </span>
          </button>
        ))}
      </div>
      {(hover || valor) > 0 && (
        <span className="text-xs" style={{ color: '#888' }}>
          {DESCRIPCIONES[hover || valor]}
        </span>
      )}
    </div>
  );
}

export interface CalificacionData {
  agendamientoId: string;
  modeloId: string;
  clienteId: string;
  clienteNombre: string;
  tipoServicio: string;
  duracionMinutos: number;
  modeloNombre: string;
}

interface CalificarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CalificacionData | null;
}

export function CalificarClienteModal({ isOpen, onClose, data }: CalificarClienteModalProps) {
  const [estrellas, setEstrellas] = useState(0);
  const [puntualidad, setPuntualidad] = useState(0);
  const [comportamiento, setComportamiento] = useState(0);
  const [pago, setPago] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const toggleEtiqueta = (id: string) => {
    setEtiquetas((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setEstrellas(0);
    setPuntualidad(0);
    setComportamiento(0);
    setPago(0);
    setEtiquetas([]);
    setObservaciones('');
  };

  const handleOmitir = () => {
    reset();
    onClose();
  };

  const handleEnviar = async () => {
    if (!data) return;
    if (!estrellas) {
      toast.error('Selecciona al menos una estrella');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase.from('calificaciones_clientes').insert({
        agendamiento_id: data.agendamientoId,
        modelo_id: data.modeloId,
        cliente_id: data.clienteId,
        estrellas,
        puntualidad: puntualidad || null,
        comportamiento: comportamiento || null,
        pago: pago || null,
        etiquetas,
        observaciones: observaciones.trim() || null,
      });

      if (error) throw error;

      const tieneAlerta =
        etiquetas.some((e) => ['grosero', 'mal_trato', 'problema_pago'].includes(e)) ||
        estrellas <= 2;

      if (tieneAlerta) {
        await supabase.from('notificaciones').insert({
          para_rol: 'administrador',
          titulo: '⚠️ Alerta de cliente',
          mensaje: `${data.modeloNombre} calificó con ${estrellas}⭐ al cliente ${data.clienteNombre}${observaciones.trim() ? ` — "${observaciones.trim()}"` : ''}`,
          tipo: 'alerta_cliente',
          referencia_id: data.agendamientoId,
          leida: false,
        });
      }

      toast.success('✅ Calificación enviada');
      reset();
      onClose();
    } catch (err: any) {
      toast.error('Error al enviar la calificación');
      if (process.env.NODE_ENV === 'development') console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  if (!data) return null;

  const horas = Math.floor(data.duracionMinutos / 60);
  const mins = data.duracionMinutos % 60;
  const duracionTexto = horas > 0
    ? `${horas}h${mins > 0 ? ` ${mins}min` : ''}`
    : `${mins}min`;

  return (
    <Dialog open={isOpen} onOpenChange={handleOmitir}>
      <DialogContent
        className="w-full max-w-lg mx-auto p-0 overflow-hidden flex flex-col"
        style={{
          background: BG,
          border: `1px solid ${BDR}`,
          maxHeight: '95dvh',
        }}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BDR}` }}>
          <DialogTitle className="flex items-center gap-2 text-base font-bold" style={{ color: GOLD }}>
            <span className="text-xl">⭐</span>
            Califica este servicio
          </DialogTitle>

          {/* Info cliente */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: `${GOLD}22`, border: `2px solid ${GOLD}55`, color: GOLD }}
            >
              {data.clienteNombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{data.clienteNombre}</p>
              <p className="text-xs" style={{ color: '#888' }}>
                {data.tipoServicio} · {duracionTexto}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Calificación general */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
              Calificación General
            </p>
            <EstrellaSelector valor={estrellas} onChange={setEstrellas} size="lg" />
          </div>

          <div style={{ height: 1, background: BDR }} />

          {/* Categorías */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
              Categorías
            </p>
            <div className="space-y-3">
              <EstrellaSelector valor={puntualidad} onChange={setPuntualidad} label="Puntualidad" size="sm" />
              <EstrellaSelector valor={comportamiento} onChange={setComportamiento} label="Comportamiento" size="sm" />
              <EstrellaSelector valor={pago} onChange={setPago} label="Forma de pago" size="sm" />
            </div>
          </div>

          <div style={{ height: 1, background: BDR }} />

          {/* Etiquetas */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
              Etiquetas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {ETIQUETAS_POSITIVAS.map((et) => {
                const sel = etiquetas.includes(et.id);
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => toggleEtiqueta(et.id)}
                    className="rounded-full px-3 py-1 text-xs transition-all"
                    style={{
                      background: sel ? `${GOLD}22` : '#1a1a1a',
                      border: `1px solid ${sel ? GOLD : BDR}`,
                      color: sel ? GOLD : '#888',
                    }}
                  >
                    {et.label}
                  </button>
                );
              })}
              {ETIQUETAS_NEGATIVAS.map((et) => {
                const sel = etiquetas.includes(et.id);
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => toggleEtiqueta(et.id)}
                    className="rounded-full px-3 py-1 text-xs transition-all"
                    style={{
                      background: sel ? 'rgba(239,68,68,0.15)' : '#1a1a1a',
                      border: `1px solid ${sel ? '#ef4444' : BDR}`,
                      color: sel ? '#f87171' : '#888',
                    }}
                  >
                    {et.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: BDR }} />

          {/* Observaciones */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#888' }}>
              Observaciones <span style={{ color: '#555', fontWeight: 400 }}>(opcional)</span>
            </p>
            <Textarea
              placeholder="Escribe algo sobre este cliente..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              style={{
                background: '#111',
                border: `1px solid ${BDR}`,
                color: '#e8e6e3',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex gap-3 px-5 py-4"
          style={{ borderTop: `1px solid ${BDR}` }}
        >
          <Button
            type="button"
            onClick={handleOmitir}
            disabled={guardando}
            className="flex-1 h-11"
            style={{
              background: '#1a1a1a',
              border: `1px solid ${BDR}`,
              color: '#888',
            }}
          >
            Omitir
          </Button>
          <Button
            type="button"
            onClick={handleEnviar}
            disabled={guardando || !estrellas}
            className="flex-1 h-11 font-bold"
            style={{
              background: estrellas ? GOLD : '#2a2a2a',
              color: estrellas ? '#0f1014' : '#555',
              border: 'none',
            }}
          >
            {guardando ? 'Enviando...' : '⭐ Enviar calificación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
