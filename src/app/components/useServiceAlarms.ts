import { useEffect, useRef } from 'react';
import { useAgendamientos } from './AgendamientosContext';
import { toast } from 'sonner';

export function useServiceAlarms(userEmail?: string, rol?: 'modelo' | 'supervisor' | 'admin') {
  const context = useAgendamientos();
  // Safe check if context is undefined (not inside provider)
  const agendamientos = context?.agendamientos || [];
  const notifiedAlarms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!agendamientos || agendamientos.length === 0) return;

    const checkAlarms = () => {
      const now = new Date();
      
      agendamientos.forEach(agendamiento => {
        // Solo para agendamientos confirmados o aprobados
        if (agendamiento.estado !== 'confirmado' && agendamiento.estado !== 'aprobado') return;

        // Filtrar por rol:
        // Si es modelo, solo ver sus propias alarmas.
        if (rol === 'modelo' && agendamiento.modeloEmail !== userEmail) return;

        // Si ya notificamos esta alarma, saltar
        if (notifiedAlarms.current.has(agendamiento.id)) return;

        // Construir la fecha del servicio
        if (!agendamiento.fecha || !agendamiento.hora) return;
        
        try {
          // Parse YYYY-MM-DD
          let year, month, day;
          if (agendamiento.fecha.includes('-')) {
            [year, month, day] = agendamiento.fecha.split('-');
          } else {
            const dateObj = new Date(agendamiento.fecha);
            year = dateObj.getFullYear();
            month = dateObj.getMonth() + 1;
            day = dateObj.getDate();
          }

          const [hour, minute] = agendamiento.hora.split(':');
          
          const serviceDate = new Date(
            parseInt(year as string),
            parseInt(month as string) - 1,
            parseInt(day as string),
            parseInt(hour),
            parseInt(minute)
          );

          const diffMs = serviceDate.getTime() - now.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));

          // Si faltan exactamente 15 minutos (o entre 14 y 15)
          if (diffMinutes === 15 || diffMinutes === 14) {
            notifiedAlarms.current.add(agendamiento.id);
            
            // Notificar
            toast.message('🚨 ALARMA DE SERVICIO 🚨', {
              description: `El servicio de ${agendamiento.modeloNombre} comienza en 15 minutos. (${agendamiento.hora})`,
              duration: 20000,
              style: {
                background: '#450a0a',
                borderColor: '#ef4444',
                color: '#fca5a5'
              }
            });

            // Reproducir sonido beep usando AudioContext para evitar problemas de CORS de archivos
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
              gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
              
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.5); // Medio segundo
              
              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.5);
              }, 700);
            } catch (e) {
              console.log('Audio error:', e);
            }
          }
        } catch (e) {
          console.error('Error parseando fecha para alarma', e);
        }
      });
    };

    // Check immediately
    checkAlarms();

    // Check every minute
    const interval = setInterval(checkAlarms, 60000);
    return () => clearInterval(interval);
  }, [agendamientos, userEmail, rol]);
}
