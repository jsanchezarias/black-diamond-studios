import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useVideos } from './VideosContext';
import { motion, AnimatePresence } from 'motion/react';

export function VideoShowcase() {
  const { videosActivos, cargando } = useVideos();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = videosActivos[currentVideoIndex];

  // Si no hay videos activos, no mostrar nada
  if (cargando || videosActivos.length === 0) {
    return null;
  }

  // ============================================
  // 🎬 MANEJO DE VIDEO
  // ============================================

  const handleVideoEnd = () => {
    // Al terminar el video, pasar al siguiente
    const nextIndex = (currentVideoIndex + 1) % videosActivos.length;
    setCurrentVideoIndex(nextIndex);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ocultar controles después de 3 segundos de inactividad
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // ============================================
  // 🔄 EFECTOS
  // ============================================

  // Autoplay cuando cambia el video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
        setIsPlaying(false);
      });
    }
  }, [currentVideoIndex]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideo.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={currentVideo.url}
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnd}
              onMouseMove={handleMouseMove}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Información del video */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-24 left-0 right-0 px-6 md:px-12 z-10"
      >
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {currentVideo.titulo}
          </h3>
          {currentVideo.descripcion && (
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              {currentVideo.descripcion}
            </p>
          )}
        </div>
      </motion.div>

      {/* Controles del video */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-6 left-0 right-0 px-6 md:px-12 z-10"
        onMouseMove={handleMouseMove}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Controles izquierda */}
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center group"
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={handleMuteToggle}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center"
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Indicador de video actual */}
            <div className="hidden md:flex items-center gap-2 text-white/80 text-sm">
              <span>{currentVideoIndex + 1}</span>
              <span>/</span>
              <span>{videosActivos.length}</span>
            </div>
          </div>

          {/* Controles derecha */}
          <div className="flex items-center gap-4">
            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center"
              aria-label="Pantalla completa"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Indicadores de progreso (dots) */}
        {videosActivos.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {videosActivos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentVideoIndex
                    ? 'w-8 bg-primary'
                    : 'w-1 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ir al video ${index + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Botón de scroll hacia abajo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10"
      >
        <button
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth'
            });
          }}
          className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors group"
          aria-label="Desplazar hacia abajo"
        >
          <span className="text-xs uppercase tracking-wider">Descubre más</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </button>
      </motion.div>
    </section>
  );
}
