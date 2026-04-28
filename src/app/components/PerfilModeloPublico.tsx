import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/info';
import {
  X, Star, MapPin, Clock, ChevronLeft, ChevronRight,
  Calendar, Home, Building, DollarSign, Ruler, Languages,
  User, Phone, FileText, Timer, CheckCircle, Heart
} from 'lucide-react';

interface PerfilModeloPublicoProps {
  modeloId: string;
  onClose: () => void;
  currentUser?: { id: string; email: string; nombre?: string } | null;
  onLoginRequired?: () => void;
}

const HORAS_DISPONIBLES = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

function formatPrecio(valor: number) {
  return '$' + valor.toLocaleString('es-CO');
}

function calcularEdad(fechaNacimiento?: string | null) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function PerfilModeloPublico({ modeloId, onClose, currentUser, onLoginRequired }: PerfilModeloPublicoProps) {
  const [perfil, setPerfil] = useState<any>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [fotoActual, setFotoActual] = useState(0);
  const [tabServicio, setTabServicio] = useState<'sede' | 'domicilio'>('sede');
  const [loading, setLoading] = useState(true);

  // Modal de reserva
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState<'sede' | 'domicilio'>('sede');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, [modeloId]);

  // Auto-advance carousel
  useEffect(() => {
    if (fotos.length <= 1) return;
    const interval = setInterval(() => {
      setFotoActual(prev => (prev + 1) % fotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [fotos.length]);

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      const { data: modelo } = await supabase
        .from('usuarios')
        .select('id, nombre_artistico, nombreArtistico, nombre, descripcion, altura, medidas, idiomas, sede, edad, foto_perfil, fotoPerfil, rating, calificacion')
        .eq('id', modeloId)
        .single();

      if (modelo) {
        const fotoPerfilUrl = modelo.foto_perfil || modelo.fotoPerfil;
        const nombre = modelo.nombre_artistico || modelo.nombreArtistico || modelo.nombre;
        const rating = modelo.rating || modelo.calificacion || 5.0;
        const estatura = modelo.altura;
        setPerfil({ ...modelo, nombre_display: nombre, foto_principal: fotoPerfilUrl, rating, estatura });
      }

      const { data: fotosData } = await supabase
        .from('modelo_fotos')
        .select('url, es_principal, orden')
        .eq('modelo_id', modeloId)
        .order('es_principal', { ascending: false })
        .order('orden', { ascending: true });

      const urlsFotos: string[] = [];
      if (modelo?.foto_perfil || modelo?.fotoPerfil) {
        urlsFotos.push(modelo.foto_perfil || modelo.fotoPerfil);
      }
      if (fotosData && fotosData.length > 0) {
        fotosData.forEach((f: any) => {
          if (f.url && !urlsFotos.includes(f.url)) urlsFotos.push(f.url);
        });
      }
      if (urlsFotos.length === 0) {
        urlsFotos.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(perfil?.nombre_display || 'Modelo')}&background=1a1a1a&color=d4af37&size=600`);
      }
      setFotos(urlsFotos);

      const { data: serviciosData } = await supabase
        .from('servicios_modelo')
        .select('*')
        .eq('modelo_id', modeloId)
        .eq('activo', true)
        .order('duracion_minutos', { ascending: true });

      if (serviciosData && serviciosData.length > 0) {
        setServicios(serviciosData);
      } else {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('politica_tarifa')
          .eq('id', modeloId)
          .single();
        
        const politicaId = userData?.politica_tarifa || 2;
        
        const { data: serviciosPolitica } = await supabase
          .from('servicios_politica')
          .select('*')
          .eq('politica_id', politicaId)
          .order('orden', { ascending: true });
          
        if (serviciosPolitica && serviciosPolitica.length > 0) {
          const mappedServicios = serviciosPolitica.map((s: any) => {
            let duracionMinutos = 60;
            const durStr = (s.duracion || '').toLowerCase();
            if (durStr.includes('hora')) {
              const match = durStr.match(/(\d+)/);
              duracionMinutos = match ? parseInt(match[1]) * 60 : 60;
            } else if (durStr.includes('minuto') || durStr.includes('min')) {
              const match = durStr.match(/(\d+)/);
              duracionMinutos = match ? parseInt(match[1]) : 60;
            }
            
            return {
              id: s.id,
              modelo_id: modeloId,
              nombre: s.nombre,
              descripcion: s.descripcion || '',
              duracion_minutos: duracionMinutos,
              precio_sede: s.precio_sede || 0,
              precio_domicilio: s.precio_domicilio || s.precio_sede || 0,
              activo: true
            };
          });
          setServicios(mappedServicios);
        } else {
          setServicios([]);
        }
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
    setLoading(false);
  };

  const notificarNuevaReserva = async (agendamiento: any, nombreCliente: string, telefonoCliente: string) => {
    try {
      const { data: destinatarios } = await supabase
        .from('usuarios')
        .select('id, email, role')
        .in('role', ['admin', 'owner', 'programador', 'recepcionista']);

      // ✅ Mejora 4: mensaje más informativo con todos los datos clave
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

      const mensajeDetallado = [
        `👤 ${nombreCliente}${telefonoCliente ? ' • 📞 ' + telefonoCliente : ''}`,
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
  };

  const hacerReserva = async () => {
    if (!currentUser) {
      onLoginRequired?.();
      return;
    }
    if (!fecha || !hora) {
      toast.error('Por favor selecciona fecha y hora');
      return;
    }
    // ✅ Mejora 2: validar que la fecha no sea pasada
    const hoyCheck = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
    if (fecha < hoyCheck) {
      toast.error('La fecha seleccionada ya pasó, elige una fecha futura');
      return;
    }
    if (ubicacion === 'domicilio' && !direccion.trim()) {
      toast.error('Por favor ingresa la dirección para el servicio a domicilio');
      return;
    }

    setEnviando(true);
    try {
      const actualId = currentUser.id || (currentUser as any).userId;

      // ✅ Bug 1 Fix: buscar nombre real en clientes Y en usuarios
      let query = supabase.from('clientes').select('id, user_id, telefono, nombre, email');
      if (actualId) {
        query = query.or(`id.eq.${actualId},user_id.eq.${actualId}`);
      } else if (currentUser.email) {
        query = query.eq('email', currentUser.email);
      }
      const { data: clienteData } = await query.maybeSingle();

      // Fallback a tabla usuarios si clientes no tiene nombre
      let nombreCliente = clienteData?.nombre || currentUser.nombre || (currentUser as any).username;
      if (!nombreCliente || nombreCliente === currentUser.email) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', actualId)
          .maybeSingle();
        nombreCliente = usuarioData?.nombre || nombreCliente;
      }
      // Último recurso: parte antes del @ del email
      if (!nombreCliente) {
        nombreCliente = (currentUser.email || 'Cliente').split('@')[0];
      }

      const precio = ubicacion === 'sede'
        ? servicioSeleccionado.precio_sede
        : servicioSeleccionado.precio_domicilio;

      const modeloIdValido = perfil.id && String(perfil.id).includes('-') ? perfil.id : null;
      
      const rawClienteId = clienteData?.user_id || clienteData?.id || actualId;
      const clienteIdValido = rawClienteId && String(rawClienteId).includes('-') ? rawClienteId : null;

      // ✅ Bug 2 Fix: fecha y hora se guardan como strings directos del input (sin conversión)
      const insertData = {
          cliente_id: clienteIdValido,
          cliente_nombre: nombreCliente,
          cliente_email: clienteData?.email || currentUser.email || 'cliente@app.com',
          cliente_telefono: clienteData?.telefono || (currentUser as any).telefono || 'No registrado',
          modelo_id: modeloIdValido,
          modelo_email: perfil.email,
          modelo_nombre: perfil.nombre_display,
          servicio: servicioSeleccionado.nombre,
          tipo_servicio: servicioSeleccionado.nombre,
          duracion: servicioSeleccionado.duracion_minutos || 60,
          duracion_minutos: servicioSeleccionado.duracion_minutos || 60,
          precio: precio,
          monto_pago: precio,
          ubicacion: ubicacion,
          direccion: ubicacion === 'domicilio' ? direccion : null,
          fecha: fecha,       // ✅ string '2026-04-28' directo del input
          hora: hora,         // ✅ string '17:00' directo del select
          notas: notas || null,
          estado: 'pendiente',
          creado_por: currentUser.email || clienteData?.email || 'cliente@app.com',
          creado_por_rol: 'cliente',
      };

      console.log('INSERT DATA (PerfilModeloPublico):', insertData);

      const { data: agendamiento, error } = await supabase
        .from('agendamientos')
        .insert(insertData)
        .select()
        .single();

      // ✅ Validar que el nombre sea real antes de guardar
      if (!nombreCliente || nombreCliente.length < 2) {
        toast.error('No se pudo obtener tu nombre. Actualiza tu perfil.');
        setEnviando(false);
        return;
      }

      if (error) throw error;

      await notificarNuevaReserva(agendamiento, nombreCliente, clienteData?.telefono || '');

      toast.success('✅ Reserva enviada. Te notificaremos cuando sea aprobada.');
      setServicioSeleccionado(null);
      setFecha('');
      setHora('');
      setNotas('');
      setDireccion('');
    } catch (err: any) {
      toast.error(err?.message || 'Error al hacer la reserva');
    }
    setEnviando(false);
  };

  // ✅ FIX TIMEZONE: usar fecha local (Colombia UTC-5), no toISOString() que es UTC
  const hoyStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95">
        <div className="text-center">
          <p className="text-white">No se encontró el perfil</p>
          <button onClick={onClose} className="mt-4 text-amber-500 underline text-sm">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#080810]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header con foto carousel */}
      <div className="relative h-[65vh] min-h-[420px] overflow-hidden">
        {/* Carousel de fotos */}
        <div className="absolute inset-0">
          {fotos.map((foto, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === fotoActual ? 'opacity-100' : 'opacity-0'}`}
            >
              <img
                src={foto}
                alt={`${perfil.nombre_display} - foto ${idx + 1}`}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre_display || 'M')}&background=1a1a1a&color=d4af37&size=600`;
                }}
              />
            </div>
          ))}
          {/* Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-black/30 to-transparent" />
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md rounded-full p-2.5 text-white hover:bg-black/80 transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Controles carousel */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setFotoActual(prev => (prev - 1 + fotos.length) % fotos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFotoActual(prev => (prev + 1) % fotos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {fotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFotoActual(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === fotoActual ? 'bg-amber-400 w-5' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Info sobre la foto */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
                {perfil.nombre_display}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(perfil.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`} />
                  ))}
                  <span className="text-amber-400 text-sm font-semibold ml-1">{Number(perfil.rating || 5).toFixed(1)}</span>
                </div>
                {/* Sede */}
                {perfil.sede && (
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white text-xs">{perfil.sede}</span>
                  </div>
                )}
                {/* Edad */}
                {perfil.edad && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-xs">{perfil.edad} años</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-amber-500 text-black rounded-full w-12 h-12 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {/* Sobre mí */}
        {(perfil.descripcion || perfil.estatura || perfil.medidas || perfil.idiomas) && (
          <div className="mt-6 bg-white/[0.04] rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" /> Sobre mí
            </h2>
            {perfil.descripcion && (
              <p className="text-white/70 text-sm leading-relaxed mb-4">{perfil.descripcion}</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {perfil.estatura && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Ruler className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-white/50 text-xs">Estatura</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{perfil.estatura}</p>
                </div>
              )}
              {perfil.medidas && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Heart className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-white/50 text-xs">Medidas</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{perfil.medidas}</p>
                </div>
              )}
              {perfil.idiomas && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Languages className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-white/50 text-xs">Idiomas</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{perfil.idiomas}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Servicios */}
        <div className="mt-6">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" /> Servicios disponibles
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setTabServicio('sede')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tabServicio === 'sede'
                  ? 'bg-amber-500 text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" /> En Sede
            </button>
            <button
              onClick={() => setTabServicio('domicilio')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tabServicio === 'domicilio'
                  ? 'bg-amber-500 text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" /> A Domicilio
            </button>
          </div>

          {/* Grid de servicios */}
          {servicios.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/40 text-sm">No hay servicios disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {servicios.map((s) => {
                const precio = tabServicio === 'sede' ? s.precio_sede : s.precio_domicilio;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServicioSeleccionado(s);
                      setUbicacion(tabServicio);
                    }}
                    className="group relative bg-white/[0.04] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 text-left transition-all duration-200 active:scale-95"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{s.duracion_minutos} min</span>
                    </div>
                    <p className="text-white font-bold text-base leading-tight mb-3">{s.nombre}</p>
                    <p className="text-amber-400 font-bold text-lg">{formatPrecio(precio)}</p>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-amber-500 rounded-full p-1">
                        <Calendar className="w-3 h-3 text-black" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de reserva */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d0d1a] border border-amber-500/20 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Reservando con</p>
                <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {perfil.nombre_display}
                </h3>
              </div>
              <button onClick={() => setServicioSeleccionado(null)} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Servicio seleccionado */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-amber-400 font-bold">{servicioSeleccionado.nombre}</p>
                  <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                    <Timer className="w-3 h-3" /> {servicioSeleccionado.duracion_minutos} minutos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold text-lg">
                    {formatPrecio(ubicacion === 'sede' ? servicioSeleccionado.precio_sede : servicioSeleccionado.precio_domicilio)}
                  </p>
                  <p className="text-white/40 text-xs">{ubicacion === 'sede' ? 'En sede' : 'A domicilio'}</p>
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Tipo de servicio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUbicacion('sede')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      ubicacion === 'sede' ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Building className="w-4 h-4" /> En Sede
                  </button>
                  <button
                    onClick={() => setUbicacion('domicilio')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      ubicacion === 'domicilio' ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Domicilio
                  </button>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Fecha</label>
                <input
                  type="date"
                  min={hoyStr}
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Hora */}
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Hora preferida</label>
                <select
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Selecciona una hora --</option>
                  {HORAS_DISPONIBLES.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Dirección si domicilio */}
              {ubicacion === 'domicilio' && (
                <div>
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Dirección</label>
                  <input
                    type="text"
                    placeholder="Ej: Calle 123 #45-67, Bogotá"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Notas adicionales <span className="normal-case text-white/30 font-normal">(opcional)</span></label>
                <textarea
                  placeholder="¿Alguna petición especial?"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-amber-500/50 transition-colors resize-none"
                />
              </div>

              {/* ✅ Resumen visual antes de confirmar */}
              {fecha && hora && (
                <div style={{
                  background: 'rgba(255,215,0,0.06)',
                  border: '1px solid rgba(255,215,0,0.25)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Resumen de tu reserva</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Modelo</span>
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{perfil.nombre_display}</p>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Servicio</span>
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{servicioSeleccionado.nombre}</p>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Fecha</span>
                      <p style={{ color: '#FFD700', fontWeight: 700, margin: 0 }}>
                        {(() => {
                          const [y, m, d] = fecha.split('-');
                          return new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long' });
                        })()}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Hora</span>
                      <p style={{ color: '#FFD700', fontWeight: 700, margin: 0 }}>
                        {(() => {
                          const [h, min] = hora.split(':');
                          const n = parseInt(h);
                          return (n % 12 || 12) + ':' + min + ' ' + (n >= 12 ? 'PM' : 'AM');
                        })()}
                      </p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Precio</span>
                      <p style={{ color: '#4CAF50', fontWeight: 700, margin: 0 }}>
                        {formatPrecio(ubicacion === 'sede' ? servicioSeleccionado.precio_sede : servicioSeleccionado.precio_domicilio)}
                        {' '}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({ubicacion === 'sede' ? 'En sede' : 'A domicilio'})</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={hacerReserva}
                disabled={enviando || !fecha || !hora}
                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  enviando || !fecha || !hora
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-400 text-black hover:from-amber-500 hover:to-amber-300 active:scale-95'
                }`}
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Reserva
                  </>
                )}
              </button>

              {!currentUser && (
                <p className="text-center text-white/40 text-xs">
                  Al confirmar, se te pedirá iniciar sesión
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
