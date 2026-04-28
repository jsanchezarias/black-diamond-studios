import React, { useState, useEffect } from 'react';
import { Bell, Calendar as CalendarIcon, User, LogOut, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

export const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  const [year, month, day] = fecha.split('-');
  if (year && month && day) {
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
  return fecha;
};

interface ClienteNavbarProps {
  currentUser: {
    id: string;
    nombre: string;
    email: string;
  };
  onLogout: () => void;
}

export function ClienteNavbar({ currentUser, onLogout }: ClienteNavbarProps) {
  const [citasPendientes, setCitasPendientes] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrarCitas, setMostrarCitas] = useState(false);
  const [mostrarNotif, setMostrarNotif] = useState(false);

  const cargarCitas = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('agendamientos')
      .select('id, fecha, hora, modelo_nombre, tipo_servicio, estado')
      .eq('cliente_id', currentUser.id)
      .gte('fecha', hoy)
      .not('estado', 'in', '("completado","cancelado","no_show")')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
      
    setCitasPendientes(data || []);
  };

  const cargarNotificaciones = async () => {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', currentUser.id)
      .eq('leida', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotificaciones(data || []);
  };

  const marcarComoLeidas = async () => {
    if (notificaciones.length === 0) return;
    
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', currentUser.id);
      
    setNotificaciones([]);
  };

  useEffect(() => {
    cargarCitas();
    cargarNotificaciones();

    const channel = supabase
      .channel('cliente-navbar-' + currentUser.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agendamientos',
        filter: 'cliente_id=eq.' + currentUser.id
      }, () => { cargarCitas(); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: 'usuario_id=eq.' + currentUser.id
      }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev]);
        toast(payload.new.titulo, { icon: '🔔' });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-b border-amber-500/20 px-4 h-16 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="h-8 object-contain hidden sm:block" alt="Black Diamond" />
          <span className="text-amber-500 font-bold tracking-widest text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
            BLACK DIAMOND
          </span>
        </div>
        
        <span className="flex-1" />

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              setMostrarCitas(!mostrarCitas);
              setMostrarNotif(false);
            }}
            className="flex items-center gap-2 bg-transparent border border-amber-500/30 text-white rounded-full px-3 py-1.5 cursor-pointer text-xs sm:text-sm hover:bg-white/5 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Mis Citas</span>
            {citasPendientes.length > 0 && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(255,0,0,0.6)]">
                {citasPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setMostrarNotif(!mostrarNotif);
              setMostrarCitas(false);
              if (mostrarNotif && notificaciones.length > 0) {
                marcarComoLeidas();
              }
            }}
            className="relative bg-transparent border-none text-white cursor-pointer p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-white/80" />
            {notificaciones.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(255,0,0,0.6)]">
                {notificaciones.length}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
            <User className="w-4 h-4 text-amber-500" />
            <span className="truncate max-w-[120px]">{currentUser.nombre}</span>
          </div>

          <button 
            onClick={onLogout} 
            className="bg-transparent border border-red-500/40 text-red-400 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs flex items-center gap-1 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>

        {mostrarCitas && (
          <div className="absolute top-[70px] right-4 bg-black/95 border border-amber-500/20 rounded-xl p-4 w-[320px] max-h-[400px] overflow-y-auto shadow-2xl backdrop-blur-xl z-[200]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold flex items-center gap-2 m-0 text-sm">
                <CalendarIcon className="w-4 h-4 text-amber-500" /> Mis citas pendientes
              </h4>
              <button onClick={() => setMostrarCitas(false)} className="text-white/50 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {citasPendientes.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-6 border border-dashed border-white/10 rounded-lg">
                No tienes citas pendientes
              </p>
            ) : (
              <div className="space-y-2.5">
                {citasPendientes.map(cita => (
                  <div key={cita.id} className={`bg-white/5 rounded-lg p-3 border-l-4 ${
                    cita.estado === 'aprobado' ? 'border-green-500' :
                    cita.estado === 'pendiente' ? 'border-amber-500' : 'border-blue-500'
                  } hover:bg-white/10 transition-colors`}>
                    <div className="font-semibold text-white text-sm">
                      {cita.modelo_nombre}
                    </div>
                    <div className="text-white/60 text-xs mt-1.5 flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3" />
                      {formatearFecha(cita.fecha)} — {cita.hora || '--:--'}
                    </div>
                    <div className="text-white/50 text-xs mt-1">
                      {cita.tipo_servicio}
                    </div>
                    <div className="mt-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cita.estado === 'aprobado' ? 'bg-green-500/20 text-green-400' : 
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {cita.estado === 'aprobado' ? '✓ Aprobada' : '⏳ Pendiente de confirmación'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mostrarNotif && (
          <div className="absolute top-[70px] right-4 bg-black/95 border border-amber-500/20 rounded-xl p-4 w-[320px] max-h-[400px] overflow-y-auto shadow-2xl backdrop-blur-xl z-[200]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold flex items-center gap-2 m-0 text-sm">
                <Bell className="w-4 h-4 text-amber-500" /> Notificaciones
              </h4>
              <button onClick={() => {
                setMostrarNotif(false);
                marcarComoLeidas();
              }} className="text-white/50 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {notificaciones.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-6 border border-dashed border-white/10 rounded-lg">
                No tienes notificaciones nuevas
              </p>
            ) : (
              <div className="space-y-2">
                {notificaciones.map(notif => (
                  <div key={notif.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="font-semibold text-amber-400 text-xs mb-1">
                      {notif.titulo}
                    </div>
                    <div className="text-white/80 text-xs">
                      {notif.mensaje}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={marcarComoLeidas}
                  className="w-full mt-3 py-2 text-xs text-white/50 hover:text-white bg-white/5 rounded-lg transition-colors"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
      {/* Spacer para que el navbar fixed no tape contenido */}
      <div className="h-16 w-full" />
    </>
  );
}
