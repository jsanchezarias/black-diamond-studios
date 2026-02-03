import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Video, 
  VideoOff, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2,
  Maximize,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface StreamSession {
  id: string;
  modelId: string;
  modelName: string;
  streamKey: string;
  status: string;
  startedAt: string;
  viewers: number;
  streamUrl: string;
}

interface LiveStreamPlayerProps {
  modelId: string;
  modelName: string;
  modelPhoto?: string;
}

export function LiveStreamPlayer({ modelId, modelName, modelPhoto }: LiveStreamPlayerProps) {
  const [session, setSession] = useState<StreamSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Verificar si hay una sesión activa
  useEffect(() => {
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [modelId]);

  const checkActiveSession = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/streaming/active/${modelId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      
      if (data.active && data.session) {
        setSession(data.session);
        setIsLive(true);
        setViewers(data.session.viewers || 0);
      } else {
        setIsLive(false);
        setSession(null);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${modelName} en vivo`,
        text: `Mira la transmisión en vivo de ${modelName}`,
        url: window.location.href,
      });
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (!isLive) {
    return (
      <Card className="border-primary/20 bg-gradient-card">
        <CardContent className="p-8 text-center">
          <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            No hay transmisión activa
          </h3>
          <p className="text-muted-foreground mb-4">
            {modelName} no está transmitiendo en este momento
          </p>
          <Badge variant="outline" className="border-primary/30">
            <Video className="w-3 h-3 mr-1" />
            Vuelve pronto
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card className="border-primary/20 bg-gradient-card overflow-hidden">
        <CardContent className="p-0">
          {/* Video Container */}
          <div className="relative aspect-video bg-black group">
            {/* Indicador de VIVO */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-red-600 text-white border-none animate-pulse shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                EN VIVO
              </Badge>
            </div>

            {/* Contador de viewers */}
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-black/60 backdrop-blur-sm text-white border-primary/30">
                <Users className="w-3 h-3 mr-1" />
                {viewers} viendo
              </Badge>
            </div>

            {/* Video Element - AQUÍ SE REPRODUCIRÁ EL STREAM */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={isMuted}
            >
              {/* Aquí se cargará el stream cuando esté disponible */}
              {session?.streamUrl && (
                <source src={session.streamUrl} type="application/x-mpegURL" />
              )}
            </video>

            {/* Mensaje temporal si no hay URL de stream */}
            {!session?.streamUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                  <p className="text-lg font-semibold mb-2">Configurando stream...</p>
                  <p className="text-sm text-muted-foreground">
                    Usa tu servicio de streaming favorito (Cloudflare Stream, Mux, LiveKit)
                  </p>
                  <div className="mt-4 p-4 bg-black/40 rounded-lg backdrop-blur-sm max-w-md mx-auto">
                    <p className="text-xs text-left mb-2 font-mono">
                      <strong>Stream Key:</strong> {session?.streamKey}
                    </p>
                    <p className="text-xs text-muted-foreground text-left">
                      Configura este key en tu servicio de streaming y actualiza la URL
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Información de la modelo y acciones */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {modelPhoto && (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                    <img src={modelPhoto} alt={modelName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {modelName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Transmitiendo desde {new Date(session?.startedAt || '').toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={hasLiked ? "default" : "outline"}
                  className={hasLiked ? "bg-red-600 hover:bg-red-700 border-none" : "border-primary/30"}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-white' : ''}`} />
                  {likes}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat (Placeholder - se puede integrar con Supabase Realtime) */}
      {showChat && (
        <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Chat en vivo
            </h4>
            <div className="h-64 bg-black/20 rounded-lg p-3 mb-3 overflow-y-auto">
              <p className="text-sm text-muted-foreground text-center py-8">
                El chat se activará cuando conectes Supabase Realtime
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-black/20 border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
