import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
// Removed ModelCard import
import { ModeloCard } from './ModeloCard';
import { AppointmentModal } from './AppointmentModal';
import { VideoShowcase } from './VideoShowcase';
import { Logo } from './Logo';
import { TestimoniosSection } from './TestimoniosSection';
import { AgregarTestimonioModal } from './AgregarTestimonioModal';
import { ClienteLoginModal } from './ClienteLoginModal';
import { StreamConPaywall } from './StreamConPaywall';
import { TipNotification } from './TipNotification'; // ✅ Agregar TipNotification
import { SolicitudServicioModal } from './SolicitudServicioModal';
import { PerfilModeloPublico } from './PerfilModeloPublico';
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

// Old ModeloCard removed to use the shared ModeloCard

export function LandingPage({ onAccessSystem, currentUser: currentUserProp, onLoginSuccess }: LandingPageProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const [modelos, setModelos] = useState<any[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        console.log('🔍 Cargando modelos...')
        
        const { data, error } = await supabase
          .from('usuarios')
          .select(`
            id,
            nombre_artistico,
            estado,
            descripcion,
            foto_url,
            modelo_fotos!modelo_fotos_modelo_id_fkey (
              id, url, es_principal, orden
            ),
            servicios_modelo!servicios_modelo_modelo_id_fkey (
              id, nombre,
              precio_sede, precio_domicilio,
              activo
            )
          `)
          .eq('role', 'modelo')
          .eq('estado', 'activo')
          .order('nombre_artistico')

        console.log('📊 Modelos:', { 
          total: data?.length, 
          error 
        })

        if (error) {
          console.error('❌ Error RLS:', error)
          setErrorModelos(error.message)
          return
        }

        setModelos(data || [])

      } catch (err: any) {
        console.error('❌ Error:', err)
        setErrorModelos(err.message)
      } finally {
        setCargandoModelos(false)
      }
    }

    cargarModelos()
  }, [])

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [sedeActual, setSedeActual] = useState('sede-1');
  const [loadingStream, setLoadingStream] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [streamFallido, setStreamFallido] = useState(false);

  
  // Estados para sistema de propinas
  const [showTipModal, setShowTipModal] = useState(false);
  const [tips, setTips] = useState<TipData[]>([]);
  const [recentTips, setRecentTips] = useState<Array<{ username: string; amount: number; timestamp: number }>>([]);
  
  // Estado para modal de testimonios
  const [showTestimonioModal, setShowTestimonioModal] = useState(false);
  
  // Estado para login de clientes
  const [showClienteLogin, setShowClienteLogin] = useState(false);
  const [clienteActual, setClienteActual] = useState<any>(null);
  const [tabLoginInicial, setTabLoginInicial] = useState<'login' | 'registro'>('login'); // ✅ PAYWALL: tab inicial del modal de login

  // Estado para registro de clientes
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', telefono: '', email: '', password: '' });
  
  // Estado para Solicitud de Servicio
  const [solicitudData, setSolicitudData] = useState<{model: any, service?: any, location?: 'sede' | 'domicilio', price?: string} | null>(null);
  const [perfilVisibleId, setPerfilVisibleId] = useState<string | null>(null);

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

  // Health-check del stream — máximo 3 intentos, luego muestra fallback elegante
  useEffect(() => {
    const STREAM_URL = 'https://stream.blackdiamondscorts.com/live/stream1/index.m3u8';
    let intentos = 0;
    let activo = true;

    const verificar = async () => {
      if (!activo) return;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        await fetch(STREAM_URL, { signal: ctrl.signal });
        clearTimeout(t);
        // Stream responde — no hacer nada, BDPremiumStream se monta normalmente
      } catch {
        if (!activo) return;
        intentos += 1;
        if (intentos >= 3) {
          setStreamFallido(true);
        } else {
          setTimeout(verificar, 1500);
        }
      }
    };

    verificar();
    return () => { activo = false; };
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
      photo: modelo.fotoPerfil || modelo.photo || (modelo.gallery && modelo.gallery[0]) || '',
      gallery: modelo.gallery && modelo.gallery.length > 0 ? modelo.gallery : [modelo.fotoPerfil].filter(Boolean),
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
      email: modelo.email,
      servicios_modelo: modelo.servicios_modelo || [],
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
  const modelosDisponibles = modelos
    .filter((m: any) => m.activa && !m.enPeriodo && m.disponible)
    .map(convertirModeloParaCard);
  
  const modelosNoDisponibles = modelos
    .filter((m: any) => m.activa && (m.enPeriodo || !m.disponible))
    .map(convertirModeloParaCard);
  
  // ✅ NUEVO: Modelos inactivas - aparecen al final
  const modelosInactivas = modelos
    .filter((m: any) => !m.activa)
    .map(convertirModeloParaCard);
    
  const todosLosModelos = modelos.map(convertirModeloParaCard); // Para el modal


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
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden box-border" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>
      {/* Overlay para menú móvil */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation - Navbar responsivo solicitado */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0d]/96 backdrop-blur-xl border-b border-[#c9a961]/10" style={{ boxShadow: '0 1px 32px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 max-w-7xl mx-auto">

          {/* LOGO */}
          <span className="flex-shrink-0 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>
            <span style={{ color: '#c9a961', fontSize: 18, lineHeight: 1 }}>◆</span>
            <span style={{ color: '#fff', fontWeight: 300, fontSize: '1.1rem' }}>BLACK</span>
            <span style={{ color: '#c9a961', fontWeight: 700, fontSize: '1.1rem' }}>DIAMOND</span>
          </span>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-7 lg:gap-9">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="text-[#777] hover:text-[#c9a961] text-sm tracking-wider uppercase transition-all duration-300 relative group"
                style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.7rem', letterSpacing: '0.14em' }}
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#c9a961] group-hover:w-full transition-all duration-400" />
              </a>
            ))}

            <button
              onClick={() => onAccessSystem('cliente')}
              className="relative px-6 py-2.5 rounded-lg font-bold text-[#0f1014] text-xs tracking-widest uppercase overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #d4b86a 0%, #c9a961 50%, #a07c3a 100%)',
                boxShadow: '0 4px 20px rgba(201,169,97,0.3)',
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: '0.1em',
              }}
            >
              <span className="relative z-10">◆ Iniciar sesión</span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
            <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-[#2a2a2a]">
              <button
                onClick={() => {
                  setMenuAbierto(false)
                  onAccessSystem('cliente')
                }}
                className="w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] active:scale-95 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #d4b86a 0%, #c9a961 60%, #a07c3a 100%)',
                  color: '#0f1014',
                  boxShadow: '0 4px 16px rgba(201,169,97,0.25)',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                ◆ Iniciar sesión
              </button>

              <button
                onClick={() => {
                  setMenuAbierto(false)
                  onAccessSystem('sistema')
                }}
                className="text-[9px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-[0.3em] text-center py-2"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
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
            <StreamConPaywall
              onRegistrarse={(tipo) => {
                // ✅ PAYWALL: abrir modal en tab correcto según si pidió registro o login
                setTabLoginInicial(tipo);
                setShowClienteLogin(true);
              }}
            />
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
            <h2 className="text-4xl md:text-6xl mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1 }}>
              {t.services.title} <span style={{ color: '#c9a961', fontWeight: 700 }}>{t.services.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', letterSpacing: '0.02em' }}>
              {t.services.subtitle}
            </p>
            <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Servicio 1 */}
            <div className="group bd-animate-scale-in bd-delay-0 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <Clock className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.personalMeetings.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.personalMeetings.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.personalMeetings.badge}
              </div>
            </div>

            {/* Servicio 2 */}
            <div className="group bd-animate-scale-in bd-delay-1 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <MapPin className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.homeService.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.homeService.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.homeService.badge}
              </div>
            </div>

            {/* Servicio 3 */}
            <div className="group bd-animate-scale-in bd-delay-2 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <Gem className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.vipSuites.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.vipSuites.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.vipSuites.badge}
              </div>
            </div>

            {/* Servicio 4 */}
            <div className="group bd-animate-scale-in bd-delay-3 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <Heart className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.gfeExperience.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.gfeExperience.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.gfeExperience.badge}
              </div>
            </div>

            {/* Servicio 5 */}
            <div className="group bd-animate-scale-in bd-delay-4 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <Award className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.specialEvents.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.specialEvents.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.specialEvents.badge}
              </div>
            </div>

            {/* Servicio 6 */}
            <div className="group bd-animate-scale-in bd-delay-5 rounded-2xl p-6 flex flex-col gap-4 border border-[#c9a961]/12 bg-[#16181c] hover:border-[#c9a961]/40 hover:-translate-y-1 transition-all duration-400" style={{ boxShadow: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow='0 12px 40px rgba(201,169,97,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                <Sparkles className="w-5 h-5 text-[#c9a961]" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem' }}>{t.services.boutique.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed flex-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.services.boutique.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#c9a961]/70" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span className="w-3 h-px bg-[#c9a961]/50" />
                {t.services.boutique.badge}
              </div>
            </div>
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
            <h2 className="text-4xl md:text-6xl mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1 }}>
              {t.models.title} <span style={{ color: '#c9a961', fontWeight: 700 }}>{t.models.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem' }}>
              {t.models.subtitle}
            </p>
            <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
          </div>

          {/* CARGANDO */}
          {cargandoModelos && (
            <div className="grid grid-cols-1 
                            sm:grid-cols-2 
                            lg:grid-cols-3 
                            gap-4 px-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="
                  rounded-xl bg-[#16181c] 
                  animate-pulse overflow-hidden
                ">
                  <div className="h-[240px] 
                                  bg-[#2a2a2a]"/>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-[#2a2a2a] 
                                    rounded w-3/4"/>
                    <div className="h-4 bg-[#2a2a2a] 
                                    rounded w-1/2"/>
                    <div className="h-10 bg-[#2a2a2a] 
                                    rounded"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}
          {!cargandoModelos && errorModelos && (
            <div className="mx-4 p-6 text-center
                            rounded-xl
                            border border-red-500/30
                            bg-red-500/5">
              <p className="text-red-400 text-sm">
                {errorModelos}
              </p>
            </div>
          )}

          {/* VACÍO */}
          {!cargandoModelos && !errorModelos && 
          modelos.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-[#c9a961] text-xl 
                            font-bold">◆</p>
              <p className="text-[#888] text-sm mt-2">
                Próximamente disponible
              </p>
            </div>
          )}

          {/* MOSAICO */}
          {!cargandoModelos && !errorModelos && 
          modelos.length > 0 && (
            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-4 sm:gap-5
              px-4 sm:px-6
              pb-8
            ">
              {modelos.map(modelo => (
                <ModeloCard 
                  key={modelo.id} 
                  modelo={modelo} 
                  onAgendar={() => setPerfilVisibleId(modelo.id)} 
                />
              ))}
            </div>
          )}

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
              <h2 className="text-4xl md:text-6xl mb-6 bd-animate-fade-up bd-delay-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1 }}>
                {t.about.title} <span style={{ color: '#c9a961', fontWeight: 700 }}>{t.about.titleHighlight}</span>
              </h2>
              <div className="bd-shimmer-line max-w-xs mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl p-6 border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-2">
                <div className="w-10 h-10 flex items-center justify-center mb-4 flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                  <Shield className="w-5 h-5 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)' }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem' }}>{t.about.totalSecurity.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.about.totalSecurity.description}</p>
              </div>
              <div className="rounded-2xl p-6 border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-3">
                <div className="w-10 h-10 flex items-center justify-center mb-4 flex-shrink-0" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: 6 }}>
                  <Award className="w-5 h-5 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)', animationDelay: '0.8s' }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem' }}>{t.about.premiumQuality.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.about.premiumQuality.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#c9a961]/15 bg-[#0d0f12] p-8 bd-animate-scale-in bd-delay-4">
              <h3 className="text-2xl mb-6 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#c9a961' }}>
                {t.about.ourValues}
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center bd-animate-fade-up bd-delay-0">
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6 }}>
                    <Heart className="w-5 h-5 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)' }} />
                  </div>
                  <h4 className="font-semibold mb-1 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t.about.respect.title}</h4>
                  <p className="text-xs text-[#888]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.about.respect.description}</p>
                </div>
                <div className="text-center bd-animate-fade-up bd-delay-2">
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6 }}>
                    <Shield className="w-5 h-5 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)', animationDelay: '1s' }} />
                  </div>
                  <h4 className="font-semibold mb-1 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t.about.confidentiality.title}</h4>
                  <p className="text-xs text-[#888]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.about.confidentiality.description}</p>
                </div>
                <div className="text-center bd-animate-fade-up bd-delay-4">
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6 }}>
                    <Sparkles className="w-5 h-5 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)', animationDelay: '2s' }} />
                  </div>
                  <h4 className="font-semibold mb-1 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t.about.excellence.title}</h4>
                  <p className="text-xs text-[#888]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.about.excellence.description}</p>
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
              <h2 className="text-4xl md:text-6xl mb-4 bd-animate-fade-up bd-delay-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1 }}>
                {t.contact.title} <span style={{ color: '#c9a961', fontWeight: 700 }}>{t.contact.titleHighlight}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem' }}>
                {t.contact.subtitle}
              </p>
              <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-10">
              {/* Telegram */}
              <div className="rounded-2xl p-5 text-center border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-0 hover:border-[#c9a961]/40 hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 32px rgba(201,169,97,0.1)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
                <div className="w-12 h-12 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/25 flex items-center justify-center mx-auto mb-3">
                  <Send className="w-5 h-5" style={{ color: '#229ED9' }} />
                </div>
                <h3 className="font-semibold mb-1 text-white text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>Telegram</h3>
                <p className="text-xs text-[#666] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Respuesta inmediata 24/7</p>
                <a href="https://t.me/BlackDiamondScorts" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#229ED9', fontFamily: "'Montserrat', sans-serif" }}>@BlackDiamondScorts</a>
              </div>

              {/* WhatsApp */}
              <div className="rounded-2xl p-5 text-center border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-1 hover:border-[#c9a961]/40 hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 32px rgba(201,169,97,0.1)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-5 h-5" style={{ color: '#25D366' }} />
                </div>
                <h3 className="font-semibold mb-1 text-white text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>{t.contact.whatsapp}</h3>
                <p className="text-xs text-[#666] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.contact.whatsappDesc}</p>
                <a href="https://wa.me/573017626768" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#25D366', fontFamily: "'Montserrat', sans-serif" }}>+57 301 762 6768</a>
              </div>

              {/* X / Twitter */}
              <div className="rounded-2xl p-5 text-center border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-2 hover:border-[#c9a961]/40 hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 32px rgba(201,169,97,0.1)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <h3 className="font-semibold mb-1 text-white text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>X</h3>
                <p className="text-xs text-[#666] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.contact.twitterDesc}</p>
                <a href="https://x.com/BlackDiamondBog" target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white hover:underline" style={{ fontFamily: "'Montserrat', sans-serif" }}>@BlackDiamondBog</a>
              </div>

              {/* Email */}
              <div className="rounded-2xl p-5 text-center border border-[#c9a961]/15 bg-[#16181c] bd-animate-scale-in bd-delay-3 hover:border-[#c9a961]/40 hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 32px rgba(201,169,97,0.1)')} onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
                <div className="w-12 h-12 rounded-xl bg-[#c9a961]/10 border border-[#c9a961]/25 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-5 h-5 text-[#c9a961]" />
                </div>
                <h3 className="font-semibold mb-1 text-white text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>{t.contact.email}</h3>
                <p className="text-xs text-[#666] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.contact.emailDesc}</p>
                <a href="mailto:blackdiamond.scort@gmail.com" className="text-xs text-[#c9a961] hover:underline break-all" style={{ fontFamily: "'Montserrat', sans-serif" }}>blackdiamond.scort@gmail.com</a>
              </div>
            </div>

            {/* CTA Final */}
            <div className="rounded-2xl border border-[#c9a961]/25 bg-[#0d0f12] p-8 md:p-12 text-center bd-animate-scale-in bd-delay-4" style={{ boxShadow: '0 0 60px rgba(201,169,97,0.05)' }}>
              <div className="w-14 h-14 flex items-center justify-center mx-auto mb-6" style={{ transform: 'rotate(45deg)', background: 'rgba(201,169,97,0.1)', border: '1px solid rgba(201,169,97,0.3)', borderRadius: 10 }}>
                <Gem className="w-7 h-7 text-[#c9a961] bd-animate-float" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <h3 className="text-3xl md:text-4xl mb-4 text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                {t.contact.ctaTitle}
              </h3>
              <p className="text-[#777] mb-8 max-w-2xl mx-auto text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {t.contact.ctaDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button size="lg" className="px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] active:scale-95 transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #d4b86a 0%, #c9a961 60%, #a07c3a 100%)', color: '#0f1014', boxShadow: '0 6px 24px rgba(201,169,97,0.3)', fontFamily: "'Montserrat', sans-serif" }}>
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t.contact.reserveNow}
                </button>
                <button onClick={() => onAccessSystem('sistema')} className="px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border border-[#c9a961]/30 text-[#c9a961]/70 hover:border-[#c9a961]/60 hover:text-[#c9a961] transition-all duration-300"
                  style={{ fontFamily: "'Montserrat', sans-serif", background: 'transparent' }}>
                  {t.contact.systemAccess}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c9a961]/15 bg-[#0a0b0d] relative overflow-hidden">
        <ParticlesBackground density="low" showConnections={false} showNebula={true} mouseRadius={80} className="opacity-20" />
        <div className="container mx-auto px-4 py-14 relative" style={{ zIndex: 1 }}>
          <div className="flex flex-col md:grid md:grid-cols-4 gap-10 mb-10 text-center md:text-left">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <span className="flex items-center gap-2 mb-4 justify-center md:justify-start" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>
                <span style={{ color: '#c9a961', fontSize: 18 }}>◆</span>
                <span style={{ color: '#fff', fontWeight: 300, fontSize: '1.05rem' }}>BLACK</span>
                <span style={{ color: '#c9a961', fontWeight: 700, fontSize: '1.05rem' }}>DIAMOND</span>
              </span>
              <p className="text-sm text-[#555] max-w-md mx-auto md:mx-0" style={{ fontFamily: "'Montserrat', sans-serif", lineHeight: 1.8 }}>
                {t.footer.description}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#c9a961] font-semibold mb-4 text-sm uppercase tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.footer.quickLinks}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => scrollToSection('inicio')} className="text-[#555] hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.nav.home}</button></li>
                <li><button onClick={() => scrollToSection('servicios')} className="text-[#555] hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.nav.services}</button></li>
                <li><button onClick={() => scrollToSection('modelos')} className="text-[#555] hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.nav.models}</button></li>
                <li><button onClick={() => scrollToSection('contacto')} className="text-[#555] hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.nav.contact}</button></li>
              </ul>
            </div>

            {/* Horarios */}
            <div>
              <h4 className="text-[#c9a961] font-semibold mb-4 text-sm uppercase tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.footer.schedule}</h4>
              <ul className="space-y-2 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <li className="text-[#555]">{t.footer.mondayToSunday}</li>
                <li className="text-[#c9a961] font-medium">{t.footer.hours24}</li>
                <li className="text-[#555] mt-3">{t.footer.whatsappAttention}</li>
                <li className="text-[#c9a961] font-medium">{t.footer.immediate}</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#c9a961]/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#444]">
            <p style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <span className="text-[#c9a961]/40 mr-2">◆</span>
              {t.footer.rights}
            </p>
            <div className="flex gap-6">
              <button className="hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.footer.termsOfService}</button>
              <button className="hover:text-[#c9a961] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.footer.privacyPolicy}</button>
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
      {tips.length > 0 && (
        <TipNotificationsContainer
          tips={tips}
          onRemoveTip={handleRemoveTip}
        />
      )}

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
          tabInicial={tabLoginInicial}
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

      {/* Modal de Perfil Público */}
      {perfilVisibleId && (
        <PerfilModeloPublico
          modeloId={perfilVisibleId}
          onClose={() => setPerfilVisibleId(null)}
          currentUser={currentUserProp}
          onLoginRequired={() => {
            setPerfilVisibleId(null);
            setShowClienteLogin(true);
          }}
        />
      )}

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
