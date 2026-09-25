import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle2, Clock, LogOut, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { VENTANA_RESPUESTA_MS } from '../utils/calculoComisiones';

interface ConfirmacionActividadModalProps {
  isOpen: boolean;
  modeloNombre: string;
  tiempoRestanteMs: number; // Milisegundos restantes de los 15 minutos
  onConfirmar: () => void;
  onFinalizar: () => void;
  onExpirado: () => void;
}

export function ConfirmacionActividadModal({
  isOpen,
  modeloNombre,
  tiempoRestanteMs,
  onConfirmar,
  onFinalizar,
  onExpirado,
}: ConfirmacionActividadModalProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(
    Math.max(0, Math.floor(tiempoRestanteMs / 1000))
  );
  const audioReproducidoRef = useRef(false);

  // Sincronizar tiempo restante cuando cambie o abra
  useEffect(() => {
    if (isOpen) {
      setSegundosRestantes(Math.max(0, Math.floor(tiempoRestanteMs / 1000)));
      reproducirAlertaSonora();
    } else {
      audioReproducidoRef.current = false;
    }
  }, [isOpen, tiempoRestanteMs]);

  // Contador regresivo en tiempo real
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpirado();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onExpirado]);

  // Sonido suave y elegante con Web Audio API (sin dependencias externas)
  const reproducirAlertaSonora = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Secuencia de 2 notas doradas suaves
      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      playTone(587.33, 0.0, 0.4); // D5
      playTone(880.00, 0.25, 0.6); // A5

      // Si el dispositivo soporta vibración
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // Ignorar fallas de autoplay de audio
    }
  };

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const progresoVentana = Math.max(0, Math.min(100, (segundosRestantes / (VENTANA_RESPUESTA_MS / 1000)) * 100));

  const colorUrgencia =
    segundosRestantes <= 180 ? '#ef4444' : segundosRestantes <= 420 ? '#eab308' : '#c9a961';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md bg-[#121418] border-2 border-[#c9a961]/50 text-white p-6 rounded-2xl shadow-[0_0_50px_rgba(201,169,97,0.25)]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#c9a961]/15 border-2 border-[#c9a961]/40 flex items-center justify-center shadow-[0_0_20px_rgba(201,169,97,0.2)] animate-pulse">
            <Clock className="w-8 h-8 text-[#c9a961]" />
          </div>

          <DialogTitle className="text-2xl font-bold text-[#c9a961] font-['Playfair_Display',serif]">
            ¿Sigues activa en tu turno?
          </DialogTitle>

          <DialogDescription className="text-gray-300 text-sm">
            Hola <strong className="text-white">{modeloNombre}</strong>, han pasado 90 minutos de actividad. Por favor confirma tu presencia para mantener la contabilidad de tu turno y tu perfil disponible.
          </DialogDescription>
        </DialogHeader>

        <div className="my-5 space-y-4">
          {/* Reloj de cuenta regresiva */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-center space-y-2 relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
              style={{ width: `${progresoVentana}%`, backgroundColor: colorUrgencia }}
            />
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
              Tiempo para responder
            </p>
            <div
              className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight"
              style={{ color: colorUrgencia }}
            >
              {minutos.toString().padStart(2, '0')}:{segundos.toString().padStart(2, '0')}
            </div>
            <p className="text-[11px] text-gray-400">
              Si no respondes antes de que termine el tiempo, tu estado pasará a <strong>inactivo</strong> y el temporizador se detendrá.
            </p>
          </div>

          {/* Recordatorio de comisiones */}
          <div className="p-3 rounded-lg bg-[#c9a961]/10 border border-[#c9a961]/25 flex items-start gap-2.5 text-xs text-gray-300">
            <Sparkles className="w-4 h-4 text-[#c9a961] flex-shrink-0 mt-0.5" />
            <span>
              Recuerda: Los servicios dentro de tus 8 horas se pagan al <strong>50%</strong> y pasadas las 8 horas al <strong className="text-[#c9a961]">60% modelo</strong> (40% casa).
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3 pt-1">
          <Button
            onClick={onConfirmar}
            className="w-full h-14 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] hover:brightness-110 text-black font-extrabold text-base rounded-xl shadow-[0_0_25px_rgba(201,169,97,0.35)] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            ¡SÍ, SIGO ACTIVA EN MI TURNO!
          </Button>

          <Button
            onClick={onFinalizar}
            variant="ghost"
            className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            No, deseo finalizar mi jornada ahora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
