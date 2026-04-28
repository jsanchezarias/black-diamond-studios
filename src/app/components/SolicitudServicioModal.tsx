import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface SolicitudServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    model: any;
    service?: any;
    location?: 'sede' | 'domicilio';
    price?: string;
  } | null;
  currentUser: any;
}

export function SolicitudServicioModal({ isOpen, onClose, data, currentUser }: SolicitudServicioModalProps) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [sede, setSede] = useState('sede_norte');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const servicios = [
    { nombre: 'Rato', duracion: '15 min', duracion_minutos: 15, precio_sede: 130000, precio_domicilio: 150000 },
    { nombre: '30 Min', duracion: '30 min', duracion_minutos: 30, precio_sede: 160000, precio_domicilio: 180000 },
    { nombre: '1 Hora', duracion: '1 hora', duracion_minutos: 60, precio_sede: 190000, precio_domicilio: 220000 },
    { nombre: '2 Horas', duracion: '2 horas', duracion_minutos: 120, precio_sede: 360000, precio_domicilio: 400000 },
    { nombre: '3 Horas', duracion: '3 horas', duracion_minutos: 180, precio_sede: 520000, precio_domicilio: 580000 },
    { nombre: '6 Horas', duracion: '6 horas', duracion_minutos: 360, precio_sede: 1000000, precio_domicilio: 1100000 }
  ];

  useEffect(() => {
    if (isOpen && data) {
      if (data.service) {
        const match = servicios.find(s => s.nombre.toLowerCase().includes(data.service.name.toLowerCase()) || data.service.name.toLowerCase().includes(s.nombre.toLowerCase()));
        if (match) setServicioSeleccionado(match);
      }
      if (data.location) {
        setSede(data.location === 'sede' ? 'sede_norte' : 'domicilio');
      }
    } else {
      // Reset form on close
      setServicioSeleccionado(null);
      setFecha('');
      setHora('');
      setSede('sede_norte');
      setDireccion('');
      setNotas('');
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const modelo = data.model;

  const precioActual = servicioSeleccionado
    ? sede === 'sede_norte'
      ? servicioSeleccionado.precio_sede
      : servicioSeleccionado.precio_domicilio
    : 0;

  const hoy = new Date().toISOString().split('T')[0];

  const horasDisponibles = [
    '10:00','11:00','12:00','13:00','14:00',
    '15:00','16:00','17:00','18:00','19:00','20:00','21:00'
  ];

  const enviarReserva = async () => {
    if (!servicioSeleccionado) { toast.error('Selecciona un servicio'); return; }
    if (!fecha) { toast.error('Selecciona una fecha'); return; }
    if (!hora) { toast.error('Selecciona una hora'); return; }
    if (sede === 'domicilio' && !direccion) { toast.error('Ingresa tu dirección'); return; }
    if (!currentUser) { toast.error('Debes iniciar sesión para reservar'); return; }

    setLoading(true);

    try {
      const { data: perfilCliente } = await supabase
        .from('usuarios')
        .select('nombre, email')
        .eq('id', currentUser.id)
        .single();

      const { data: clienteInfo } = await supabase
        .from('clientes')
        .select('nombre, telefono')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      const nombreCliente = clienteInfo?.nombre
        || perfilCliente?.nombre
        || perfilCliente?.email?.split('@')[0]
        || 'Cliente';

      const modeloIdValido = modelo.id && String(modelo.id).includes('-') ? modelo.id : null;
      const clienteIdValido = currentUser.id && String(currentUser.id).includes('-') ? currentUser.id : null;

      const insertData = {
          cliente_id: clienteIdValido,
          cliente_nombre: nombreCliente,
          cliente_telefono: clienteInfo?.telefono || 'No registrado',
          modelo_id: modeloIdValido,
          modelo_email: modelo.email || 'modelo@app.com',
          modelo_nombre: modelo.nombre_artistico || modelo.name || 'Modelo',
          tipo_servicio: servicioSeleccionado.nombre,
          servicio: servicioSeleccionado.nombre,
          duracion: servicioSeleccionado.duracion_minutos || 60,
          duracion_minutos: servicioSeleccionado.duracion_minutos || 60,
          precio: precioActual,
          fecha: fecha,
          hora: hora,
          ubicacion: sede === 'sede_norte' ? 'sede' : 'domicilio',
          habitacion: sede === 'domicilio' ? direccion : 'Por asignar',
          notas: notas || null,
          estado: 'pendiente',
          creado_por: currentUser.email || 'cliente',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
      };

      console.log('INSERT DATA:', insertData);

      const { data: agendamiento, error } = await supabase
        .from('agendamientos')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('ERROR INSERT:', error.message, error.code, error.details);
        toast.error('Error al enviar: ' + error.message);
        setLoading(false);
        return;
      }

      // Notificar al programador
      try {
        const { data: destinatarios } = await supabase
          .from('usuarios')
          .select('id, email, role')
          .in('role', ['admin', 'owner', 'programador', 'recepcionista']);

        const fechaLegible = (() => {
          const [y, m, d] = (agendamiento.fecha || '').split('-');
          if (!y) return agendamiento.fecha || '';
          return new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
        })();
        const horaLegible = (() => {
          const h = (agendamiento.hora || '').substring(0, 5);
          const [hh, mm] = h.split(':');
          const n = parseInt(hh);
          return (n % 12 || 12) + ':' + mm + ' ' + (n >= 12 ? 'PM' : 'AM');
        })();
        const precioFmt = agendamiento.precio ? '$' + Number(agendamiento.precio).toLocaleString('es-CO') : '';
        const sedeLabel = agendamiento.ubicacion === 'domicilio' ? 'A domicilio' : 'Sede';
        const telefonoStr = clienteInfo?.telefono || '';

        const mensajeDetallado = [
          `👤 ${nombreCliente}${telefonoStr ? ' • 📞 ' + telefonoStr : ''}`,
          `💃 ${agendamiento.modelo_nombre || ''}`,
          `⏱️ ${agendamiento.tipo_servicio || agendamiento.servicio || ''} ${precioFmt}`,
          `📅 ${fechaLegible} a las ${horaLegible}`,
          `📍 ${sedeLabel}`,
        ].filter(Boolean).join('\n');

        const notificaciones = (destinatarios || []).map((d: any) => ({
          usuario_id: d.id,
          usuario_email: d.email,
          titulo: `🔔 Nueva solicitud — ${nombreCliente}`,
          mensaje: mensajeDetallado,
          tipo: 'agendamiento_nuevo',
          referencia_id: agendamiento.id,
          leida: false,
          created_at: new Date().toISOString()
        }));

        if (notificaciones.length > 0) {
          await supabase.from('notificaciones').insert(notificaciones);
        }
      } catch (err) {
        console.error('Error enviando notificaciones:', err);
      }

      toast.success('✅ Reserva enviada. Tu programador la confirmará pronto.');
      onClose();
      setLoading(false);
    } catch (err: any) {
      console.error('Error general:', err);
      toast.error('Error al enviar la reserva.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div style={{
        background: '#111',
        border: '0.5px solid rgba(255,215,0,0.3)',
        borderRadius: 16, padding: 24,
        maxWidth: 480, width: '100%',
        maxHeight: '92vh', overflowY: 'auto'
      }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img
            src={modelo.photo || modelo.foto_url}
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
            onError={(e: any) => e.target.style.display = 'none'}
            alt={modelo.nombre_artistico || modelo.name}
          />
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: 18 }}>
              {modelo.nombre_artistico || modelo.name}
            </h3>
            <span style={{
              background: 'rgba(255,215,0,0.15)',
              color: '#FFD700', borderRadius: 20,
              padding: '2px 10px', fontSize: 11, fontWeight: 600
            }}>
              Reservar servicio
            </span>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'transparent',
            border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1
          }}>×</button>
        </div>

        {/* SECCIÓN 1 — SERVICIO */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
            1. Selecciona el servicio
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {servicios.map(s => (
              <div
                key={s.nombre}
                onClick={() => setServicioSeleccionado(s)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 10, cursor: 'pointer',
                  border: servicioSeleccionado?.nombre === s.nombre
                    ? '1.5px solid #FFD700'
                    : '0.5px solid rgba(255,255,255,0.1)',
                  background: servicioSeleccionado?.nombre === s.nombre
                    ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: servicioSeleccionado?.nombre === s.nombre ? '#FFD700' : 'white' }}>
                  {s.nombre}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  ⏱ {s.duracion}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4CAF50', marginTop: 6 }}>
                  ${(sede === 'sede_norte' ? s.precio_sede : s.precio_domicilio).toLocaleString('es-CO')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 2 — SEDE */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
            2. ¿Dónde prefieres el servicio?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'sede_norte', label: '🏢 Sede Norte' },
              { value: 'domicilio', label: '🏠 A Domicilio' }
            ].map(op => (
              <button
                key={op.value}
                onClick={() => setSede(op.value)}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: 8, cursor: 'pointer',
                  border: sede === op.value
                    ? '1.5px solid #FFD700'
                    : '0.5px solid rgba(255,255,255,0.1)',
                  background: sede === op.value
                    ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                  color: sede === op.value ? '#FFD700' : 'rgba(255,255,255,0.7)',
                  fontWeight: sede === op.value ? 700 : 400, fontSize: 13
                }}
              >
                {op.label}
              </button>
            ))}
          </div>
          {sede === 'domicilio' && (
            <input
              placeholder='Escribe tu dirección completa'
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              style={{
                width: '100%', marginTop: 8,
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
          )}
        </div>

        {/* SECCIÓN 3 — FECHA */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
            3. Selecciona la fecha
          </p>
          <input
            type='date'
            value={fecha}
            min={hoy}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'white', fontSize: 13, boxSizing: 'border-box'
            }}
          />
          {fecha && (
            <div style={{ fontSize: 12, color: '#FFD700', marginTop: 6 }}>
              📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
          )}
        </div>

        {/* SECCIÓN 4 — HORA */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
            4. Selecciona la hora
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {horasDisponibles.map(h => (
              <button
                key={h}
                onClick={() => setHora(h)}
                style={{
                  padding: '9px 4px', borderRadius: 6, cursor: 'pointer',
                  border: hora === h ? '1.5px solid #FFD700' : '0.5px solid rgba(255,255,255,0.1)',
                  background: hora === h ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                  color: hora === h ? '#FFD700' : 'rgba(255,255,255,0.6)',
                  fontWeight: hora === h ? 700 : 400, fontSize: 12
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* SECCIÓN 5 — NOTAS OPCIONALES */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>
            5. Notas adicionales (opcional)
          </p>
          <textarea
            placeholder='Ej: Prefiero perfume suave, tengo alguna preferencia...'
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'white', fontSize: 13, resize: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* RESUMEN SI ESTÁ COMPLETO */}
        {servicioSeleccionado && fecha && hora && (
          <div style={{
            background: 'rgba(255,215,0,0.08)',
            border: '0.5px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: 14, marginBottom: 16
          }}>
            <div style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, marginBottom: 8 }}>
              📋 Resumen de tu reserva
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 2 }}>
              <div>💃 <strong>{modelo.nombre_artistico || modelo.name}</strong></div>
              <div>⏱ {servicioSeleccionado.nombre} — {servicioSeleccionado.duracion}</div>
              <div>📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div>🕐 {hora}</div>
              <div>📍 {sede === 'sede_norte' ? 'Sede Norte' : 'Domicilio — ' + direccion}</div>
              <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, color: '#4CAF50' }}>
                💰 ${precioActual.toLocaleString('es-CO')}
                {sede === 'domicilio' ? ' + domicilio' : ''}
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN CONFIRMAR */}
        <button
          onClick={enviarReserva}
          disabled={!servicioSeleccionado || !fecha || !hora || loading || (sede === 'domicilio' && !direccion)}
          style={{
            width: '100%', padding: 14,
            background: (!servicioSeleccionado || !fecha || !hora)
              ? 'rgba(255,215,0,0.2)'
              : 'linear-gradient(135deg, #B8860B, #FFD700)',
            border: 'none', borderRadius: 10,
            color: (!servicioSeleccionado || !fecha || !hora) ? 'rgba(0,0,0,0.4)' : 'black',
            fontWeight: 700, fontSize: 15,
            cursor: (!servicioSeleccionado || !fecha || !hora) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Enviando...' : '✅ Confirmar reserva'}
        </button>

        {(!servicioSeleccionado || !fecha || !hora) && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Completa todos los campos para continuar
          </p>
        )}
      </div>
    </div>
  );
}
