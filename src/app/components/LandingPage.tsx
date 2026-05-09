import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
// Removed ModelCard import
import { AppointmentModal } from './AppointmentModal';
import { VideoShowcase } from './VideoShowcase';
import { Logo } from './Logo';
import { TestimoniosSection } from './TestimoniosSection';
import { AgregarTestimonioModal } from './AgregarTestimonioModal';
import { ClienteLoginModal } from './ClienteLoginModal';
import { BDPremiumStream } from './BDPremiumStream';
import { TipNotification } from './TipNotification'; // ✅ Agregar TipNotification
import { SolicitudServicioModal } from './SolicitudServicioModal';
import { ParticlesBackground } from './ParticlesBackground'; // ✅ Fondo de partículas premium
import { GoldenCursor } from './GoldenCursor'; // ✅ Cursor personalizado dorado
import { ScrollUI } from './ScrollUI'; // ✅ Barra de progreso y back-to-top
import { HeroStats } from './HeroStats'; // ✅ Estadísticas de impacto visual
import { Gem, Clock, MapPin, Shield, Award, Star, X, User as UserIcon, Phone, Mail, Sparkles, Heart, Send, LogOut } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { sedes } from './sedesData';
import { LiveChat } from './LiveChat';
import { TipModal } from './TipModal';
import { usePublicUsers } from './PublicUsersContext';
import { useModelos } from './ModelosContext';
import { supabase } from '../../utils/supabase/info';


// ✅ Agregar tipos necesarios
interface TipData {
  id: string;
  username: string;
  amount: number;
  message: string;
  timestamp: number;
}

// ✅ Componente para mostrar notificaciones de propinas
function TipNotificationsContainer({ tips, onRemoveTip }: { tips: TipData[], onRemoveTip: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-[calc(100vw-2rem)] w-auto">
      {tips.map((tip) => (
        <TipNotification
          key={tip.id}
          tip={tip}
          onComplete={() => onRemoveTip(tip.id)}
        />
      ))}
    </div>
  );
}

interface LandingPageProps {
  onAccessSystem: (tipo: 'cliente' | 'sistema') => void;
  currentUser?: { id: string; email: string; nombre?: string; role?: string } | null;
  onLoginSuccess?: (accessToken: string, userId: string, email: string, role: string) => void;
}

const getPrecioBase = (modelo: any) => {
  const precios = modelo.servicios_modelo
    ?.filter((s: any) => s.activo)
    ?.map((s: any) => s.precio || s.precio_sede || 0)
    ?.filter((p: number) => p > 0)

  if (!precios?.length) return null
  return Math.min(...precios)
}

const ModeloCard = ({ modelo, onAccessSystem }: { modelo: any, onAccessSystem: (tipo: 'cliente' | 'sistema') => void }) => {
  const [precios, setPrecios] = useState<any[]>([]);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const fetchPrecios = async () => {
      if (!modelo?.id && !modelo?.email) return;

      let query = supabase
        .from('servicios_modelo')
        .select('nombre, precio_sede, precio_domicilio, duracion')
        .eq('activo', true);

      const filters: string[] = [];
      if (modelo.id) filters.push(`modelo_id.eq.${modelo.id}`);
      if (modelo.email) filters.push(`modelo_email.eq.${modelo.email}`);

      if (filters.length > 0) {
        query = query.or(filters.join(','));
      }

      const { data } = await query.order('precio_sede', { ascending: true });
      setPrecios(data || []);
    };
    fetchPrecios();
  }, [modelo.id, modelo.email]);

  const fotoUrl = modelo.photo
    || modelo.modelo_fotos?.find((f: any) => f.es_principal)?.url
    || modelo.modelo_fotos?.[0]?.url
    || modelo.fotoPerfil
    || modelo.foto_perfil;
  const name = modelo.name || modelo.nombre_artistico || modelo.nombreArtistico || modelo.nombre;

  const precioMin: number | null = precios.length > 0
    ? Math.min(...precios.map(p => Number(p.precio_sede) || 0).filter(v => v > 0))
    : (modelo.precioBase || getPrecioBase(modelo));

  const formatCOP = (val: number) => '$' + val.toLocaleString('es-CO');

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col bg-[#16181c] group"
      style={{
        border: hovered ? '1px solid rgba(201,169,97,0.55)' : '1px solid #2a2a2a',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(201,169,97,0.08)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.165,0.84,0.44,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ── FOTO ── */}
      <div className="relative h-[280px] sm:h-[300px] lg:h-[340px] overflow-hidden flex-shrink-0">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#1e1e22] flex items-center justify-center text-6xl font-bold text-[#c9a961]">
            {name?.[0]}
          </div>
        )}

        {/* Gradiente bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16181c] via-black/30 to-transparent pointer-events-none" />

        {/* Badge precio mínimo flotante */}
        {precioMin && (
          <div className="absolute top-3 right-3 backdrop-blur-md bg-black/60 border border-[#c9a961]/40 rounded-lg px-2.5 py-1.5">
            <span className="text-[9px] text-[#c9a961]/60 uppercase tracking-widest font-semibold block leading-none mb-0.5">Desde</span>
            <span className="text-[#c9a961] font-black text-sm leading-none">{formatCOP(precioMin)}</span>
          </div>
        )}

        {/* Nombre + disponibilidad */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-lg sm:text-xl font-serif drop-shadow-lg truncate">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[9px] text-green-400 font-bold tracking-widest uppercase">Disponible</span>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO INFERIOR ── */}
      <div className="flex flex-col flex-1 p-4">

        {/* ── TABLA DE TARIFAS ── */}
        {precios.length > 0 ? (
          <div className="mb-4">
            <p className="text-[9px] text-[#c9a961]/60 uppercase tracking-[0.2em] font-bold mb-2">◆ Tarifas en Sede</p>
            <div className="rounded-xl overflow-hidden border border-[#c9a961]/10">
              {precios.slice(0, 5).map((s, i) => (
                <div
                  key={s.nombre}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    background: i % 2 === 0 ? 'rgba(201,169,97,0.04)' : 'transparent',
                    borderBottom: i < Math.min(precios.length, 5) - 1 ? '1px solid rgba(201,169,97,0.07)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#c9a961]/35 text-[9px] font-mono w-3 flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-white/85 text-xs font-semibold truncate">{s.nombre}</p>
                      {s.duracion && (
                        <p className="text-white/35 text-[9px] truncate">{s.duracion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right ml-3">
                    <span className="text-[#c9a961] font-black text-sm tabular-nums">
                      {formatCOP(Number(s.precio_sede))}
                    </span>
                    {s.precio_domicilio && (
                      <p className="text-white/30 text-[9px] tabular-nums">
                        Dom: {formatCOP(Number(s.precio_domicilio))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {precios.length > 5 && (
              <p className="text-center text-[9px] text-white/25 mt-1.5">+{precios.length - 5} tarifas más al ingresar</p>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-[#c9a961]/10 px-4 py-3 text-center">
            <p className="text-white/30 text-xs italic">Cargando tarifas...</p>
          </div>
        )}

        {/* ── BOTÓN ── */}
        <button
          onClick={() => onAccessSystem('cliente')}
          className="mt-auto w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] active:scale-95"
          style={{
            background: hovered
              ? 'linear-gradient(135deg, #d4b86a 0%, #c9a961 60%, #a07c3a 100%)'
              : 'linear-gradient(135deg, #c9a961 0%, #a07c3a 100%)',
            color: '#0f1014',
            boxShadow: hovered ? '0 6px 20px rgba(201,169,97,0.35)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          ◆ Ver perfil y agendar
        </button>

      </div>
    </div>
  )
}

export function LandingPage({ onAccessSystem, currentUser: currentUserProp, onLoginSuccess }: LandingPageProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { modelos: modelosContext, loading: modelosLoading } = useModelos();

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [sedeActual, setSedeActual] = useState('sede-1');
  const [loadingStream, setLoadingStream] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  
  // Estados para sistema de propinas
  const [showTipModal, setShowTipModal] = useState(false);
  const [tips, setTips] = useState<TipData[]>([]);
  const [recentTips, setRecentTips] = useState<Array<{ username: string; amount: number; timestamp: number }>>([]);
  
  // Estado para modal de testimonios
  const [showTestimonioModal, setShowTestimonioModal] = useState(false);
  
  // Estado para login de clientes
  const [showClienteLogin, setShowClienteLogin] = useState(false);
  const [clienteActual, setClienteActual] = useState<any>(null);

  // Estado para registro de clientes
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', telefono: '', email: '', password: '' });
  
  // Estado para Solicitud de Servicio
  const [solicitudData, setSolicitudData] = useState<{model: any, service?: any, location?: 'sede' | 'domicilio', price?: string} | null>(null);

  const [streamActivo, setStreamActivo] = useState(false);

  const { currentUser: chatUser, logout, logoutRef, sendMessage } = usePublicUsers(); // ✅ Renombrado para evitar conflicto

  // ============================================
  // 🆕 SINCRONIZAR clienteActual con chatUser del chat
  // ============================================
  useEffect(() => {
    if (chatUser) {
      // Solo actualizar si el ID cambió o no hay clienteActual
      if (!clienteActual || clienteActual.id !== chatUser.id) {
        setClienteActual({
          id: chatUser.id,
          nombre: chatUser.username,
          telefono: chatUser.telefono
        });
      }
    } else {
      // Si no hay usuario en el chat, limpiar clienteActual solo si existe
      if (clienteActual) {
        setClienteActual(null);
      }
    }
  }, [chatUser]); // Eliminar clienteActual de las dependencias

  // Verifica si hay transmisión activa — oculta el hero del stream cuando no hay stream
  useEffect(() => {
    const checkStream = async () => {
      try {
        const { data, error } = await supabase
          .from('stream_configs')
          .select('is_live')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setStreamActivo(data[0].is_live);
        } else {
          setStreamActivo(false);
        }
      } catch {
        setStreamActivo(false);
      }
    };
    checkStream();
    const interval = setInterval(checkStream, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hook para modelos - Eliminado para usar query directa
  
  // Función para convertir modelo de Supabase al formato de ModelCard
  const convertirModeloParaCard = (modelo: any) => {
    // Buscar el perfil completo en sedesData.ts usando el nombre artístico
    // Sede type doesn't have models — lookup skipped, use Supabase data directly
    const perfilCompleto: any = null;
    
    return {
      id: modelo.id.toString(),
      name: modelo.nombre_artistico || modelo.nombreArtistico || modelo.nombre,
      age: modelo.edad,
      photo: modelo.fotoPerfil || (modelo.modelo_fotos?.find((f: any) => f.es_principal)?.url || modelo.modelo_fotos?.[0]?.url),
      gallery: [modelo.fotoPerfil, ...(modelo.fotosAdicionales || [])].filter(Boolean),
      rating: 5.0,
      height: modelo.altura || '165 cm',
      measurements: modelo.medidas || '90-60-90',
      languages: ['Español'],
      location: modelo.sede || 'Sede Norte',
      available: modelo.activa && modelo.disponible, // ✅ Considerar ambos campos
      description: modelo.descripcion || perfilCompleto?.description || 'Modelo profesional',
      services: modelo.serviciosDisponibles && modelo.serviciosDisponibles.length > 0 
        ? modelo.serviciosDisponibles  // ✅ PRIMERO: Usar servicios de Supabase si existen
        : perfilCompleto?.services || [], // ⚠️ FALLBACK: Usar servicios de sedesData si no hay en Supabase
      specialties: perfilCompleto?.specialties || [],
      domicilio: modelo.domicilio !== undefined ? modelo.domicilio : true, // ✅ NUEVO: Tomar del campo domicilio de la BD
    };
  };
  
  // Hook para traducciones
  const { t, language } = useLanguage();
  
  // ✅ NUEVO: Forzar scroll al top al cargar la página
  useEffect(() => {
    // Scroll inmediato al top
    window.scrollTo(0, 0);
    
    // También forzar después de un pequeño delay por si hay render pendiente
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []); // Solo al montar el componente

  // ✅ NUEVO: Detectar scroll para el nav transparente/glassmorphism
  useEffect(() => {
    const handleScrollNav = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScrollNav, { passive: true });
    handleScrollNav(); // init
    return () => window.removeEventListener('scroll', handleScrollNav);
  }, []);


  useEffect(() => {
    const cerrar = () => setMenuAbierto(false)
    window.addEventListener('scroll', cerrar)
    return () => window.removeEventListener(
      'scroll', cerrar
    )
  }, [])

  const links = [
    { href: '#modelos', label: 'Modelos' },
    { href: '#servicios', label: 'Servicios' },
    { href: '#contacto', label: 'Contacto' },
  ]

  // ✨ Intersection Observer — animaciones scroll-reveal
  // Las secciones se "despiertan" al entrar en el viewport
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[id], footer');
    
    // Marca todos los elementos animables como "dormidos" inicialmente
    sections.forEach(section => {
      const animated = section.querySelectorAll<HTMLElement>(
        '.bd-animate-fade-up, .bd-animate-scale-in, .bd-animate-fade-in'
      );
      animated.forEach(el => {
        el.style.animationPlayState = 'paused';
        el.style.opacity = '0';
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const animated = entry.target.querySelectorAll<HTMLElement>(
              '.bd-animate-fade-up, .bd-animate-scale-in, .bd-animate-fade-in'
            );
            animated.forEach(el => {
              el.style.opacity = '';
              el.style.animationPlayState = 'running';
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMenuAbierto(false);
  };

  // Handler para cambio de sede
  const handleSedeChange = (sedeId: string) => {
    setSedeActual(sedeId);
    const sede = sedes.find(s => s.id === sedeId);
    if (sede) {
      setStreamUrl(sede.streamUrl);
    }
    // ❌ REMOVIDO: No hacer scroll automático al cambiar de sede
    // scrollToSection('inicio');
  };

  const normalizarTelefono = (tel: string): string => {
    const soloDigitos = tel.replace(/[^0-9]/g, '');
    return soloDigitos.slice(-10);
  };

  const registrarCliente = async () => {
    if (!regForm.nombre || !regForm.email || !regForm.password || !regForm.telefono) {
      toast.error('Completa todos los campos');
      return;
    }
    if (regForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setRegistrando(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regForm.email,
        password: regForm.password,
        options: {
          data: { nombre: regForm.nombre, telefono: regForm.telefono, role: 'cliente' }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          toast.error('Este email ya está registrado. Inicia sesión con el botón de arriba.');
        } else if (error.message.includes('password')) {
          toast.error('La contraseña debe tener mínimo 6 caracteres.');
        } else if (error.message.includes('valid email') || error.message.includes('invalid email')) {
          toast.error('El formato del email no es válido.');
        } else if (error.message.includes('Database error')) {
          toast.error('Error del servidor. Intenta de nuevo en un momento.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Insertar en usuarios y clientes directamente como respaldo al trigger
        await supabase.from('usuarios').upsert({
          id: data.user.id,
          email: regForm.email,
          nombre: regForm.nombre,
          role: 'cliente',
          estado: 'activo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        await supabase.from('clientes').upsert({
          user_id: data.user.id,
          nombre: regForm.nombre,
          email: regForm.email,
          telefono: regForm.telefono ? normalizarTelefono(regForm.telefono) : null,
          total_servicios: 0,
          total_gastado: 0,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }

      toast.success('¡Cuenta creada! Ingresa con tu email y contraseña.');
      setMostrarRegistro(false);
      setRegForm({ nombre: '', telefono: '', email: '', password: '' });
      // Abrir el sistema de login directamente después del registro
      setTimeout(() => onAccessSystem('cliente'), 800);
    } catch (err: any) {
      toast.error('Error inesperado. Intenta de nuevo.');
    } finally {
      setRegistrando(false);
    }
  };

  // Obtener modelos desde el contexto y aplicar filtros
  const modelosDisponibles = modelosContext
    .filter((m: any) => m.activa && !m.enPeriodo && m.disponible)
    .map(convertirModeloParaCard);
  
  const modelosNoDisponibles = modelosContext
    .filter((m: any) => m.activa && (m.enPeriodo || !m.disponible))
    .map(convertirModeloParaCard);
  
  // ✅ NUEVO: Modelos inactivas - aparecen al final
  const modelosInactivas = modelosContext
    .filter((m: any) => !m.activa)
    .map(convertirModeloParaCard);
    
  const todosLosModelos = modelosContext.map(convertirModeloParaCard); // Para el modal


  const handleContactModel = (model: any, service?: any, location?: 'sede' | 'domicilio', price?: string) => {
    if (!currentUserProp) {
      toast.error('Por favor, inicia sesión para solicitar un servicio.');
      setShowClienteLogin(true);
      return;
    }
    setSolicitudData({ model, service, location, price });
  };



  // Handler para abrir modal de propinas
  const handleTipClick = () => {
    if (!currentUserProp) {
      toast.error('Por favor inicia sesión para enviar propinas');
      return;
    }
    setShowTipModal(true);
  };

  // Handler para enviar propina
  const handleSendTip = async (amount: number, message: string, _paymentMethod: 'payu' | 'pse') => {
    if (!currentUserProp) return;

    try {

      // 🆕 INTEGRACIÓN CON PAYU/PSE
      // Crear referencia de pago única
      const referenciaPago = `TIP-${currentUserProp.id}-${Date.now()}`;
      
      // Preparar datos de la transacción
      /*
      const transaccionData = {
        cliente_id: currentUserProp.id,
        monto: amount,
        metodo_pago: _paymentMethod,
        referencia: referenciaPago,
        mensaje: message,
        tipo: 'propina',
        estado: 'pendiente',
        created_at: new Date().toISOString()
      };
      */

      // TODO: Implementar integración real con PayU/PSE
      // Por ahora simulamos el pago exitoso

      // Mostrar notificación temporal (hasta que se implemente el pago real)
      toast.success(`Propina de $${amount.toLocaleString('es-CO')} recibida. Integración PayU/PSE en configuración.`);

      const newTip: TipData = {
        id: Date.now().toString(),
        username: chatUser?.username || 'Invitado',
        amount,
        message,
        timestamp: Date.now(),
      };

      // Agregar a notificaciones
      setTips([...tips, newTip]);

      // Agregar a propinas recientes
      setRecentTips([
        ...recentTips,
        {
          username: chatUser?.username || 'Invitado',
          amount,
          timestamp: Date.now(),
        },
      ]);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error procesando propina:', error);
      toast.error('Error al procesar la propina. Por favor intenta de nuevo.');
    }
  };

  // Handler para eliminar notificación de propina
  const handleRemoveTip = (id: string) => {
    setTips(tips.filter(tip => tip.id !== id));
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden box-border" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Overlay para menú móvil */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation - Navbar responsivo solicitado */}
      <nav className="
        fixed top-0 left-0 right-0 z-50
        bg-[#0f1014]/95 backdrop-blur-md
        border-b border-[#2a2a2a]
      ">
        <div className="
          flex items-center justify-between
          px-4 sm:px-6 lg:px-8
          py-3 sm:py-4
          max-w-7xl mx-auto
        ">

          {/* LOGO */}
          <span className="
            text-[#c9a961] font-bold
            text-lg sm:text-xl
            font-['Playfair_Display']
            flex-shrink-0
          ">
            ◆ Black Diamond
          </span>

          {/* DESKTOP */}
          <div className="
            hidden md:flex
            items-center gap-6 lg:gap-8
          ">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="
                  text-[#888] hover:text-[#c9a961]
                  text-sm transition-colors
                "
              >
                {l.label}
              </a>
            ))}

            {/* UN SOLO BOTÓN — cliente */}
            <button
              onClick={() => onAccessSystem('cliente')}
              className="
                px-5 py-2.5 rounded-lg
                bg-[#c9a961] text-[#0f1014]
                font-bold text-sm
                hover:bg-[#d4b86a]
                transition-colors
              "
            >
              ◆ Iniciar sesión
            </button>
          </div>

          {/* HAMBURGUESA MÓVIL */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="
              md:hidden
              w-10 h-10 rounded-lg
              flex items-center justify-center
              text-[#c9a961] text-2xl
              hover:bg-[#c9a961]/10
              transition-colors
            "
            aria-label="Menú"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>

        </div>

        {/* MENÚ DESPLEGABLE MÓVIL */}
        {menuAbierto && (
          <div className="
            md:hidden
            bg-[#16181c]
            border-t border-[#2a2a2a]
            px-4 py-4
            flex flex-col gap-1
          ">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuAbierto(false)}
                className="
                  block py-3 px-2
                  text-[#888] text-base
                  border-b border-[#2a2a2a]
                  hover:text-[#c9a961]
                  transition-colors
                "
              >
                {l.label}
              </a>
            ))}

            {/* BOTONES EN MENÚ MÓVIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => {
                  setMenuAbierto(false)
                  onAccessSystem('cliente')
                }}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #B8860B, #FFD700)',
                  border: 'none', borderRadius: 8,
                  color: 'black', fontWeight: 700,
                  cursor: 'pointer', fontSize: 14,
                  width: '100%'
                }}
              >
                👤 Iniciar sesión como Cliente
              </button>

              <button
                onClick={() => {
                  setMenuAbierto(false)
                  onAccessSystem('sistema')
                }}
                className="mt-6 text-[10px] text-white/30 hover:text-white/50 transition-colors uppercase tracking-widest text-center"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Acceso al sistema
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Video Showcase Section - Full Screen Hero */}
      <VideoShowcase />

      {/* Live Stream Hero Section — siempre visible */}
      <section id="inicio" className="pt-20 relative overflow-hidden bg-black">
        <div className="w-full h-[calc(100vh-5rem)] flex flex-col lg:flex-row relative">
          <div className="w-full lg:w-[70%] h-[45vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#c9a961]/10">
            <BDPremiumStream />
          </div>
          <div className="w-full lg:w-[30%] h-[55vh] lg:h-full">
            <LiveChat
              onTipClick={handleTipClick}
              recentTips={recentTips}
              onLoginClick={() => {
                localStorage.setItem('loginRedirect', 'chat');
                setShowClienteLogin(true);
              }}
            />
          </div>
        </div>
      </section>

      {/* ✅ Estadísticas de Alto Impacto (Animadas) */}
      <HeroStats />

      {/* Services Section — partículas sutiles */}
      <section id="servicios" className="py-16 md:py-24 bg-background relative overflow-hidden">
        <ParticlesBackground
          density="low"
          showConnections={false}
          showNebula={true}
          mouseRadius={100}
          className="opacity-40"
        />
        <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 bd-animate-fade-up bd-delay-0">
              <Gem className="w-4 h-4 mr-2 inline" />
              {t.services.badge}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t.services.title} <span className="text-primary">{t.services.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2">
              {t.services.subtitle}
            </p>
            <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Servicio 1 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-0 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.personalMeetings.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.personalMeetings.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Star className="w-4 h-4 fill-primary" />
                  <span>{t.services.personalMeetings.badge}</span>
                </div>
              </CardContent>
            </Card>

            {/* Servicio 2 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-1 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.homeService.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.homeService.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Shield className="w-4 h-4" />
                  <span>{t.services.homeService.badge}</span>
                </div>
              </CardContent>
            </Card>

            {/* Servicio 3 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-2 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gem className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.vipSuites.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.vipSuites.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.services.vipSuites.badge}</span>
                </div>
              </CardContent>
            </Card>

            {/* Servicio 4 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-3 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.gfeExperience.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.gfeExperience.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Star className="w-4 h-4 fill-primary" />
                  <span>{t.services.gfeExperience.badge}</span>
                </div>
              </CardContent>
            </Card>

            {/* Servicio 5 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-4 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.specialEvents.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.specialEvents.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Gem className="w-4 h-4" />
                  <span>{t.services.specialEvents.badge}</span>
                </div>
              </CardContent>
            </Card>

            {/* Servicio 6 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group bd-animate-scale-in bd-delay-5 bd-card-hover">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.services.boutique.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.services.boutique.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Gem className="w-4 h-4" />
                  <span>{t.services.boutique.badge}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Models Section — partículas medias para galería */}
      <section id="modelos" className="py-16 md:py-24 relative overflow-hidden">
        <ParticlesBackground
          density="medium"
          showConnections={true}
          showNebula={false}
          mouseRadius={120}
          className="opacity-35"
        />
        <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 bd-animate-fade-up bd-delay-0">
              <Star className="w-4 h-4 mr-2 inline" />
              {t.models.badge}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t.models.title} <span className="text-primary">{t.models.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2">
              {t.models.subtitle}
            </p>
            <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
          </div>

          {/* Modelos Disponibles - Grid Vertical */}
          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            gap-4 sm:gap-5 lg:gap-6
            px-4 sm:px-6 lg:px-8
            max-w-7xl mx-auto
            pb-24 md:pb-8
          ">
            {modelosLoading ? (
              // SKELETON LOADING
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-[400px] bg-[#1a1c21] animate-pulse rounded-xl border border-white/5" />
              ))
            ) : modelosDisponibles.length > 0 ? (
              modelosDisponibles.map(modelo => (
                <ModeloCard
                  key={modelo.id}
                  modelo={modelo}
                  onAccessSystem={onAccessSystem}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <p className="text-xl">No hay modelos disponibles en este momento.</p>
                <p className="text-sm mt-2">Vuelve a consultarnos pronto.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sede Selector Section - OCULTO TEMPORALMENTE (solo hay una sede activa) */}
      {/* <SedeSelector 
        sedes={sedes}
        sedeActual={sedeActual}
        onSedeChange={handleSedeChange}
      /> */}

      {/* About Section — con nebulosa y partículas refinadas */}
      <section id="sobre-nosotros" className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
        <ParticlesBackground
          density="medium"
          showConnections={true}
          showNebula={true}
          mouseRadius={130}
          className="opacity-55"
        />
        <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 bd-animate-fade-up bd-delay-0">
                <Gem className="w-4 h-4 mr-2 inline" />
                {t.about.badge}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bd-animate-fade-up bd-delay-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.about.title} <span className="text-primary">{t.about.titleHighlight}</span>
              </h2>
              <div className="bd-shimmer-line max-w-xs mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 bd-animate-scale-in bd-delay-2 bd-card-hover">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-primary mb-4 bd-animate-float" />
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t.about.totalSecurity.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {t.about.totalSecurity.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 bd-animate-scale-in bd-delay-3 bd-card-hover">
                <CardContent className="p-6">
                  <Award className="w-12 h-12 text-primary mb-4 bd-animate-float" style={{ animationDelay: '0.8s' }} />
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t.about.premiumQuality.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {t.about.premiumQuality.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 bd-animate-scale-in bd-delay-4 bd-animate-glow">
              <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.about.ourValues}
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bd-animate-fade-up bd-delay-0">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 bd-animate-float">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{t.about.respect.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.about.respect.description}</p>
                </div>
                <div className="bd-animate-fade-up bd-delay-2">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 bd-animate-float" style={{ animationDelay: '1s' }}>
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{t.about.confidentiality.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.about.confidentiality.description}</p>
                </div>
                <div className="bd-animate-fade-up bd-delay-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 bd-animate-float" style={{ animationDelay: '2s' }}>
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{t.about.excellence.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.about.excellence.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios - Experiencias de Nuestros Clientes */}
      <TestimoniosSection onAddTestimonio={() => setShowTestimonioModal(true)} />

      {/* Contact Section — partículas de densidad alta, el gran final */}
      <section id="contacto" className="py-16 md:py-24 relative overflow-hidden">
        <ParticlesBackground
          density="medium"
          showConnections={true}
          showNebula={true}
          mouseRadius={150}
          className="opacity-50"
        />
        <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 bd-animate-fade-up bd-delay-0">
                <Phone className="w-4 h-4 mr-2 inline" />
                {t.contact.badge}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.contact.title} <span className="text-primary">{t.contact.titleHighlight}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2">
                {t.contact.subtitle}
              </p>
              <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {/* Telegram - Azul */}
              <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-600/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all bd-animate-scale-in bd-delay-0 bd-card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="font-bold mb-2">Telegram</h3>
                  <p className="text-sm text-muted-foreground mb-3">Respuesta inmediata 24/7</p>
                  <a href="https://t.me/BlackDiamondScorts" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    @BlackDiamondScorts
                  </a>
                </CardContent>
              </Card>

              {/* WhatsApp - Verde */}
              <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-600/10 hover:shadow-lg hover:shadow-green-500/20 transition-all bd-animate-scale-in bd-delay-1 bd-card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className="font-bold mb-2">{t.contact.whatsapp}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.contact.whatsappDesc}</p>
                  <a href="https://wa.me/573017626768" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                    +57 301 762 6768
                  </a>
                </CardContent>
              </Card>

              {/* X (antes Twitter) - Negro/Blanco */}
              <Card className="border-white/20 bg-gradient-to-br from-card to-white/10 hover:shadow-lg hover:shadow-white/20 transition-all bd-animate-scale-in bd-delay-2 bd-card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold mb-2">X</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.contact.twitterDesc}</p>
                  <a href="https://x.com/BlackDiamondBog" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                    @BlackDiamondBog
                  </a>
                </CardContent>
              </Card>

              {/* Email - Blanco con rojo */}
              <Card className="border-red-500/20 bg-gradient-to-br from-card to-red-600/10 hover:shadow-lg hover:shadow-red-500/20 transition-all bd-animate-scale-in bd-delay-3 bd-card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="font-bold mb-2">{t.contact.email}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.contact.emailDesc}</p>
                  <a 
                    href="mailto:blackdiamond.scort@gmail.com" 
                    className="text-red-400 hover:underline break-words overflow-wrap-anywhere inline-block max-w-full"
                  >
                    blackdiamond.scort@gmail.com
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* CTA Final */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 bd-animate-scale-in bd-delay-4 bd-animate-glow">
              <CardContent className="p-8 md:p-12 text-center">
                <Gem className="w-16 h-16 text-primary mx-auto mb-6 bd-animate-float" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.contact.ctaTitle}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  {t.contact.ctaDescription}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary text-background hover:bg-primary/90 text-lg px-8 gap-2">
                    <Phone className="w-5 h-5" />
                    {t.contact.reserveNow}
                  </Button>
                  <Button onClick={() => onAccessSystem('sistema')} variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 text-lg px-8">
                    {t.contact.systemAccess}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer con partículas sutiles */}
      <footer className="border-t border-primary/20 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
        <ParticlesBackground
          density="low"
          showConnections={false}
          showNebula={true}
          mouseRadius={80}
          className="opacity-30"
        />
        <div className="container mx-auto px-4 py-12 relative" style={{ zIndex: 1 }}>
          <div className="flex flex-col md:grid md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <Logo variant="horizontal" size="md" className="mb-4" />
              <p className="text-sm text-muted-foreground max-w-md">
                {t.footer.description}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">{t.footer.quickLinks}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollToSection('inicio')} className="text-muted-foreground hover:text-primary transition-colors">
                    {t.nav.home}
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('servicios')} className="text-muted-foreground hover:text-primary transition-colors">
                    {t.nav.services}
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('modelos')} className="text-muted-foreground hover:text-primary transition-colors">
                    {t.nav.models}
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contacto')} className="text-muted-foreground hover:text-primary transition-colors">
                    {t.nav.contact}
                  </button>
                </li>
              </ul>
            </div>

            {/* Horarios */}
            <div>
              <h4 className="font-bold mb-4">{t.footer.schedule}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.footer.mondayToSunday}</li>
                <li className="text-primary font-medium">{t.footer.hours24}</li>
                <li className="mt-4">{t.footer.whatsappAttention}</li>
                <li className="text-primary font-medium">{t.footer.immediate}</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-primary/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{t.footer.rights}</p>
            <div className="flex gap-6">
              <button className="hover:text-primary transition-colors">{t.footer.termsOfService}</button>
              <button className="hover:text-primary transition-colors">{t.footer.privacyPolicy}</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamiento */}
      <AppointmentModal 
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        availableModels={todosLosModelos}
      />

      {/* Modal de Propinas */}
      <TipModal 
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onSendTip={handleSendTip}
        modelName="Black Diamond"
        userPhone={chatUser?.telefono || currentUserProp?.telefono}
      />

      {/* Notificaciones de Propinas */}
      <TipNotificationsContainer 
        tips={tips}
        onRemoveTip={handleRemoveTip}
      />

      {/* Modal de Agregar Testimonio */}
      <AgregarTestimonioModal 
        open={showTestimonioModal}
        onClose={() => setShowTestimonioModal(false)}
      />

      {/* Modal de Login de Clientes */}
      {showClienteLogin && (
        <ClienteLoginModal
          isOpen={showClienteLogin}
          onClose={() => setShowClienteLogin(false)}
          onLoginSuccess={(cliente) => {
            setClienteActual(cliente);
            setShowClienteLogin(false);
            toast.success(`¡Bienvenido de nuevo, ${cliente.nombre}!`);
            
            // ✅ SINCRONIZACIÓN GLOBAL: Notificar a App.tsx
            if (onLoginSuccess) {
              // Obtenemos la sesión actual de Supabase para pasar el accessToken
              supabase.auth.getSession().then(({ data: { session } }) => {
                onLoginSuccess(
                  session?.access_token || '', 
                  cliente.user_id || cliente.id, 
                  cliente.email || '', 
                  'cliente'
                );
              });
            }
          }}
        />
      )}

      {/* Modal de Solicitud de Servicio */}
      <SolicitudServicioModal 
        isOpen={!!solicitudData}
        onClose={() => setSolicitudData(null)}
        data={solicitudData}
        currentUser={currentUserProp}
      />

      {/* Modal de Registro de Clientes */}
      {mostrarRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-amber-400">Crear cuenta</h2>
              <button onClick={() => setMostrarRegistro(false)} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Tu nombre' },
                { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+57 300 000 0000' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
                { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-white/60">{label}</label>
                  <input 
                    type={type} 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder={placeholder}
                    value={(regForm as any)[key]}
                    onChange={(e) => setRegForm({ ...regForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={registrarCliente}
                  disabled={registrando}
                  className="flex-1 py-2.5 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-60"
                >
                  {registrando ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                <button
                  onClick={() => setMostrarRegistro(false)}
                  className="px-4 py-2.5 bg-white/10 text-sm rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
            <p className="text-xs text-white/30 text-center mt-3">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => { setMostrarRegistro(false); setShowClienteLogin(true); }}
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      )}



      {/* ✨ Cursor personalizado dorado — solo desktop */}
      <GoldenCursor />

      {/* ✨ Scroll Progress Bar & Back to top */}
      <ScrollUI />

    </div>
  );
}
