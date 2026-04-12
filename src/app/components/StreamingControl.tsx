import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Video,
  VideoOff,
  Radio,
  Users,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

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

interface StreamingControlProps {
  modelId: string;
  modelName: string;
}

export function StreamingControl({ modelId, modelName }: StreamingControlProps) {
  const [session, setSession] = useState<StreamSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');

  const startStreaming = async () => {
    setLoading(true);
    try {
      // Crear sesión local (el streaming real requiere un servicio externo: Mux, Cloudflare Stream, etc.)
      const newSession: StreamSession = {
        id: Date.now().toString(),
        modelId,
        modelName,
        streamKey: `sk_${modelId}_${Date.now()}`,
        status: 'live',
        startedAt: new Date().toISOString(),
        viewers: 0,
        streamUrl: streamUrl || '',
      };
      setSession(newSession);
      setIsStreaming(true);
    } finally {
      setLoading(false);
    }
  };

  const endStreaming = async () => {
    setLoading(true);
    try {
      setIsStreaming(false);
      setSession(null);
      setStreamUrl('');
    } finally {
      setLoading(false);
    }
  };

  const updateStreamUrl = () => {
    if (!session || !streamUrl) return;
    setSession({ ...session, streamUrl });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Estado del Streaming */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Control de Transmisión
              </h3>
              <p className="text-sm text-muted-foreground">
                Gestiona tu transmisión en vivo
              </p>
            </div>

            <Badge
              className={`text-sm px-4 py-2 ${
                isStreaming
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isStreaming ? (
                <>
                  <Radio className="w-4 h-4 mr-2" />
                  EN VIVO
                </>
              ) : (
                <>
                  <VideoOff className="w-4 h-4 mr-2" />
                  FUERA DE LÍNEA
                </>
              )}
            </Badge>
          </div>

          {/* Botón Principal */}
          <div className="mb-6">
            {!isStreaming ? (
              <Button
                onClick={startStreaming}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-background h-14 text-lg gap-2"
                size="lg"
              >
                <Video className="w-5 h-5" />
                {loading ? 'Iniciando...' : 'Iniciar Transmisión'}
              </Button>
            ) : (
              <Button
                onClick={endStreaming}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg gap-2"
                size="lg"
              >
                <VideoOff className="w-5 h-5" />
                {loading ? 'Finalizando...' : 'Finalizar Transmisión'}
              </Button>
            )}
          </div>

          {/* Estadísticas */}
          {isStreaming && session && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Espectadores</span>
                </div>
                <p className="text-2xl font-bold">{session.viewers || 0}</p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Tiempo en vivo</span>
                </div>
                <p className="text-2xl font-bold">
                  {session.startedAt ?
                    Math.floor((new Date().getTime() - new Date(session.startedAt).getTime()) / 60000) + ' min'
                    : '0 min'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de OBS */}
      {isStreaming && session && (
        <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Configuración de OBS / Software de Streaming
            </h4>

            {/* Stream Key */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                Stream Key (clave de transmisión)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={session.streamKey}
                  readOnly
                  className="flex-1 bg-black/20 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30"
                  onClick={() => copyToClipboard(session.streamKey)}
                >
                  {copiedKey ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* URL del Stream */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                URL de reproducción (HLS/DASH)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://stream.tu-servicio.com/live/..."
                  className="flex-1 bg-black/20 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/40"
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={updateStreamUrl}
                >
                  Actualizar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pega aquí la URL de reproducción de tu servicio de streaming
              </p>
            </div>

            {/* Instrucciones */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-2">Cómo transmitir con OBS:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Registra una cuenta en un servicio de streaming (Cloudflare Stream, Mux, LiveKit, etc.)</li>
                    <li>Obtén tu RTMP Server URL y Stream Key del servicio</li>
                    <li>En OBS: Settings → Stream → pega Server y Stream Key</li>
                    <li>Copia la URL de reproducción del servicio y pégala arriba</li>
                    <li>Haz clic en "Start Streaming" en OBS</li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="font-semibold mb-1">Servicios recomendados:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <a
                        href="https://www.cloudflare.com/products/cloudflare-stream/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full inline-flex items-center gap-1 transition-colors"
                      >
                        Cloudflare Stream <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://www.mux.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full inline-flex items-center gap-1 transition-colors"
                      >
                        Mux <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://livekit.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full inline-flex items-center gap-1 transition-colors"
                      >
                        LiveKit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
