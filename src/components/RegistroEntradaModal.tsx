import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, RefreshCw, Upload, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAsistencia } from '../src/app/components/AsistenciaContext';
import { supabase } from '../lib/supabaseClient';
import { Alert, AlertDescription } from './ui/alert';

interface RegistroEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloEmail: string;
  modeloNombre: string;
}

export function RegistroEntradaModal({ isOpen, onClose, modeloEmail, modeloNombre }: RegistroEntradaModalProps) {
  const { crearSolicitudEntrada, obtenerSolicitudPorModelo } = useAsistencia();
  const [paso, setPaso] = useState<'seleccion' | 'camara' | 'preview' | 'procesando' | 'exito' | 'error'>('seleccion');
  const [imagenCapturada, setImagenCapturada] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoError, setTipoError] = useState<'permiso' | 'navegador' | 'otro' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const solicitudHoy = obtenerSolicitudPorModelo(modeloEmail);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso('seleccion');
      setImagenCapturada(null);
      setError(null);
      setTipoError(null);
    } else {
      detenerCamara();
    }
  }, [isOpen]);

  // Iniciar cámara cuando se selecciona esa opción
  useEffect(() => {
    if (paso === 'camara') {
      iniciarCamara();
    }
    return () => {
      if (paso !== 'camara') {
        detenerCamara();
      }
    };
  }, [paso]);

  const iniciarCamara = async () => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Tu navegador no soporta el acceso a la cámara. Por favor, usa un navegador moderno como Chrome, Firefox o Safari.');
        setTipoError('navegador');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Cámara frontal
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      setTipoError(null);
    } catch (err: any) {
      // Log informativo en lugar de error (es normal que algunos usuarios no den permiso)
      console.info('Acceso a cámara no disponible:', err.name);
      
      // Manejar diferentes tipos de errores
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
        setTipoError('permiso');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se detectó ninguna cámara en tu dispositivo.');
        setTipoError('otro');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La cámara está siendo usada por otra aplicación. Por favor, cierra otras apps que puedan estar usando la cámara.');
        setTipoError('otro');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        setError('La cámara no cumple con los requisitos necesarios. Intenta usar otra cámara o dispositivo.');
        setTipoError('otro');
      } else {
        setError('No se pudo acceder a la cámara. Asegúrate de que tu navegador tenga permisos y que estés usando HTTPS.');
        setTipoError('otro');
      }
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturarSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar la imagen del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a base64
    const imagenBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setImagenCapturada(imagenBase64);
    detenerCamara();
    setPaso('preview');
  };

  const manejarSubidaArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Por favor, selecciona una imagen de menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagenCapturada(result);
      setPaso('preview');
      setError(null);
    };
    reader.onerror = () => {
      setError('Error al leer el archivo. Por favor, intenta de nuevo.');
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
      let selfieUrl = imagenCapturada; // Fallback: usar base64

      // Intentar subir a Supabase Storage (si está configurado)
      // NOTA: Si no hay bucket configurado, simplemente usamos base64
      try {
        const blob = await fetch(imagenCapturada).then(r => r.blob());
        const fileName = `selfies/${modeloEmail}/${Date.now()}.jpg`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('asistencia') // Bucket que debe existir en Supabase
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          // Silencioso: es normal que no haya bucket configurado
          // Simplemente usamos el base64 como fallback
        } else if (data) {
          // Obtener URL pública
          const { data: urlData } = supabase.storage
            .from('asistencia')
            .getPublicUrl(fileName);
          
          if (urlData?.publicUrl) {
            selfieUrl = urlData.publicUrl;
          }
        }
      } catch (storageError) {
        // Silencioso: Storage no configurado, usar base64
      }

      // Crear la solicitud de entrada
      crearSolicitudEntrada(modeloEmail, modeloNombre, selfieUrl);
      
      setPaso('exito');
      
      // Cerrar modal después de 3 segundos
      setTimeout(() => {
        onClose();
        resetearModal();
      }, 3000);

    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setError('Hubo un error al enviar la solicitud. Por favor, intenta de nuevo.');
      setPaso('error');
    }
  };

  const resetearModal = () => {
    setPaso('seleccion');
    setImagenCapturada(null);
    setError(null);
    setTipoError(null);
    detenerCamara();
  };

  const handleClose = () => {
    resetearModal();
    onClose();
  };

  // Si ya tiene una solicitud hoy, mostrar el estado
  if (solicitudHoy && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-card backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {solicitudHoy.estado === 'pendiente' && (
                <>
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                  Solicitud Pendiente
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
                  Entrada Rechazada
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {solicitudHoy.estado === 'pendiente' && 'Tu solicitud está siendo revisada'}
              {solicitudHoy.estado === 'aprobada' && 'Tu entrada ha sido aprobada'}
              {solicitudHoy.estado === 'rechazada' && 'Tu solicitud de entrada fue rechazada'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selfie enviada */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border">
              <img 
                src={solicitudHoy.selfieUrl} 
                alt="Selfie de registro" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Estado */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <Badge 
                  className={
                    solicitudHoy.estado === 'pendiente' 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : solicitudHoy.estado === 'aprobada'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {solicitudHoy.estado === 'pendiente' && 'Esperando aprobación'}
                  {solicitudHoy.estado === 'aprobada' && 'Aprobada'}
                  {solicitudHoy.estado === 'rechazada' && 'Rechazada'}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                Enviada: {solicitudHoy.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {solicitudHoy.comentariosAdmin && (
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <p className="text-xs font-semibold mb-1">Comentarios del Admin:</p>
                  <p className="text-sm">{solicitudHoy.comentariosAdmin}</p>
                </div>
              )}
            </div>

            {solicitudHoy.estado === 'pendiente' && (
              <p className="text-sm text-center text-muted-foreground">
                Tu solicitud está siendo revisada por el administrador. Recibirás notificación pronto.
              </p>
            )}

            {solicitudHoy.estado === 'aprobada' && (
              <div className="p-4 bg-green-950/30 border-2 border-green-500/30 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-400">¡Ya estás registrada!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hora de entrada: {solicitudHoy.fechaRespuesta?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card backdrop-blur-sm border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Registrar Entrada
          </DialogTitle>
          <DialogDescription>
            Toma una selfie o sube una foto para solicitar tu registro de entrada al turno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paso 0: Selección de método */}
          {paso === 'seleccion' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Elige cómo quieres enviar tu foto de registro. Si usas un celular, te recomendamos tomar una selfie directamente.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setPaso('camara')}
                  className="h-32 flex flex-col gap-3"
                  variant="outline"
                  size="lg"
                >
                  <Camera className="w-12 h-12" />
                  <div className="text-center">
                    <p className="font-semibold">Tomar Selfie</p>
                    <p className="text-xs text-muted-foreground">Usar cámara</p>
                  </div>
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 flex flex-col gap-3"
                  variant="outline"
                  size="lg"
                >
                  <Upload className="w-12 h-12" />
                  <div className="text-center">
                    <p className="font-semibold">Subir Foto</p>
                    <p className="text-xs text-muted-foreground">Desde galería</p>
                  </div>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarSubidaArchivo}
                className="hidden"
              />

              <Button onClick={handleClose} variant="outline" className="w-full">
                Cancelar
              </Button>
            </div>
          )}

          {/* Paso 1: Captura de cámara */}
          {paso === 'camara' && (
            <>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/30">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }} // Efecto espejo
                />
                
                {/* Overlay guía */}
                {!error && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-80 border-4 border-primary/50 rounded-full" />
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center p-6 max-w-md">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-white text-sm mb-4">{error}</p>
                      
                      {tipoError === 'permiso' && (
                        <div className="space-y-3">
                          <div className="text-xs text-gray-300 text-left bg-black/50 p-3 rounded">
                            <p className="font-semibold mb-2">Para permitir el acceso a la cámara:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Haz clic en el ícono de candado/cámara en la barra de direcciones</li>
                              <li>Selecciona "Permitir" para el acceso a la cámara</li>
                              <li>Recarga la página si es necesario</li>
                            </ul>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={iniciarCamara} className="flex-1">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reintentar
                            </Button>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                              <Upload className="w-4 h-4 mr-2" />
                              Subir Foto
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {tipoError !== 'permiso' && (
                        <div className="flex gap-2">
                          <Button onClick={() => setPaso('seleccion')} className="flex-1">
                            Volver
                          </Button>
                          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Foto
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={capturarSelfie} className="flex-1" size="lg" disabled={!!error}>
                  <Camera className="w-4 h-4 mr-2" />
                  Capturar Selfie
                </Button>
                <Button onClick={() => setPaso('seleccion')} variant="outline" size="lg">
                  Volver
                </Button>
              </div>

              {!error && (
                <p className="text-xs text-center text-muted-foreground">
                  Centra tu rostro en el óvalo y asegúrate de tener buena iluminación
                </p>
              )}
            </>
          )}

          {/* Paso 2: Preview de la imagen */}
          {paso === 'preview' && imagenCapturada && (
            <>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/30">
                <img 
                  src={imagenCapturada} 
                  alt="Preview selfie" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={enviarSolicitud} className="flex-1" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enviar Solicitud
                </Button>
                <Button onClick={reintentar} variant="outline" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tomar de Nuevo
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Revisa que la imagen sea clara antes de enviarla
              </p>
            </>
          )}

          {/* Paso 3: Procesando */}
          {paso === 'procesando' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-lg font-semibold">Enviando solicitud...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Por favor espera un momento
              </p>
            </div>
          )}

          {/* Paso 4: Éxito */}
          {paso === 'exito' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500 mb-2">¡Solicitud Enviada!</p>
              <p className="text-center text-muted-foreground">
                Tu solicitud de entrada ha sido enviada al administrador.
                <br />
                Recibirás notificación cuando sea aprobada.
              </p>
            </div>
          )}

          {/* Paso 5: Error */}
          {paso === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500 mb-2">Error</p>
              <p className="text-center text-muted-foreground mb-4">
                {error || 'Hubo un problema al enviar tu solicitud'}
              </p>
              <Button onClick={reintentar}>
                Intentar de Nuevo
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