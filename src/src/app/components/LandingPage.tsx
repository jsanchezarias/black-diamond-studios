import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card'; // ✅ Agregar Card y CardContent
import { Badge } from './ui/badge'; // ✅ Agregar Badge
import { ModelCard } from './ModelCard';
import { AppointmentModal } from './AppointmentModal';
import { VideoShowcase } from './VideoShowcase';
import { Logo } from './Logo';
import { TestimoniosSection } from './TestimoniosSection';
import { AgregarTestimonioModal } from './AgregarTestimonioModal';
import { ClienteLoginModal } from './ClienteLoginModal';
import { LiveVideoStream } from './LiveVideoStream'; // ✅ Agregar LiveVideoStream
import { TipNotification } from './TipNotification'; // ✅ Agregar TipNotification
import { Gem, Calendar, Clock, MapPin, Shield, Award, Star, ChevronRight, Menu as MenuIcon, X, User as UserIcon, Phone, Mail, MessageSquare, Instagram, Twitter, Facebook, Sparkles, Crown, Globe, Heart, Send, LogOut } from 'lucide-react'; // ✅ Consolidar todos los icons
import { useLanguage } from './LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { sedes } from './sedesData';
import { LiveChat } from './LiveChat';
import { TipModal } from './TipModal';
import { usePublicUsers } from './PublicUsersContext';
import { useModelos } from './ModelosContext';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

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
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {tips.map((tip) => (
        <TipNotification
          key={tip.id}
          username={tip.username}
          amount={tip.amount}
          message={tip.message}
          onClose={() => onRemoveTip(tip.id)}
        />
      ))}
    </div>
  );
}

interface LandingPageProps {
  onAccessSystem: () => void;
}

export function LandingPage({ onAccessSystem }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [sedeActual, setSedeActual] = useState('sede-1'); // Estado para la sede seleccionada
  const [streamUrl, setStreamUrl] = useState(sedes[0].streamUrl); // URL del stream actual
  const [loadingStream, setLoadingStream] = useState(true); // Estado de carga de streams
  
  // Estados para sistema de propinas
  const [showTipModal, setShowTipModal] = useState(false);
  const [tips, setTips] = useState<TipData[]>([]);
  const [recentTips, setRecentTips] = useState<Array<{ username: string; amount: number; timestamp: number }>>([]);
  
  // Estado para modal de testimonios
  const [showTestimonioModal, setShowTestimonioModal] = useState(false);
  
  // Estado para login de clientes
  const [showClienteLogin, setShowClienteLogin] = useState(false);
  const [clienteActual, setClienteActual] = useState<any>(null);
  
  const { currentUser, logout } = usePublicUsers(); // ✅ Agregar logout del contexto

  // ============================================
  // 🆕 SINCRONIZAR clienteActual con currentUser del chat
  // ============================================
  useEffect(() => {
    if (currentUser) {
      // Si hay usuario autenticado en el chat, sincronizar con clienteActual
      setClienteActual({
        id: currentUser.id,
        nombre: currentUser.username,
        telefono: currentUser.telefono
      });
    } else {
      // Si no hay usuario en el chat, limpiar clienteActual
      setClienteActual(null);
    }
  }, [currentUser]);
  
  // Hook para modelos desde Supabase
  const { modelos: modelosSupabase } = useModelos();
  
  // Función para convertir modelo de Supabase al formato de ModelCard
  const convertirModeloParaCard = (modelo: any) => {
    // Buscar el perfil completo en sedesData.ts usando el nombre artístico
    const perfilCompleto = sedes
      .flatMap(sede => sede.models || []) // ✅ Proteger contra models undefined
      .find(m => 
        m && m.name && (modelo.nombreArtistico || modelo.nombre) && // ✅ Validar que existan
        m.name.toLowerCase() === (modelo.nombreArtistico || modelo.nombre).toLowerCase()
      );
    
    return {
      id: modelo.id.toString(),
      name: modelo.nombreArtistico || modelo.nombre,
      age: modelo.edad,
      photo: modelo.fotoPerfil,
      gallery: [modelo.fotoPerfil, ...(modelo.fotosAdicionales || [])],
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
  
  // Debug: Log cuando cambia el idioma
  useEffect(() => {
    console.log('🌐 LandingPage: Idioma actual =', language);
  }, [language]);

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

  // Cargar streams desde backend
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoadingStream(true);
        // Supabase Edge Functions requiere AMBOS headers: apikey Y Authorization
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ae3a00e9/streams`,
          {
            headers: {
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const streams = data.streams || [];
          
          // Filtrar streams válidos y buscar el de la sede actual
          const validStreams = streams.filter((s: any) => s && s.sedeId);
          const currentSedeStream = validStreams.find((s: any) => s.sedeId === sedeActual);
          
          if (currentSedeStream && currentSedeStream.streamUrl) {
            setStreamUrl(currentSedeStream.streamUrl);
          } else {
            // Fallback a URL por defecto de sedes
            const sede = sedes.find(s => s.id === sedeActual);
            if (sede) {
              setStreamUrl(sede.streamUrl);
            }
          }
        } else {
          // En caso de error de respuesta, usar URL por defecto (sin log de error)
          const sede = sedes.find(s => s.id === sedeActual);
          if (sede) {
            setStreamUrl(sede.streamUrl);
          }
        }
      } catch (error) {
        // En caso de error de red, usar URL por defecto (silencioso - ya tenemos fallback)
        const sede = sedes.find(s => s.id === sedeActual);
        if (sede) {
          setStreamUrl(sede.streamUrl);
        }
      } finally {
        setLoadingStream(false);
      }
    };

    loadStreams();
  }, [sedeActual]);

  // Cerrar men�� al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  // Prevenir scroll del body cuando el menú está abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
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

  // Obtener modelos según la sede actual (filtrar por activa y convertir formato)
  const modelosDisponibles = modelosSupabase
    .filter((m: any) => m.activa && m.disponible)
    .map(convertirModeloParaCard);
  
  const modelosNoDisponibles = modelosSupabase
    .filter((m: any) => m.activa && !m.disponible)
    .map(convertirModeloParaCard);
  
  // ✅ NUEVO: Modelos inactivas - aparecen al final
  const modelosInactivas = modelosSupabase
    .filter((m: any) => !m.activa)
    .map(convertirModeloParaCard);
    
  const todosLosModelos = modelosSupabase.map(convertirModeloParaCard); // Para el modal

  // 🔍 DEBUG: Ver estado de modelos
  useEffect(() => {
    console.log('🔍 DEBUG LandingPage - Estado de modelos:');
    console.log(`  Total modelosSupabase: ${modelosSupabase.length}`);
    console.log(`  Total modelosDisponibles: ${modelosDisponibles.length}`);
    console.log(`  Total modelosNoDisponibles: ${modelosNoDisponibles.length}`);
    console.log(`  Total modelosInactivas: ${modelosInactivas.length}`);
    console.log(`  Modelos activas:`, modelosSupabase.filter((m: any) => m.activa).length);
    
    if (modelosSupabase.length > 0) {
      console.log('🔍 DEBUG - URLs de fotos de modelos:');
      modelosSupabase.forEach((m: any) => {
        console.log(`\n👤 ${m.nombreArtistico || m.nombre}:`);
        console.log(`  nombre real: ${m.nombre}`);
        console.log(`  nombreArtistico: ${m.nombreArtistico}`);
        console.log(`  activa: ${m.activa}`);
        console.log(`  fotoPerfil: ${m.fotoPerfil}`);
        console.log(`  fotosAdicionales:`, m.fotosAdicionales);
      });
    } else {
      console.log('⚠️ No hay modelos en modelosSupabase');
    }
  }, [modelosSupabase]);

  const handleContactModel = () => {
    scrollToSection('contacto');
  };

  // Handler para abrir modal de propinas
  const handleTipClick = () => {
    if (!currentUser) {
      alert('Por favor inicia sesión para enviar propinas');
      return;
    }
    setShowTipModal(true);
  };

  // Handler para enviar propina
  const handleSendTip = async (amount: number, message: string, paymentMethod: 'payu' | 'pse') => {
    if (!currentUser) return;

    try {
      console.log('💰 Procesando propina:', { amount, message, paymentMethod, user: currentUser.username });

      // 🆕 INTEGRACIÓN CON PAYU/PSE
      // Crear referencia de pago única
      const referenciaPago = `TIP-${currentUser.id}-${Date.now()}`;
      
      // Preparar datos de la transacción
      const transaccionData = {
        cliente_id: currentUser.id,
        monto: amount,
        metodo_pago: paymentMethod,
        referencia: referenciaPago,
        mensaje: message,
        tipo: 'propina',
        estado: 'pendiente',
        created_at: new Date().toISOString()
      };

      // TODO: Implementar integración real con PayU/PSE
      // Por ahora simulamos el pago exitoso
      console.log('📝 Guardando transacción en Supabase:', transaccionData);

      // Mostrar notificación temporal (hasta que se implemente el pago real)
      alert(`🎉 Propina de $${amount.toLocaleString('es-CO')} procesada con ${paymentMethod.toUpperCase()}!\n\n⚠️ NOTA: La integración con PayU/PSE requiere configuración en el servidor.\n\nEsta es una versión de prueba. En producción, el sistema redirigirá a la pasarela de pago.`);

      const newTip: TipData = {
        id: Date.now().toString(),
        username: currentUser.username,
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
          username: currentUser.username,
          amount,
          timestamp: Date.now(),
        },
      ]);

      console.log('✅ Propina registrada exitosamente');
    } catch (error) {
      console.error('❌ Error procesando propina:', error);
      alert('Error al procesar la propina. Por favor intenta de nuevo.');
    }
  };

  // Handler para eliminar notificación de propina
  const handleRemoveTip = (id: string) => {
    setTips(tips.filter(tip => tip.id !== id));
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Overlay para menú móvil */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-dark/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Logo variant="horizontal" size="md" className="cursor-pointer hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('inicio')} className="text-sm hover:text-primary transition-colors font-medium">
                {t.nav.home}
              </button>
              <button onClick={() => scrollToSection('servicios')} className="text-sm hover:text-primary transition-colors font-medium">
                {t.nav.services}
              </button>
              <button onClick={() => scrollToSection('modelos')} className="text-sm hover:text-primary transition-colors font-medium">
                {t.nav.models}
              </button>
              <button onClick={() => scrollToSection('sobre-nosotros')} className="text-sm hover:text-primary transition-colors font-medium">
                {t.nav.about}
              </button>
              <button onClick={() => scrollToSection('contacto')} className="text-sm hover:text-primary transition-colors font-medium">
                {t.nav.contact}
              </button>
              <LanguageSelector />
              {clienteActual ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/30">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{clienteActual.nombre.split(' ')[0]}</span>
                  </div>
                  {/* ✅ Botón de Logout */}
                  <Button 
                    onClick={() => {
                      logout();
                      setClienteActual(null);
                    }}
                    variant="ghost" 
                    size="sm"
                    className="text-red-400 hover:text-red-500 hover:bg-red-950/20 gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </Button>
                  <Button onClick={onAccessSystem} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-background">
                    {t.nav.systemAccess}
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={() => setShowClienteLogin(true)} variant="outline" size="sm" className="border-primary/50 text-foreground hover:border-primary hover:bg-primary/5">
                    <UserIcon className="w-4 h-4 mr-2" />
                    {t.nav.login}
                  </Button>
                  <Button onClick={onAccessSystem} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-background">
                    {t.nav.systemAccess}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu - Logo | Menu Button (centered) | Language */}
            <div className="md:hidden flex items-center justify-between w-full">
              {/* Spacer invisible para balancear */}
              <div className="w-10"></div>
              
              {/* Menu Button - Centrado - Mismo estilo que LanguageSelector */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🍔 Menu button clicked, current state:', menuOpen);
                  setMenuOpen(!menuOpen);
                }}
                className="border-primary/30 hover:bg-primary/10 gap-2"
                aria-label="Toggle menu"
              >
                <div className="w-4 h-4 flex flex-col justify-center gap-[3px]">
                  <span className="block h-[2px] w-full rounded-full" style={{ backgroundColor: '#d4af37' }}></span>
                  <span className="block h-[2px] w-full rounded-full" style={{ backgroundColor: '#d4af37' }}></span>
                  <span className="block h-[2px] w-full rounded-full" style={{ backgroundColor: '#d4af37' }}></span>
                </div>
              </Button>

              {/* Language Selector */}
              <LanguageSelector />
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div 
            className={`md:hidden transition-all duration-300 ease-in-out ${
              menuOpen ? 'max-h-screen opacity-100 visible' : 'max-h-0 opacity-0 invisible'
            }`}
            style={{ 
              overflow: menuOpen ? 'visible' : 'hidden',
              transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out'
            }}
          >
            <div className="mt-4 pb-4 space-y-3 border-t border-primary/20 pt-4"
              style={{ display: menuOpen ? 'block' : 'none' }}
            >
              <button onClick={() => scrollToSection('inicio')} className="block w-full text-left py-3 px-4 hover:text-primary hover:bg-primary/10 rounded transition-colors font-medium text-base">
                {t.nav.home}
              </button>
              <button onClick={() => scrollToSection('servicios')} className="block w-full text-left py-3 px-4 hover:text-primary hover:bg-primary/10 rounded transition-colors font-medium text-base">
                {t.nav.services}
              </button>
              <button onClick={() => scrollToSection('modelos')} className="block w-full text-left py-3 px-4 hover:text-primary hover:bg-primary/10 rounded transition-colors font-medium text-base">
                {t.nav.models}
              </button>
              <button onClick={() => scrollToSection('sobre-nosotros')} className="block w-full text-left py-3 px-4 hover:text-primary hover:bg-primary/10 rounded transition-colors font-medium text-base">
                {t.nav.about}
              </button>
              <button onClick={() => scrollToSection('contacto')} className="block w-full text-left py-3 px-4 hover:text-primary hover:bg-primary/10 rounded transition-colors font-medium text-base">
                {t.nav.contact}
              </button>
              {/* Botones de sesión en móvil */}
              <div className="space-y-2 pt-4 border-t border-primary/20">
                {clienteActual ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{clienteActual.nombre}</span>
                    </div>
                    {/* ✅ Botón de Cerrar Sesión en móvil */}
                    <Button 
                      onClick={() => {
                        logout();
                        setClienteActual(null);
                        setMenuOpen(false);
                      }}
                      variant="ghost" 
                      className="w-full text-red-400 hover:text-red-500 hover:bg-red-950/20 gap-2 justify-center"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </Button>
                    <Button 
                      onClick={() => { onAccessSystem(); setMenuOpen(false); }} 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {t.nav.systemAccess}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => { setShowClienteLogin(true); setMenuOpen(false); }} 
                      variant="outline" 
                      className="w-full border-primary/50 text-foreground hover:border-primary hover:bg-primary/5"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      {t.nav.login}
                    </Button>
                    <Button 
                      onClick={() => { onAccessSystem(); setMenuOpen(false); }} 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {t.nav.systemAccess}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Video Showcase Section - Full Screen Hero */}
      <VideoShowcase />

      {/* Live Stream Hero Section */}
      <section id="inicio" className="pt-16 relative">
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
          {/* Video Stream - Ocupa 70% en desktop, 100% en mobile cuando está arriba */}
          <div className="w-full lg:w-[70%] h-[60vh] lg:h-full relative">
            <LiveVideoStream 
              streamUrl={streamUrl}
              title="Transmisión en Vivo Exclusiva"
              modelName="Black Diamond"
              onTimeExpired={() => setShowAppointmentModal(true)}
              onTipClick={handleTipClick}
            />
          </div>

          {/* Live Chat - Ocupa 30% en desktop, resto en mobile */}
          <div className="w-full lg:w-[30%] h-[40vh] lg:h-full">
            <LiveChat 
              onTipClick={handleTipClick}
              recentTips={recentTips}
              onLoginClick={() => setShowClienteLogin(true)}
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Gem className="w-4 h-4 mr-2 inline" />
              {t.services.badge}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t.services.title} <span className="text-primary">{t.services.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.services.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Servicio 1 */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all group">
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

      {/* Models Section */}
      <section id="modelos" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Star className="w-4 h-4 mr-2 inline" />
              {t.models.badge}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t.models.title} <span className="text-primary">{t.models.titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.models.subtitle}
            </p>
          </div>

          {/* Modelos Disponibles - Grid Vertical */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              💎 {t.models.available} en {sedes.find(s => s.id === sedeActual)?.name}
            </h3>
            
            <div className="grid gap-6 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
              {modelosDisponibles.length > 0 ? (
                modelosDisponibles.map((modelo) => (
                  <ModelCard key={modelo.id} model={modelo} onContact={handleContactModel} />
                ))
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-card to-primary/5 rounded-2xl border border-primary/20">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">
                    No hay modelos disponibles en esta sede en este momento
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Por favor, selecciona otra sede o contáctanos para verificar disponibilidad
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modelos NO Disponibles (Ocupadas) */}
          {modelosNoDisponibles.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ⏰ Otras Modelos - Sede Norte
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Modelos que trabajan en nuestra sede pero no están disponibles en este momento. 
                  <span className="text-primary font-medium"> Contáctanos para conocer su próxima disponibilidad.</span>
                </p>
              </div>
              
              <div className="grid gap-6 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 opacity-75 hover:opacity-100 transition-opacity">
                {modelosNoDisponibles.map((modelo) => (
                  <ModelCard 
                    key={modelo.id} 
                    model={{...modelo, available: false}} 
                    onContact={handleContactModel} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Modelos Inactivas - Otras Modelos de la Sede */}
          {modelosInactivas.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  💫 Otras Modelos de la Sede
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Modelos que hacen parte de nuestro equipo. 
                  <span className="text-primary font-medium"> Contáctanos para consultar su disponibilidad.</span>
                </p>
              </div>
              
              <div className="grid gap-6 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 opacity-60 hover:opacity-90 transition-opacity">
                {modelosInactivas.map((modelo) => (
                  <ModelCard 
                    key={modelo.id} 
                    model={{...modelo, available: false}} 
                    onContact={handleContactModel} 
                  />
                ))}
              </div>
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

      {/* About Section */}
      <section id="sobre-nosotros" className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Gem className="w-4 h-4 mr-2 inline" />
                {t.about.badge}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.about.title} <span className="text-primary">{t.about.titleHighlight}</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t.about.totalSecurity.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {t.about.totalSecurity.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-6">
                  <Award className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t.about.premiumQuality.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {t.about.premiumQuality.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.about.ourValues}
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{t.about.respect.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.about.respect.description}</p>
                </div>
                <div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{t.about.confidentiality.title}</h4>
                  <p className="text-sm text-muted-foreground">{t.about.confidentiality.description}</p>
                </div>
                <div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
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

      {/* Contact Section */}
      <section id="contacto" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Phone className="w-4 h-4 mr-2 inline" />
                {t.contact.badge}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.contact.title} <span className="text-primary">{t.contact.titleHighlight}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {/* Telegram - Azul */}
              <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-600/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
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
              <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-600/10 hover:shadow-lg hover:shadow-green-500/20 transition-all">
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
              <Card className="border-white/20 bg-gradient-to-br from-card to-white/10 hover:shadow-lg hover:shadow-white/20 transition-all">
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
              <Card className="border-red-500/20 bg-gradient-to-br from-card to-red-600/10 hover:shadow-lg hover:shadow-red-500/20 transition-all">
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
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-8 md:p-12 text-center">
                <Gem className="w-16 h-16 text-primary mx-auto mb-6" />
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
                  <Button onClick={onAccessSystem} variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 text-lg px-8">
                    {t.contact.systemAccess}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
        userPhone={currentUser?.telefono}
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
          onLoginSuccess={setClienteActual}
        />
      )}
    </div>
  );
}