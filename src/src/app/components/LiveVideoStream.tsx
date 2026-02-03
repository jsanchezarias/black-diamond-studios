import { useState, useEffect, useRef } from 'react';
import { Play, Volume2, VolumeX, Maximize, Radio, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface LiveVideoStreamProps {
  streamUrl?: string;
  title?: string;
  modelName?: string;
  onTimeExpired?: () => void;
  onTipClick?: () => void; // Nueva prop para manejar el click de propinas
}

const WATCH_TIME_LIMIT = 4 * 60; // 4 minutos en segundos
const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hora en milisegundos

export function LiveVideoStream({ 
  streamUrl = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  title = 'Transmisión en Vivo',
  modelName = 'Élite Model',
  onTimeExpired,
  onTipClick
}: LiveVideoStreamProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewerCount] = useState(Math.floor(Math.random() * 200) + 50);
  const [timeRemaining, setTimeRemaining] = useState(WATCH_TIME_LIMIT);
  const [isBlurred, setIsBlurred] = useState(false);
  const [canWatch, setCanWatch] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar cooldown al montar el componente
  useEffect(() => {
    checkCooldown();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // Timer del cooldown
  useEffect(() => {
    if (!canWatch && cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        const lastWatchTime = localStorage.getItem('lastStreamWatch');
        if (lastWatchTime) {
          const elapsed = Date.now() - parseInt(lastWatchTime);
          const remaining = COOLDOWN_TIME - elapsed;
          
          if (remaining <= 0) {
            setCanWatch(true);
            setCooldownRemaining(0);
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          } else {
            setCooldownRemaining(remaining);
          }
        }
      }, 1000);
    }

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [canWatch, cooldownRemaining]);

  const checkCooldown = () => {
    const lastWatchTime = localStorage.getItem('lastStreamWatch');
    
    if (lastWatchTime) {
      const elapsed = Date.now() - parseInt(lastWatchTime);
      const remaining = COOLDOWN_TIME - elapsed;
      
      if (remaining > 0) {
        setCanWatch(false);
        setCooldownRemaining(remaining);
        return false;
      }
    }
    
    setCanWatch(true);
    return true;
  };

  const handlePlayClick = () => {
    if (!canWatch) {
      return;
    }

    setIsPlaying(true);
    
    // Guardar timestamp de inicio
    localStorage.setItem('lastStreamWatch', Date.now().toString());
    
    // Iniciar timer de 4 minutos
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Tiempo agotado
          if (timerRef.current) clearInterval(timerRef.current);
          setIsBlurred(true);
          
          // Esperar 1 segundo antes de mostrar el modal para que se vea el blur
          setTimeout(() => {
            onTimeExpired?.();
          }, 1000);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const videoElement = document.getElementById('live-stream-video');
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCooldownTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Determinar el color del timer según el tiempo restante
  const getTimerColor = () => {
    if (timeRemaining > 120) return 'text-green-400'; // > 2min verde
    if (timeRemaining > 60) return 'text-yellow-400'; // > 1min amarillo
    return 'text-red-400'; // < 1min rojo
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0a0a0f] to-[#1a1a24] flex items-center justify-center overflow-hidden group">
      {/* Efectos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-background/40"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Video Stream */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!canWatch ? (
          /* Mensaje de cooldown */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm z-20 p-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500/30 to-red-700/30 flex items-center justify-center mb-6 animate-pulse">
              <Clock className="w-16 h-16 text-red-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Tiempo de Espera
            </h2>
            <p className="text-lg text-muted-foreground mb-4 text-center max-w-md">
              Ya has utilizado tu tiempo de visualización gratuito
            </p>
            <div className="bg-background/60 backdrop-blur-sm rounded-lg p-6 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-2">Podrás volver a ver el stream en:</p>
              <p className="text-4xl font-bold text-primary mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {formatCooldownTime(cooldownRemaining)}
              </p>
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>¿Quieres más? Agenda una cita privada</span>
              </div>
            </div>
          </div>
        ) : !isPlaying ? (
          /* Placeholder antes de reproducir */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
            <div 
              className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 animate-pulse cursor-pointer hover:scale-110 transition-transform" 
              onClick={handlePlayClick}
            >
              <Play className="w-16 h-16 text-background ml-2" fill="currentColor" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center px-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">{modelName}</p>
            <Badge className="bg-red-500/90 text-white border-none gap-2 animate-pulse mb-4">
              <Radio className="w-4 h-4" />
              EN VIVO
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Tiempo de visualización gratuito: 4 minutos</span>
            </div>
          </div>
        ) : (
          /* Video Player */
          <div className="relative w-full h-full">
            <video
              id="live-stream-video"
              className={`w-full h-full object-cover transition-all duration-1000 ${isBlurred ? 'blur-3xl scale-110' : ''}`}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect width='1920' height='1080' fill='%230a0a0f'/%3E%3C/svg%3E"
            >
              <source src={streamUrl} type="application/x-mpegURL" />
              Tu navegador no soporta video HTML5.
            </video>

            {/* Overlay de tiempo agotado */}
            {isBlurred && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-10">
                <div className="text-center p-8 bg-background/80 rounded-2xl border border-primary/30 shadow-2xl">
                  <Clock className="w-20 h-20 text-primary mx-auto mb-4 animate-pulse" />
                  <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Tiempo Agotado
                  </h3>
                  <p className="text-muted-foreground">
                    ¡Espera el modal de reservas!
                  </p>
                </div>
              </div>
            )}

            {/* Overlay de controles (aparece al hover) */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Información superior */}
              <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-background/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {modelName}
                    </h3>
                    <Badge className="bg-red-500/90 text-white border-none gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      EN VIVO
                    </Badge>
                  </div>
                  <Badge className="bg-background/80 backdrop-blur-sm border-primary/30">
                    <Radio className="w-3 h-3 mr-1" />
                    {viewerCount} viendo
                  </Badge>
                </div>
              </div>

              {/* Controles inferiores */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background/80 to-transparent">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      size="sm"
                      className="bg-background/60 backdrop-blur-sm border-primary/30 hover:bg-primary hover:text-background"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFullscreen}
                      variant="outline"
                      size="sm"
                      className="bg-background/60 backdrop-blur-sm border-primary/30 hover:bg-primary hover:text-background"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={onTipClick}
                      variant="outline"
                      size="sm"
                      className="bg-background/60 backdrop-blur-sm border-primary/30 hover:bg-primary hover:text-background"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de LIVE permanente */}
      {isPlaying && !isBlurred && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-red-500/90 text-white border-none gap-2 animate-pulse shadow-lg shadow-red-500/50">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </Badge>
        </div>
      )}

      {/* Timer permanente */}
      {isPlaying && !isBlurred && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex flex-col gap-2 items-end">
            <Badge className="bg-background/60 backdrop-blur-sm border-primary/30 shadow-lg">
              <Radio className="w-3 h-3 mr-1" />
              {viewerCount}
            </Badge>
            <Badge className={`bg-background/80 backdrop-blur-sm border-primary/30 shadow-lg font-bold text-lg ${getTimerColor()}`}>
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
      )}

      {/* Warning cuando queda poco tiempo */}
      {isPlaying && !isBlurred && timeRemaining <= 60 && timeRemaining > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <Badge className="bg-red-500/90 text-white border-none gap-2 text-base px-4 py-2 shadow-lg shadow-red-500/50">
            <AlertCircle className="w-5 h-5" />
            ¡Quedan {timeRemaining} segundos!
          </Badge>
        </div>
      )}
    </div>
  );
}
