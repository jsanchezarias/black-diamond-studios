import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LiveStreamPlayer } from '../components/LiveStreamPlayer';
import { 
  Radio, 
  Users, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Video,
  Calendar,
  Send,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';

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

interface Model {
  id: string;
  name: string;
  photo: string;
  available: boolean;
}

export function StreamingPage() {
  const [activeSessions, setActiveSessions] = useState<StreamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StreamSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Modelos de ejemplo (deberían venir de tu sistema)
  const models: Model[] = [
    {
      id: '1',
      name: 'Isabella',
      photo: 'https://lh3.googleusercontent.com/d/1oGKB8qlDxBOKgbY3BQzCJ7LqeZq5KjNm',
      available: true,
    },
    {
      id: '2',
      name: 'Valentina',
      photo: 'https://lh3.googleusercontent.com/d/1XwFJaUQYbvN3MRqLP8cGJKZ9HfDWp2Tx',
      available: true,
    },
  ];

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/streaming/active`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setActiveSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId);
  };

  if (selectedSession) {
    const modelInfo = getModelInfo(selectedSession.modelId);
    
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedSession(null)}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a transmisiones
            </Button>
            <div className="flex items-center gap-3">
              {modelInfo?.photo && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30">
                  <ImageWithFallback 
                    src={modelInfo.photo} 
                    alt={selectedSession.modelName}
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {selectedSession.modelName}
                </h1>
                <Badge className="bg-red-600 text-white mt-1">
                  <Radio className="w-3 h-3 mr-1" />
                  EN VIVO
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <LiveStreamPlayer
            modelId={selectedSession.modelId}
            modelName={selectedSession.modelName}
            modelPhoto={modelInfo?.photo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-primary/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzMGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <Badge className="bg-red-600 text-white mb-4 animate-pulse shadow-lg shadow-red-500/30">
              <Radio className="w-3 h-3 mr-1" />
              TRANSMISIONES EN VIVO
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
              Experiencias en Vivo
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Conecta en tiempo real con nuestras modelos exclusivas
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>
                  <strong className="text-primary">
                    {activeSessions.reduce((acc, s) => acc + (s.viewers || 0), 0)}
                  </strong> espectadores en línea
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>
                  <strong className="text-primary">{activeSessions.length}</strong> transmisiones activas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transmisiones Activas */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando transmisiones...</p>
          </div>
        ) : activeSessions.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              En Vivo Ahora
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSessions.map((session) => {
                const modelInfo = getModelInfo(session.modelId);
                return (
                  <Card
                    key={session.id}
                    className="border-primary/20 bg-gradient-card hover:border-primary/40 transition-all cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedSession(session)}
                  >
                    <CardContent className="p-0">
                      {/* Thumbnail / Preview */}
                      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                        {modelInfo?.photo ? (
                          <ImageWithFallback
                            src={modelInfo.photo}
                            alt={session.modelName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Radio className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Badge EN VIVO */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-red-600 text-white border-none animate-pulse shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                            EN VIVO
                          </Badge>
                        </div>

                        {/* Viewers */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/60 backdrop-blur-sm text-white border-primary/30">
                            <Users className="w-3 h-3 mr-1" />
                            {session.viewers || 0}
                          </Badge>
                        </div>

                        {/* Nombre de la modelo */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {session.modelName}
                          </h3>
                          <p className="text-xs text-white/80">
                            En vivo desde hace {Math.floor((new Date().getTime() - new Date(session.startedAt).getTime()) / 60000)} min
                          </p>
                        </div>
                      </div>

                      {/* Footer con botón */}
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-background gap-2"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Radio className="w-4 h-4" />
                          Ver Transmisión
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="border-primary/20 bg-gradient-card">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary/40" />
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No hay transmisiones activas
              </h3>
              <p className="text-muted-foreground mb-6">
                En este momento ninguna modelo está en vivo. Vuelve pronto para disfrutar de experiencias exclusivas.
              </p>
              <Badge variant="outline" className="border-primary/30">
                <Radio className="w-3 h-3 mr-1" />
                Próximamente
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTA Section */}
      {activeSessions.length === 0 && (
        <div className="container mx-auto px-4 pb-16">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                ¿Quieres ser notificado?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Activa las notificaciones para recibir alertas cuando tus modelos favoritas inicien una transmisión en vivo
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-background">
                Activar Notificaciones
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}