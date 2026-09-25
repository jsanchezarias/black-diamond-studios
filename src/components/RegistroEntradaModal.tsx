import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, Camera, CheckCircle, Info, Loader2, RefreshCw, Upload, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAsistencia } from '../app/components/AsistenciaContext';
import { supabase } from '../utils/supabase/info';
import { Alert, AlertDescription } from './ui/alert';

interface RegistroEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

export function RegistroEntradaModal({ isOpen, onClose, modeloEmail, modeloNombre }: RegistroEntradaModalProps) {
  const { crearSolicitudEntrada, obtenerSolicitudPorModelo, jornadas } = useAsistencia();
  const [paso, setPaso] = useState<'seleccion' | 'camara' | 'preview' | 'procesando' | 'exito' | 'error'>('seleccion');
  const [imagenCapturada, setImagenCapturada] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoError, setTipoError] = useState<'permiso' | 'navegador' | 'otro' | null>(null);
  const [reintentarNuevaSelfie, setReintentarNuevaSelfie] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const solicitudHoy = obtenerSolicitudPorModelo(modeloEmail);
  const jornadaActiva = (jornadas || []).find(
    (j) => j.modeloEmail?.toLowerCase() === modeloEmail?.toLowerCase() && j.estado === 'en_curso'
  );

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso('seleccion');
      setImagenCapturada(null);
      setError(null);
      setTipoError(null);
      setReintentarNuevaSelfie(false);
    } else {
      detenerCamara();
    }
  }, [isOpen]);

  // Manejar el stream de la cámara y asegurar reproducción en dispositivos móviles
  useEffect(() => {
    if (paso === 'camara') {
      iniciarCamara();
    } else {
      detenerCamara();
    }
    return () => {
      detenerCamara();
    };
  }, [paso]);

  // Asignar el stream al video cuando ambos estén disponibles
  useEffect(() => {
    if (paso === 'camara' && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((e) => console.info('Autoplay de cámara gestionado:', e?.name || e));
    }
  }, [paso, stream]);

  const iniciarCamara = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Tu navegador no soporta el acceso a la cámara. Por favor, sube una foto desde tu galería o usa Chrome/Safari.');
        setTipoError('navegador');
        return;
      }

      // Detener stream previo si existía
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Cámara frontal
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setError(null);
      setTipoError(null);

      // Timeout de seguridad para vincular ref de video en DOM recién renderizado
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.info('Acceso a cámara no disponible:', err?.name);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Permite el acceso a la cámara o sube una foto desde tu galería.');
        setTipoError('permiso');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se detectó ninguna cámara en tu dispositivo. Puedes subir una foto desde tu galería.');
        setTipoError('otro');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La cámara está siendo usada por otra aplicación. Ciérrala o sube una foto desde tu galería.');
        setTipoError('otro');
      } else {
        setError('No se pudo acceder a la cámara. Asegúrate de otorgar permisos o utiliza la opción de subir foto.');
        setTipoError('otro');
      }
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturarSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Validar que la cámara ya esté entregando dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('La cámara se está inicializando, espera un segundo...');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Reflejar horizontalmente para que coincida con la previsualización en espejo
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.restore();

    const imagenBase64 = canvas.toDataURL('image/jpeg', 0.85);
    setImagenCapturada(imagenBase64);
    detenerCamara();
    setPaso('preview');
  };

  const manejarSubidaArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Por favor selecciona una imagen de menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagenCapturada(result);
      setPaso('preview');
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setError('Error al leer el archivo. Por favor intenta nuevamente.');
    };
    reader.readAsDataURL(file);
  };

  const reintentar = () => {
    setImagenCapturada(null);
    setPaso('seleccion');
    setError(null);
    setTipoError(null);
  };

  const enviarSolicitud = async () => {
    if (!imagenCapturada) return;

    setPaso('procesando');

    try {
      let selfieUrl = imagenCapturada; // Fallback garantizado: base64

      // Intentar subir a Supabase Storage
      try {
        const blob = await fetch(imagenCapturada).then((r) => r.blob());
        const arrayBuffer = await blob.arrayBuffer();

        const safeEmail = (modeloEmail || 'modelo').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `checkins/${safeEmail}_${Date.now()}.jpg`;

        const { data, error: uploadError } = await supabase.storage
          .from('fotos-modelos')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Storage upload falló, usando base64 como respaldo:', uploadError.message);
          }
        } else if (data) {
          const { data: urlData } = supabase.storage.from('fotos-modelos').getPublicUrl(fileName);
          if (urlData?.publicUrl) {
            selfieUrl = urlData.publicUrl;
          }
        }
      } catch (storageError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Storage error, usando fallback base64:', storageError?.message);
        }
      }

      // Crear la solicitud de entrada
      await crearSolicitudEntrada(modeloEmail, modeloNombre, selfieUrl);

      setPaso('exito');
      toast.success('📸 Solicitud de entrada enviada al administrador');

      setTimeout(() => {
        onClose();
        resetearModal();
      }, 2500);
    } catch (err: any) {
      toast.error('Error al guardar solicitud', {
        description: err instanceof Error ? err.message : String(err),
      });
      setError('Hubo un error al enviar la solicitud: ' + (err?.message || 'Error de conexión'));
      setPaso('error');
    }
  };

  const resetearModal = () => {
    setPaso('seleccion');
    setImagenCapturada(null);
    setError(null);
    setTipoError(null);
    setReintentarNuevaSelfie(false);
    detenerCamara();
  };

  const handleClose = () => {
    resetearModal();
    onClose();
  };

  // Si ya tiene una solicitud hoy y no eligió reintentar tras rechazo
  if (solicitudHoy && !reintentarNuevaSelfie && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-[#16181c] border border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {solicitudHoy.estado === 'pendiente' && (
                <>
                  <AlertCircle className="w-6 h-6 text-yellow-500 animate-pulse" />
                  Solicitud en Revisión
                </>
              )}
              {solicitudHoy.estado === 'aprobada' && (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Entrada Aprobada
                </>
              )}
              {solicitudHoy.estado === 'rechazada' && (
                <>
                  <X className="w-6 h-6 text-red-500" />
                  Solicitud Rechazada
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {solicitudHoy.estado === 'pendiente' &&
                'Tu selfie fue enviada y está siendo verificada por el administrador.'}
              {solicitudHoy.estado === 'aprobada' &&
                'Tu registro de entrada ha sido aprobado y tu turno está activo.'}
              {solicitudHoy.estado === 'rechazada' &&
                'Tu foto no fue aprobada por el administrador. Puedes tomar una nueva selfie ahora.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selfie enviada */}
            {solicitudHoy.selfieUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-white/10">
                <img
                  src={solicitudHoy.selfieUrl}
                  alt="Selfie de registro"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Estado */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Estado de turno:</span>
                <Badge
                  className={
                    solicitudHoy.estado === 'pendiente'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : solicitudHoy.estado === 'aprobada'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {solicitudHoy.estado === 'pendiente' && '⏳ Esperando Aprobación'}
                  {solicitudHoy.estado === 'aprobada' && '🟢 Turno Iniciado'}
                  {solicitudHoy.estado === 'rechazada' && '🔴 Rechazada'}
                </Badge>
              </div>

              <div className="text-xs text-gray-400">
                Hora de envío: {solicitudHoy.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {solicitudHoy.comentariosAdmin && (
                <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs font-semibold text-red-400 mb-1">Motivo del Administrador:</p>
                  <p className="text-sm text-gray-200">{solicitudHoy.comentariosAdmin}</p>
                </div>
              )}
            </div>

            {solicitudHoy.estado === 'pendiente' && (
              <p className="text-xs text-center text-yellow-400/80 bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20">
                El administrador recibirá una alerta para revisar tu foto y dar inicio a tu contador de tiempo.
              </p>
            )}

            {solicitudHoy.estado === 'aprobada' && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <p className="text-sm font-semibold text-green-400">¡Tu contador de tiempo está activo!</p>
                <p className="text-xs text-gray-400 mt-1">
                  Hora de inicio: {solicitudHoy.fechaRespuesta?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) || 'Confirmada'}
                </p>
              </div>
            )}

            {/* BOTÓN PARA REINTENTAR SI FUE RECHAZADA (CORRECCIÓN CRÍTICA DE FLUJO) */}
            {solicitudHoy.estado === 'rechazada' && (
              <Button
                onClick={() => {
                  setReintentarNuevaSelfie(true);
                  setPaso('seleccion');
                }}
                className="w-full h-12 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] text-black font-extrabold hover:brightness-110 shadow-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Tomar o Subir Nueva Selfie
              </Button>
            )}

            <Button onClick={handleClose} variant="outline" className="w-full border-white/20">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#16181c] border-2 border-[#c9a961]/40 text-white shadow-[0_0_40px_rgba(201,169,97,0.15)]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-[#c9a961] font-['Playfair_Display',serif]">
            <Camera className="w-6 h-6 text-[#c9a961]" />
            Verificación de Inicio de Turno
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Toma una selfie o sube tu foto de hoy. Al ser aprobada por el administrador, iniciará tu turno laboral y el contador de tiempo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paso 0: Selección de método */}
          {paso === 'seleccion' && (
            <div className="space-y-4">
              <Alert className="bg-[#c9a961]/10 border border-[#c9a961]/30 text-gray-200">
                <Info className="h-4 w-4 text-[#c9a961]" />
                <AlertDescription className="text-xs">
                  Por seguridad y verificación de presencia en sede o disponibilidad, requerimos una selfie diaria clara de tu rostro.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setPaso('camara')}
                  className="h-32 flex flex-col gap-3 bg-black/40 hover:bg-[#c9a961]/10 border-2 border-white/10 hover:border-[#c9a961]/60 transition-all text-white group"
                  variant="outline"
                  size="lg"
                >
                  <Camera className="w-12 h-12 text-[#c9a961] group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="font-bold text-base text-[#c9a961]">Tomar Selfie Ahora</p>
                    <p className="text-xs text-gray-400">Usar la cámara de tu dispositivo</p>
                  </div>
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 flex flex-col gap-3 bg-black/40 hover:bg-[#c9a961]/10 border-2 border-white/10 hover:border-[#c9a961]/60 transition-all text-white group"
                  variant="outline"
                  size="lg"
                >
                  <Upload className="w-12 h-12 text-[#c9a961] group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="font-bold text-base text-[#c9a961]">Subir desde Galería</p>
                    <p className="text-xs text-gray-400">Seleccionar imagen de tus archivos</p>
                  </div>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={manejarSubidaArchivo}
                className="hidden"
              />

              <Button onClick={handleClose} variant="ghost" className="w-full text-gray-400 hover:text-white">
                Cancelar
              </Button>
            </div>
          )}

          {/* Paso 1: Captura de cámara */}
          {paso === 'camara' && (
            <div className="space-y-4">
              {error ? (
                <div className="bg-black/60 rounded-xl p-5 border border-red-500/30 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <p className="text-white text-sm">{error}</p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button
                      onClick={() => setPaso('seleccion')}
                      className="flex-1 h-12 border-white/20 text-white"
                      variant="outline"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-12 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] text-black font-extrabold hover:brightness-110"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Subir de Galería
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-video sm:aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-[#c9a961]/40 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {/* Guía ovalada para centrar rostro */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-72 border-2 border-dashed border-[#c9a961]/70 rounded-full shadow-[0_0_25px_rgba(201,169,97,0.3)] animate-pulse" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {!error && (
                  <Button
                    onClick={capturarSelfie}
                    className="flex-1 h-13 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] hover:brightness-110 text-black font-black text-base shadow-lg transition-all"
                  >
                    <Camera className="w-5 h-5 mr-2 text-black" />
                    Capturar Foto
                  </Button>
                )}
                <Button
                  onClick={() => setPaso('seleccion')}
                  variant="outline"
                  className={`h-13 border-white/20 text-white ${error ? 'w-full' : 'px-6'}`}
                >
                  Volver al menú
                </Button>
              </div>

              {!error && (
                <p className="text-xs text-center text-gray-400">
                  Ubica tu rostro dentro del óvalo con buena iluminación antes de capturar
                </p>
              )}
            </div>
          )}

          {/* Paso 2: Preview de la imagen */}
          {paso === 'preview' && imagenCapturada && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#c9a961]/50 shadow-xl bg-black">
                <img
                  src={imagenCapturada}
                  alt="Preview selfie"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={enviarSolicitud}
                  className="flex-1 h-13 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#ffd700] hover:brightness-110 text-black font-black text-base shadow-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2 text-black" />
                  Enviar Solicitud al Admin
                </Button>
                <Button
                  onClick={reintentar}
                  variant="outline"
                  className="h-13 border-white/20 text-white hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tomar de Nuevo
                </Button>
              </div>

              <p className="text-xs text-center text-gray-400">
                Asegúrate de que tu rostro se vea nítido antes de enviar la verificación.
              </p>
            </div>
          )}

          {/* Paso 3: Procesando */}
          {paso === 'procesando' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-16 h-16 text-[#c9a961] animate-spin" />
              <p className="text-lg font-bold text-[#c9a961]">Enviando selfie para verificación...</p>
              <p className="text-sm text-gray-400">Notificando al administrador para iniciar tu turno</p>
            </div>
          )}

          {/* Paso 4: Éxito */}
          {paso === 'exito' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <p className="text-2xl font-extrabold text-green-400">¡Selfie Enviada con Éxito!</p>
              <p className="text-sm text-gray-300 max-w-md">
                Tu solicitud fue recibida por el administrador. En cuanto sea aprobada, comenzará a contabilizarse tu turno de 8 horas de forma automática.
              </p>
            </div>
          )}

          {/* Paso 5: Error */}
          {paso === 'error' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-400">Error al Enviar</p>
              <p className="text-sm text-gray-300 max-w-md">
                {error || 'Hubo un inconveniente al registrar la foto. Por favor intenta de nuevo.'}
              </p>
              <Button
                onClick={reintentar}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
              </Button>
            </div>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}