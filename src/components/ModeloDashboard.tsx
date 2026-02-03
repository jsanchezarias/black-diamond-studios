import { useState, useRef, useCallback } from 'react';
import { useModelos } from '../src/app/components/ModelosContext';
import { useTurnos } from '../src/app/components/TurnosContext';
import { useCarrito } from '../src/app/components/CarritoContext';
import { usePagos } from '../src/app/components/PagosContext';
import { useServicios } from '../src/app/components/ServiciosContext';
import { useMultas } from '../src/app/components/MultasContext';
import { CalendarioPanel } from './CalendarioPanel';
import { AdelantosPanel } from './AdelantosPanel';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2,
  XCircle,
  RotateCcw,
  X,
  BarChart3,
  Calendar,
  ShoppingBag,
  PlayCircle,
  StopCircle,
  Timer,
  ShoppingCart,
  Sparkles,
  Info,
  UserCheck,
  Camera,
  Video,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { IniciarServicioModal } from './IniciarServicioModal';
import { FinalizarServicioModal } from './FinalizarServicioModal';
import { TomarMasTiempoModal } from './TomarMasTiempoModal';
import { AgregarAdicionalModal } from './AgregarAdicionalModal';
import { HabitacionesPanel } from './HabitacionesPanel';
import { useInventory } from '../src/app/components/InventoryContext';
import { CarritoModal } from './CarritoModal';
import { CheckoutModal } from './CheckoutModal';
import { AsistenciaPanel } from './AsistenciaPanel';
import { useAsistencia } from '../src/app/components/AsistenciaContext';

interface ModeloDashboardProps {
  userEmail?: string;
}

export function ModeloDashboard({ userEmail = 'demo@modelo.com' }: ModeloDashboardProps) {
  const { inventario } = useInventory();
  const { obtenerServicioActivo, serviciosFinalizados, serviciosActivos } = useServicios();
  const { modelos } = useModelos();
  const { carrito, agregarAlCarrito, vaciarCarrito } = useCarrito();
  const { iniciarTurno, finalizarTurno, cambiarEstado, obtenerTurnoActual, obtenerEstadisticasTurnos } = useTurnos();
  const { registrarLlegada, registrarSalida } = useAsistencia();
  const { obtenerAdelantosModelo, solicitarAdelanto, obtenerFechaUltimoPago, obtenerTotalAdelantosAprobados } = usePagos();
  const { obtenerMultasPorEmail } = useMultas();
  
  // Frases motivacionales que cambian cada día
  const frasesMotivacionales = [
    "Hoy es un gran día para brillar con tu mejor energía ✨",
    "Tu sonrisa es tu mejor accesorio, úsala con confianza 💫",
    "Eres única, poderosa y capaz de lograr todo lo que te propongas 🌟",
    "Cada día es una nueva oportunidad para ser la mejor versión de ti misma 🌸",
    "Tu actitud positiva ilumina cada espacio donde estás 💖",
    "Confía en ti misma, tienes todo lo que necesitas para triunfar 🦋",
    "Hoy será un día increíble, lo siento en mi corazón 🌺",
    "Tu belleza interior es tu verdadero poder, deja que brille 🌙",
    "Eres arte en movimiento, nunca lo olvides 🎨",
    "El éxito comienza con creer en ti misma 💪",
    "Hoy vas a conquistar el mundo con tu encanto 👑",
    "Tu energía positiva es contagiosa, compártela 🌈",
    "Eres más fuerte de lo que crees y más capaz de lo que imaginas 🔥",
    "Cada sonrisa tuya hace del mundo un lugar mejor ☀️",
    "Hoy es tu día para brillar más que nunca 💎",
    "Tu presencia es un regalo, compártela con alegría 🎁",
    "Eres extraordinaria tal como eres 🌟",
    "Tu confianza es tu superpoder, úsala sabiamente 🦸‍♀️",
    "Hoy vas a crear momentos mágicos 🪄",
    "Eres inspiración pura, sigue siendo auténtica 🌻",
  ];

  // Obtener frase del día basada en la fecha
  const obtenerFraseDelDia = () => {
    const hoy = new Date();
    const diaDelAnio = Math.floor((hoy.getTime() - new Date(hoy.getFullYear(), 0, 0).getTime()) / 86400000);
    return frasesMotivacionales[diaDelAnio % frasesMotivacionales.length];
  };

  const [activationStatus, setActivationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mostrarIniciarServicio, setMostrarIniciarServicio] = useState(false);
  const [mostrarFinalizarServicio, setMostrarFinalizarServicio] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [mostrarTomarMasTiempo, setMostrarTomarMasTiempo] = useState(false);
  const [mostrarAgregarAdicional, setMostrarAgregarAdicional] = useState(false);
  const [moduloActivo, setModuloActivo] = useState<'estadisticas' | 'calendario' | 'adelantos' | 'boutique'>('estadisticas');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Configuración de módulos para el menú desplegable
  const modulos = [
    {
      id: 'estadisticas' as const,
      nombre: 'Estadísticas',
      icono: <BarChart3 className="w-5 h-5" />,
      descripcion: 'Mis servicios e ingresos'
    },
    {
      id: 'calendario' as const,
      nombre: 'Calendario',
      icono: <Calendar className="w-5 h-5" />,
      descripcion: 'Agendamientos y citas'
    },
    {
      id: 'adelantos' as const,
      nombre: 'Adelantos',
      icono: <CreditCard className="w-5 h-5" />,
      descripcion: 'Solicitar adelantos de pago'
    },
    {
      id: 'boutique' as const,
      nombre: 'Boutique',
      icono: <ShoppingBag className="w-5 h-5" />,
      descripcion: 'Productos y ventas'
    }
  ];

  const moduloSeleccionado = modulos.find(m => m.id === moduloActivo);

  // Obtener el modelo actual
  const modeloActual = modelos.find(m => m.email === userEmail);
  const servicioActivo = obtenerServicioActivo(userEmail);
  const turnoActivo = obtenerTurnoActual(userEmail);

  // Sobrescribir funciones para registrar asistencia
  const handleIniciarTurno = () => {
    iniciarTurno(userEmail);
    registrarLlegada(userEmail, modeloActual?.nombre || userEmail);
  };

  const handleFinalizarTurno = () => {
    finalizarTurno(userEmail);
    registrarSalida(userEmail);
  };

  const formatTiempoRestante = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const startCamera = async () => {
    setCameraError(null);
    
    // Verificar si la API está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no soporta el acceso a la cámara. Por favor usa un navegador moderno como Chrome, Firefox o Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Cámara frontal
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error: any) {
      // Log informativo en lugar de error crítico
      console.info('Acceso a cámara:', error.name, error.message);
      
      // Mensajes de error específicos y amigables
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('⚠️ Permiso Denegado\n\nPara usar la cámara debes permitir el acceso:\n\n1. Haz clic en el icono 🔒 o 📷 en la barra de direcciones\n2. Selecciona "Permitir" para la cámara\n3. Recarga la página si es necesario\n4. Haz clic en "Reintentar" abajo\n\n💡 Consejo: Si no ves la opción, revisa la configuración de tu navegador en Privacidad > Permisos > Cámara');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('❌ No se encontró ninguna cámara\n\nVerifica que:\n• Tu dispositivo tenga una cámara conectada\n• Los drivers estén instalados correctamente\n• La cámara no esté deshabilitada en el sistema\n\nSi estás en una computadora de escritorio, conecta una webcam USB.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('⚠️ Cámara en uso\n\nLa cámara está siendo utilizada por otra aplicación.\n\nCierra otras aplicaciones que puedan estar usando la cámara:\n• Zoom, Google Meet, Skype\n• Otras pestañas del navegador\n• Aplicaciones de grabación\n\nLuego intenta nuevamente.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        setCameraError('⚠️ Cámara incompatible\n\nTu cámara no cumple con los requisitos técnicos.\n\nIntenta:\n• Usar una cámara diferente\n• Actualizar los drivers de la cámara\n• Usar otro navegador\n\nSi el problema persiste, contacta al administrador.');
      } else if (error.name === 'TypeError') {
        setCameraError('⚠️ Error de conexión\n\nHubo un problema al acceder a la cámara.\n\nIntenta:\n• Recargar la página\n• Usar HTTPS (conexión segura)\n• Usar otro navegador\n\nLa cámara solo funciona en sitios seguros (HTTPS).');
      } else if (error.name === 'SecurityError') {
        setCameraError('🔒 Error de seguridad\n\nEl navegador bloqueó el acceso a la cámara por razones de seguridad.\n\nEsto puede ocurrir si:\n• El sitio no usa HTTPS\n• Hay restricciones de seguridad del navegador\n• El sitio está bloqueado en la configuración\n\nContacta al administrador si el problema persiste.');
      } else {
        setCameraError(`⚠️ Error desconocido\n\nNo se pudo acceder a la cámara: ${error.message || error.name}\n\nIntenta:\n• Recargar la página\n• Usar otro navegador\n• Reiniciar tu dispositivo\n\nSi el problema continúa, contacta al soporte técnico.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  const handleActivation = () => {
    if (capturedImage) {
      setActivationStatus('pending');
      // Simulate admin approval
      setTimeout(() => {
        const aprobado = Math.random() > 0.3;
        setActivationStatus(aprobado ? 'approved' : 'rejected');
        
        // Si es aprobado y no hay turno activo, iniciar turno automáticamente
        if (aprobado && !turnoActivo) {
          handleIniciarTurno();
        }
      }, 2000);
    }
  };

  const resetActivation = () => {
    setActivationStatus(null);
    setCapturedImage(null);
    setCameraError(null);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Obtener servicios filtrados por modelo
  const serviciosActivosModelo = serviciosActivos.filter(s => s.modeloEmail === userEmail);
  
  // Obtener servicios de hoy
  const serviciosHoyModelo = serviciosFinalizados.filter(s => {
    const esHoy = s.horaFin && new Date(s.horaFin).toDateString() === new Date().toDateString();
    const esDeModelo = s.modeloEmail === userEmail;
    return esHoy && esDeModelo;
  });
  
  const serviciosFinalizadosModelo = serviciosFinalizados.filter(s => s.modeloEmail === userEmail);
  
  // Calcular ingresos
  const ingresosHoy = serviciosHoyModelo.reduce((sum, s) => sum + (s.totalPagado || 0), 0);
  const ingresosMes = serviciosFinalizadosModelo.reduce((sum, s) => sum + (s.totalPagado || 0), 0);

  // Calcular estadísticas reales desde servicios
  const stats = {
    serviciosHoy: serviciosHoyModelo?.length || 0,
    serviciosSemana: serviciosFinalizadosModelo?.filter(s => {
      const fecha = s.horaFin ? new Date(s.horaFin) : null;
      if (!fecha) return false;
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      return fecha >= hace7Dias;
    }).length || 0,
    serviciosMes: serviciosFinalizadosModelo?.filter(s => {
      const fecha = s.horaFin ? new Date(s.horaFin) : null;
      if (!fecha) return false;
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      return fecha >= hace30Dias;
    }).length || 0,
    serviciosTotal: serviciosFinalizadosModelo?.length || 0,
    ingresosHoy: ingresosHoy || 0,
    ingresosSemana: serviciosFinalizadosModelo?.filter(s => {
      const fecha = s.horaFin ? new Date(s.horaFin) : null;
      if (!fecha) return false;
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      return fecha >= hace7Dias;
    }).reduce((sum, s) => sum + (s.totalPagado || 0), 0) || 0,
    ingresosMes: ingresosMes || 0,
    ingresosTotal: serviciosFinalizadosModelo?.reduce((sum, s) => sum + (s.totalPagado || 0), 0) || 0,
  };

  // Calcular ingreso acumulado desde el último pago
  const calcularIngresoAcumulado = () => {
    const fechaUltimoPago = obtenerFechaUltimoPago(userEmail);
    const adelantosDesdeUltimoPago = obtenerTotalAdelantosAprobados(userEmail);
    
    // Obtener multas y filtrar correctamente
    const multasDesdeUltimoPago = obtenerMultasPorEmail(userEmail)
      .filter(m => {
        if (m.estado === 'pendiente') return true;
        if (!fechaUltimoPago) return false;
        // Convertir string fecha a Date para comparación
        const fechaMulta = new Date(m.fecha);
        return fechaMulta > fechaUltimoPago;
      })
      .reduce((total, multa) => total + multa.monto, 0);

    // Filtrar servicios finalizados desde el último pago
    const serviciosDesdeUltimoPago = serviciosFinalizados.filter(s => {
      if (s.modeloEmail !== userEmail) return false;
      if (!fechaUltimoPago) return true;
      return s.horaFin && s.horaFin > fechaUltimoPago;
    });

    // Calcular ingresos brutos de servicios (TOTAL COMPLETO con todos los ítems)
    const ingresosBrutos = serviciosDesdeUltimoPago.reduce((total, servicio) => {
      // Calcular costos de todos los ítems agregados durante el servicio
      const costoTiemposAdicionales = (servicio.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
      const costoAdicionalesExtra = (servicio.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
      const costoConsumosDetallados = (servicio.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
      
      // TOTAL COMPLETO del servicio
      const totalServicio = servicio.costoServicio + 
                           servicio.costoAdicionales + 
                           servicio.costoConsumo + 
                           costoTiemposAdicionales + 
                           costoAdicionalesExtra + 
                           costoConsumosDetallados;
      
      return total + totalServicio;
    }, 0);

    // Calcular porcentaje de la modelo (normalmente 50-60%, usaremos 50% para este ejemplo)
    const porcentajeModelo = 0.5;
    const ingresosPorServicios = ingresosBrutos * porcentajeModelo;

    // Total acumulado = Ingresos por servicios - Adelantos - Multas
    const totalAcumulado = ingresosPorServicios - adelantosDesdeUltimoPago - multasDesdeUltimoPago;

    return {
      totalAcumulado,
      ingresosBrutos,
      ingresosPorServicios,
      adelantos: adelantosDesdeUltimoPago,
      multas: multasDesdeUltimoPago,
      cantidadServicios: serviciosDesdeUltimoPago.length,
      fechaUltimoPago
    };
  };

  const ingresoAcumulado = calcularIngresoAcumulado();

  const appointments = [
    { id: 1, date: '2026-01-07', time: '14:00', client: 'Cliente VIP', status: 'confirmed' },
    { id: 2, date: '2026-01-07', time: '18:00', client: 'Cliente Regular', status: 'confirmed' },
    { id: 3, date: '2026-01-08', time: '16:00', client: 'Cliente Nuevo', status: 'pending' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Sección de Bienvenida */}
      <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card/80 shadow-xl overflow-hidden">
        <div className="relative">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
          
          <CardContent className="relative pt-8 pb-8">
            <div className="flex items-center gap-8">
              {/* Foto de perfil */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-2 border-primary/40 overflow-hidden shadow-2xl ring-4 ring-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/20">
                  {modeloActual?.fotoPerfil ? (
                    <img 
                      src={modeloActual.fotoPerfil} 
                      alt={modeloActual.nombreArtistico || 'Modelo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">
                        {modeloActual?.nombreArtistico?.[0] || modeloActual?.nombre?.[0] || 'M'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Indicador de estado activo */}
                {turnoActivo && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-lg animate-pulse" />
                )}
              </div>

              {/* Texto de bienvenida */}
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">Bienvenida</p>
                  <h1 className="text-[2.7rem] md:text-[3.375rem] font-black text-primary mb-2 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {modeloActual?.nombreArtistico || modeloActual?.nombre || 'Modelo'}
                  </h1>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border-l-4 border-primary shadow-sm">
                  <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground italic leading-relaxed font-medium">
                    {obtenerFraseDelDia()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Panel de Control de Turno */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <UserCheck className="w-5 h-5" />
            Panel de Control de Turno
          </CardTitle>
          <CardDescription>Activación diaria y registro de asistencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activación Diaria */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b border-primary/20 pb-2">
              <Camera className="w-4 h-4" />
              Activación Diaria
            </div>
            
            {activationStatus === null && (
              <div className="space-y-4">
                {cameraError && (
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-2">Error de Cámara</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">
                        {cameraError}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={startCamera} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reintentar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCameraError(null)}>
                          <X className="w-4 h-4 mr-2" />
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!cameraActive && !capturedImage && (
                  <div className="text-center p-6 bg-secondary/50 rounded-lg border-2 border-dashed border-border">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Toma una selfie en tiempo real para activarte hoy
                    </p>
                    <Button onClick={startCamera} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Video className="w-4 h-4 mr-2" />
                      Abrir Cámara
                    </Button>
                  </div>
                )}

                {cameraActive && (
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex gap-3 justify-center">
                        <Button onClick={stopCamera} variant="outline" className="border-white/20 bg-black/50 text-white hover:bg-black/70">
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button onClick={capturePhoto} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Camera className="w-4 h-4 mr-2" />
                          Capturar Foto
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden">
                      <img src={capturedImage} alt="Selfie capturada" className="w-full h-80 object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={retakePhoto} variant="outline" className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Tomar Otra
                      </Button>
                      <Button onClick={handleActivation} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Enviar para Aprobación
                      </Button>
                    </div>
                    {/* ✅ Modo demo eliminado - Sistema en producción */}
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {activationStatus === 'pending' && (
              <div className="text-center p-6 bg-yellow-950/30 rounded-lg border-2 border-yellow-500/50">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="font-medium mb-1">Esperando Aprobación</p>
                <p className="text-sm text-muted-foreground">
                  Un administrador revisará tu selfie pronto
                </p>
              </div>
            )}

            {activationStatus === 'approved' && (
              <div className="text-center p-6 bg-green-950/30 rounded-lg border-2 border-green-500/50">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium text-green-500 mb-1">¡Activación Aprobada!</p>
                <p className="text-sm text-muted-foreground">
                  Ya puedes iniciar tu turno de trabajo
                </p>
              </div>
            )}

            {activationStatus === 'rejected' && (
              <div className="text-center p-6 bg-red-950/30 rounded-lg border-2 border-red-500/50">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="font-medium text-red-500 mb-1">Activación Rechazada</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Intenta tomar una mejor foto o contacta al administrador
                </p>
                <Button onClick={resetActivation} variant="outline" className="border-red-500/50">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Intentar de Nuevo
                </Button>
              </div>
            )}
          </div>

          {/* Mi Asistencia */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b border-primary/20 pb-2">
              <UserCheck className="w-4 h-4" />
              Mi Asistencia
            </div>
            
            <AsistenciaPanel userRole="modelo" userEmail={userEmail} />
          </div>
        </CardContent>
      </Card>

      {/* MÓDULO DESTACADO: INICIAR SERVICIO */}
      {!servicioActivo ? (
        <div className="relative">
          {/* Botón principal MEGA destacado en FUCSIA */}
          <Button 
            onClick={() => setMostrarIniciarServicio(true)}
            size="lg"
            className="w-full h-24 text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-600 hover:via-fuchsia-700 hover:to-purple-700 shadow-2xl shadow-fuchsia-500/60 hover:shadow-fuchsia-500/80 hover:scale-105 transition-all duration-300 group border-2 border-fuchsia-400/50"
          >
            <div className="flex items-center gap-4">
              <PlayCircle className="w-12 h-12 group-hover:animate-pulse" />
              <span>Iniciar Nuevo Servicio</span>
              <DollarSign className="w-12 h-12 group-hover:animate-pulse" />
            </div>
          </Button>
        </div>
      ) : (
        <Card className="border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-500/30 via-fuchsia-500/15 to-background shadow-2xl overflow-hidden relative group hover:shadow-fuchsia-500/30 transition-all duration-300">
          {/* Efectos decorativos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-transparent to-fuchsia-500/20 opacity-50 animate-pulse" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-32 -translate-x-32" />
          
          <CardContent className="relative pt-8 pb-8">
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Banner de servicio activo */}
              <div className="bg-gradient-to-r from-green-950/50 via-green-900/30 to-green-950/50 border-2 border-green-500/50 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                  <Badge className="bg-green-500/80 text-white text-base px-4 py-1">
                    Servicio en Curso
                  </Badge>
                </div>
                
                {/* Cronómetro destacado */}
                <div className="flex items-center justify-center p-8 bg-black/30 rounded-xl border-2 border-fuchsia-500/40 mb-6">
                  <div className="text-center">
                    <Timer className="w-16 h-16 text-fuchsia-400 mx-auto mb-3 animate-pulse" />
                    <p className="text-sm text-muted-foreground mb-2">Tiempo Restante</p>
                    <p className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-fuchsia-400 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent font-mono tracking-wider">
                      {formatTiempoRestante(servicioActivo.tiempoRestante)}
                    </p>
                  </div>
                </div>

                {/* Detalles del servicio en grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-fuchsia-500/20">
                    <span className="text-xs text-muted-foreground block mb-1">Tipo</span>
                    <p className="font-bold text-fuchsia-400">{servicioActivo.tipoServicio}</p>
                  </div>
                  {servicioActivo.habitacion && (
                    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-fuchsia-500/20">
                      <span className="text-xs text-muted-foreground block mb-1">Habitación</span>
                      <p className="font-bold text-fuchsia-400 text-xl">{servicioActivo.habitacion}</p>
                    </div>
                  )}
                  <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-fuchsia-500/20">
                    <span className="text-xs text-muted-foreground block mb-1">Duración</span>
                    <p className="font-bold text-foreground">{servicioActivo.tiempoServicio}</p>
                  </div>
                  <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-fuchsia-500/20">
                    <span className="text-xs text-muted-foreground block mb-1">Total</span>
                    <p className="font-bold text-fuchsia-400 text-xl">
                      ${(() => {
                        const costoTiemposAdicionales = (servicioActivo.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
                        const costoAdicionalesExtra = (servicioActivo.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
                        const costoConsumosDetallados = (servicioActivo.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
                        const total = servicioActivo.costoServicio + 
                                      servicioActivo.costoAdicionales + 
                                      servicioActivo.costoConsumo + 
                                      costoTiemposAdicionales + 
                                      costoAdicionalesExtra + 
                                      costoConsumosDetallados;
                        return total.toLocaleString();
                      })()}
                    </p>
                  </div>
                </div>

                {/* Acciones del servicio */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={() => setMostrarTomarMasTiempo(true)}
                    size="lg"
                    variant="outline"
                    className="border-fuchsia-500/50 bg-fuchsia-500/5 hover:bg-fuchsia-500/15 hover:border-fuchsia-500 text-foreground font-semibold"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Más Tiempo
                  </Button>
                  <Button 
                    onClick={() => setMostrarAgregarAdicional(true)}
                    size="lg"
                    variant="outline"
                    className="border-fuchsia-500/50 bg-fuchsia-500/5 hover:bg-fuchsia-500/15 hover:border-fuchsia-500 text-foreground font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicional
                  </Button>
                  <Button 
                    onClick={() => setMostrarFinalizarServicio(true)}
                    size="lg"
                    className="bg-gradient-to-r from-destructive via-destructive/90 to-destructive text-destructive-foreground hover:from-destructive/90 hover:via-destructive/80 hover:to-destructive/90 shadow-lg font-bold"
                  >
                    <StopCircle className="w-5 h-5 mr-2" />
                    Finalizar
                  </Button>
                </div>
              </div>

              {/* Panel de Habitaciones mini */}
              <div className="bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Estado de Habitaciones
                </h3>
                <HabitacionesPanel />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de Módulo - Visible solo en móvil (menor a md) */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 md:hidden">
        <CardContent className="p-4">
          <div className="relative">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Módulo Activo
            </label>
            <div className="relative">
              <select
                value={moduloActivo}
                onChange={(e) => setModuloActivo(e.target.value as typeof moduloActivo)}
                className="w-full appearance-none px-4 py-3 pr-10 bg-secondary border-2 border-border rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer hover:border-primary/50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {modulos.map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            </div>
            {moduloSeleccionado && (
              <div className="mt-3 flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-primary mt-0.5">
                  {moduloSeleccionado.icono}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {moduloSeleccionado.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {moduloSeleccionado.descripcion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Visible solo en desktop (md y mayor) */}
      <Tabs value={moduloActivo} onValueChange={(value) => setModuloActivo(value as typeof moduloActivo)} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="estadisticas">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="calendario">
            <Calendar className="w-4 h-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="adelantos">
            <CreditCard className="w-4 h-4 mr-2" />
            Adelantos
          </TabsTrigger>
          <TabsTrigger value="boutique">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Boutique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Hoy</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosHoy}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Semana</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosSemana}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Mes</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosMes}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Total Servicios</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosTotal}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Hoy</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${stats.ingresosHoy.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Semana</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${stats.ingresosSemana.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Mes</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${stats.ingresosMes.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Totales</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${stats.ingresosTotal.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Card Destacada - Ingreso Acumulado desde el Último Pago */}
          <Card className="border-primary/50 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Ingreso Acumulado desde Último Pago
                  </CardDescription>
                  <CardTitle className="text-4xl text-primary mt-2">
                    ${Math.max(0, ingresoAcumulado.totalAcumulado).toLocaleString('es-CO')}
                  </CardTitle>
                  {ingresoAcumulado.fechaUltimoPago && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Último pago: {new Date(ingresoAcumulado.fechaUltimoPago).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  {!ingresoAcumulado.fechaUltimoPago && (
                    <p className="text-xs text-muted-foreground mt-2">
                      No hay pagos registrados aún
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Servicios</p>
                  <p className="font-bold text-primary">{ingresoAcumulado.cantidadServicios}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ingresos Brutos</p>
                  <p className="font-bold text-green-400">${ingresoAcumulado.ingresosPorServicios.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Adelantos</p>
                  <p className="font-bold text-yellow-400">-${ingresoAcumulado.adelantos.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Multas</p>
                  <p className="font-bold text-red-400">-${ingresoAcumulado.multas.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Total a Recibir en Próxima Liquidación</p>
                  <p className="font-bold text-primary text-lg">${Math.max(0, ingresoAcumulado.totalAcumulado).toLocaleString('es-CO')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <CalendarioPanel modeloEmail={userEmail} userRole="modelo" />
        </TabsContent>

        <TabsContent value="adelantos" className="space-y-4">
          <AdelantosPanel 
            modeloEmail={userEmail} 
            modeloNombre={modeloActual?.nombre || 'Modelo Demo'} 
          />
        </TabsContent>

        <TabsContent value="boutique" className="space-y-4">
          {/* Banner informativo */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-purple-500/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  servicioActivo ? 'bg-green-500/20' : 'bg-blue-500/20'
                }`}>
                  <ShoppingBag className={`w-5 h-5 ${servicioActivo ? 'text-green-400' : 'text-blue-400'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {servicioActivo ? '🎉 Precio Especial Activo' : 'Boutique - Precio Regular'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {servicioActivo 
                      ? 'Estás en servicio. Los productos se cobran al precio especial de servicio (precio más alto).'
                      : 'Compra productos al precio regular. Cuando inicies un servicio, los precios cambiarán automáticamente.'}
                  </p>
                </div>
                {servicioActivo && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-green-400">EN SERVICIO</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productos Disponibles</CardTitle>
                  <CardDescription>
                    {inventario.filter(item => item.stock > 0).length} productos en stock
                  </CardDescription>
                </div>
                {carrito.length > 0 && (
                  <Badge variant="default" className="text-base px-4 py-2">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {carrito.length} en carrito
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {inventario.filter(item => item.stock > 0).length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
                  <p className="text-muted-foreground">
                    Los productos están temporalmente agotados. Vuelve más tarde.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {inventario.filter(item => item.stock > 0).map((item) => (
                    <div 
                      key={item.id}
                      className="bg-secondary rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group"
                    >
                      {/* Imagen del producto */}
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={item.imagen} 
                          alt={item.nombre}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Badge de categoría sobre la imagen */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-black/60">
                            {item.categoria}
                          </Badge>
                        </div>
                        {/* Badge de stock bajo */}
                        {item.stock <= 5 && (
                          <div className="absolute top-2 left-2">
                            <Badge className="text-xs backdrop-blur-sm bg-yellow-500/90">
                              ¡Últimas {item.stock}!
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-base line-clamp-1">{item.nombre}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {item.descripcion}
                          </p>
                        </div>
                        
                        {/* Precios con comparación visual */}
                        <div className="space-y-2">
                          {servicioActivo ? (
                            <>
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl text-green-400 font-bold">
                                  ${item.precioServicio.toLocaleString('es-CO')}
                                </p>
                                <p className="text-xs text-muted-foreground line-through">
                                  ${item.precioRegular.toLocaleString('es-CO')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-green-400">
                                <Sparkles className="w-3 h-3" />
                                <span className="font-medium">Precio especial en servicio</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl text-primary font-bold">
                                ${item.precioRegular.toLocaleString('es-CO')}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="w-3 h-3" />
                                <span>En servicio: ${item.precioServicio.toLocaleString('es-CO')}</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Botón agregar */}
                        <Button 
                          size="sm" 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                          onClick={() => agregarAlCarrito({
                            productoId: item.id,
                            nombre: item.nombre,
                            precio: servicioActivo ? item.precioServicio : item.precioRegular,
                            imagen: item.imagen,
                            categoria: item.categoria,
                          })}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Agregar al Carrito
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {mostrarIniciarServicio && (
        <IniciarServicioModal
          isOpen={mostrarIniciarServicio}
          onClose={() => setMostrarIniciarServicio(false)}
          modeloEmail={userEmail}
          modeloNombre={modeloActual?.nombre || 'Modelo Demo'}
        />
      )}

      {servicioActivo && (
        <FinalizarServicioModal
          isOpen={mostrarFinalizarServicio}
          onClose={() => setMostrarFinalizarServicio(false)}
          servicio={servicioActivo}
        />
      )}

      {servicioActivo && (
        <>
          <TomarMasTiempoModal
            isOpen={mostrarTomarMasTiempo}
            onClose={() => setMostrarTomarMasTiempo(false)}
            servicioId={servicioActivo.id}
          />

          <AgregarAdicionalModal
            isOpen={mostrarAgregarAdicional}
            onClose={() => setMostrarAgregarAdicional(false)}
            servicioId={servicioActivo.id}
          />
        </>
      )}

      <CarritoModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        onCheckout={() => {
          setMostrarCarrito(false);
          setMostrarCheckout(true);
        }}
      />

      <CheckoutModal
        isOpen={mostrarCheckout}
        onClose={() => setMostrarCheckout(false)}
        modeloEmail={userEmail}
        modeloNombre={modeloActual?.nombre || 'Modelo Demo'}
      />

      {/* Botón flotante del carrito */}
      {carrito.length > 0 && (
        <button
          onClick={() => setMostrarCarrito(true)}
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:bg-primary/90 transition-all hover:scale-110 z-50 group"
          aria-label="Ver carrito"
        >
          <ShoppingCart className="w-6 h-6" />
          <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground min-w-[24px] h-6 flex items-center justify-center rounded-full text-sm font-bold">
            {carrito.length}
          </Badge>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-card border border-primary/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <p className="text-sm font-medium">
              {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}