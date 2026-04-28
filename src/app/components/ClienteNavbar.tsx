import React, { useState, useEffect } from 'react';
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
  const [menuAbierto, setMenuAbierto] = useState(false);

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
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '0.5px solid rgba(255,215,0,0.2)',
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12
      }}>
        <img src='/logo.png' style={{ height: 32 }} alt='BDS'
          onError={(e: any) => {
            e.target.style.display = 'none'
          }}
        />

        <span style={{
          color: '#FFD700', fontWeight: 700, fontSize: 14,
          letterSpacing: '0.05em'
        }}>
          BLACK DIAMOND
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setMostrarCitas(!mostrarCitas)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255,215,0,0.3)',
            color: 'white', borderRadius: 20,
            padding: '5px 10px', cursor: 'pointer',
            fontSize: 12, display: 'flex',
            alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap'
          }}
        >
          📅
          <span style={{ display: typeof window !== 'undefined' && window.innerWidth > 480 ? 'inline' : 'none' }}>
            Mis Citas
          </span>
          {citasPendientes.length > 0 && (
            <span style={{
              background: '#FF0000', color: 'white',
              borderRadius: '50%', width: 18, height: 18,
              fontSize: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 6px #FF0000', flexShrink: 0
            }}>
              {citasPendientes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '6px 8px',
            cursor: 'pointer', color: 'white',
            display: 'flex', flexDirection: 'column',
            gap: 4, alignItems: 'center',
            justifyContent: 'center', width: 36, height: 36
          }}
          aria-label='Menú'
        >
          <div style={{
            width: 18, height: 2,
            background: menuAbierto ? '#FFD700' : 'white',
            borderRadius: 2,
            transform: menuAbierto ? 'rotate(45deg) translate(4px, 4px)' : 'none',
            transition: 'all 0.2s'
          }} />
          <div style={{
            width: 18, height: 2,
            background: menuAbierto ? '#FFD700' : 'white',
            borderRadius: 2,
            opacity: menuAbierto ? 0 : 1,
            transition: 'all 0.2s'
          }} />
          <div style={{
            width: 18, height: 2,
            background: menuAbierto ? '#FFD700' : 'white',
            borderRadius: 2,
            transform: menuAbierto ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
            transition: 'all 0.2s'
          }} />
        </button>
      </nav>

      {menuAbierto && (
        <div
          style={{
            position: 'fixed', top: 56, left: 0, right: 0,
            background: 'rgba(0,0,0,0.98)',
            borderBottom: '0.5px solid rgba(255,215,0,0.2)',
            zIndex: 99, padding: 16
          }}
          onClick={() => setMenuAbierto(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              marginBottom: 8
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Conectado como
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 2 }}>
                {currentUser?.nombre || currentUser?.email}
              </div>
            </div>

            {[
              { icon: '🏠', label: 'Inicio', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }) } },
              { icon: '📅', label: 'Mis Citas', badge: citasPendientes.length, action: () => { setMostrarCitas(true); setMenuAbierto(false); } },
              { icon: '🔔', label: 'Notificaciones', badge: notificaciones.length, action: () => { marcarComoLeidas(); toast.success('Notificaciones marcadas como leídas'); } },
            ].map(item => (
              <button
                key={item.label}
                onClick={(e) => { e.stopPropagation(); item.action(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 8,
                  background: 'transparent',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  color: 'white', cursor: 'pointer',
                  fontSize: 14, textAlign: 'left',
                  width: '100%'
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: '#FF0000', color: 'white',
                    borderRadius: '50%', width: 20, height: 20,
                    fontSize: 11, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 6px #FF0000'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 8,
                background: 'rgba(255,0,0,0.08)',
                border: '0.5px solid rgba(255,0,0,0.3)',
                color: '#FF4444', cursor: 'pointer',
                fontSize: 14, textAlign: 'left',
                width: '100%', marginTop: 8
              }}
            >
              <span style={{ fontSize: 18 }}>🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {mostrarCitas && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0,
          background: 'rgba(0,0,0,0.98)',
          borderBottom: '0.5px solid rgba(255,215,0,0.2)',
          zIndex: 99, padding: 16,
          maxHeight: '60vh', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: '#FFD700' }}>Mis citas pendientes</h4>
            <button
              onClick={() => setMostrarCitas(false)}
              style={{
                marginLeft: 'auto', background: 'transparent',
                border: 'none', color: 'rgba(255,255,255,0.5)',
                fontSize: 20, cursor: 'pointer'
              }}
            >×</button>
          </div>

          {citasPendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <p style={{ fontSize: 13, margin: 0 }}>No tienes citas pendientes</p>
            </div>
          ) : (
            citasPendientes.map(cita => (
              <div key={cita.id} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10, padding: 12, marginBottom: 8,
                borderLeft: '3px solid ' + (
                  cita.estado === 'aprobado' ? '#4CAF50' :
                  cita.estado === 'aceptado_programador' ? '#2196F3' : '#FFA500'
                )
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'white' }}>
                  {cita.modelo_nombre}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  📅 {formatearFecha(cita.fecha)} — 🕐 {cita.hora}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {cita.tipo_servicio || cita.servicio}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                    background: cita.estado === 'aprobado'
                      ? 'rgba(76,175,80,0.2)'
                      : cita.estado === 'aceptado_programador'
                        ? 'rgba(33,150,243,0.2)'
                        : 'rgba(255,165,0,0.2)',
                    color: cita.estado === 'aprobado' ? '#4CAF50'
                      : cita.estado === 'aceptado_programador' ? '#2196F3'
                      : '#FFA500'
                  }}>
                    {cita.estado === 'aprobado' ? '✓ Aprobada'
                      : cita.estado === 'aceptado_programador' ? '📋 Confirmada'
                      : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ height: 56 }} />
    </>
  );
}
