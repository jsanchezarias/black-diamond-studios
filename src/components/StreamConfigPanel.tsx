import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Video, Wifi, Copy, CheckCircle, AlertCircle, Edit2, Save, X, Radio } from 'lucide-react';
import { publicAnonKey, projectId } from '../utils/supabase/info';

interface StreamConfig {
  sedeId: string;
  sedeName: string;
  streamUrl: string;
  streamKey: string;
  rtmpUrl: string;
  isLive: boolean;
  lastUpdated?: string;
}

interface StreamConfigPanelProps {
  accessToken?: string; // Opcional para mantener compatibilidad
}

export function StreamConfigPanel({ accessToken }: StreamConfigPanelProps) {
  const [streams, setStreams] = useState<StreamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Usar accessToken si está disponible, sino usar publicAnonKey
  const authToken = accessToken || publicAnonKey;

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      
      // Supabase Edge Functions requiere AMBOS headers: apikey Y Authorization
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/streams`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error inesperado:', response.status, errorData);
        throw new Error(errorData.message || 'Error al cargar configuración de streams');
      }

      const data = await response.json();
      // Filtrar streams nulos y validar estructura
      const validStreams = (data.streams || []).filter((stream: any) => {
        return stream && 
               typeof stream.sedeId === 'string' && 
               typeof stream.sedeName === 'string' &&
               typeof stream.isLive === 'boolean';
      });
      setStreams(validStreams);
    } catch (err) {
      console.error('Error fetching streams:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los streams');
    } finally {
      setLoading(false);
    }
  };

  const updateStreamUrl = async (sedeId: string, newUrl: string) => {
    try {
      // Siempre enviar apikey, y Authorization si hay usuario autenticado
      const headers: HeadersInit = {
        'apikey': publicAnonKey,
        'Content-Type': 'application/json',
      };
      if (authToken && authToken !== publicAnonKey) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/streams/${sedeId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ streamUrl: newUrl }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar stream');
      }

      await fetchStreams();
      setEditingId(null);
      setEditUrl('');
    } catch (err) {
      console.error('Error updating stream:', err);
      alert('Error al actualizar el stream');
    }
  };

  const toggleLiveStatus = async (sedeId: string, currentStatus: boolean) => {
    try {
      // Siempre enviar apikey, y Authorization si hay usuario autenticado
      const headers: HeadersInit = {
        'apikey': publicAnonKey,
        'Content-Type': 'application/json',
      };
      if (authToken && authToken !== publicAnonKey) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/streams/${sedeId}/live`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isLive: !currentStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      await fetchStreams();
    } catch (err) {
      console.error('Error toggling live status:', err);
      alert('Error al actualizar el estado');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (stream: StreamConfig) => {
    setEditingId(stream.sedeId);
    setEditUrl(stream.streamUrl);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl('');
  };

  const saveEdit = (sedeId: string) => {
    if (editUrl.trim()) {
      updateStreamUrl(sedeId, editUrl.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Configuración de Streams
          </h2>
          <p className="text-muted-foreground">
            Gestiona las URLs de transmisión en vivo para cada sede
          </p>
        </div>
        <Button onClick={fetchStreams} variant="outline" className="gap-2">
          <Video className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones OBS */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Configuración de OBS Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">📹 Paso 1: Obtener URL del Stream</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Para transmitir desde OBS necesitas un servicio de streaming:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>🔥 Ant Media Server</strong> - ⭐ RECOMENDADO: Control total, sin censura (~$25/mes)</li>
              <li>• <strong>AWS IVS</strong> - Sin restricciones de contenido, escalable (~$150/mes)</li>
              <li>• <strong>Castr.io</strong> - Permite contenido adulto explícitamente ($49/mes)</li>
              <li>• <strong>Wowza Cloud</strong> - Profesional, neutral con contenido ($49/mes)</li>
            </ul>
            <p className="text-xs text-primary mt-2">
              📚 Ver guía completa en: <code>/GUIA-ANT-MEDIA-SERVER.md</code>
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">🔧 Paso 2: Configurar OBS</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>1. Abre OBS Studio</li>
              <li>2. Ve a Configuración → Stream</li>
              <li>3. Selecciona "Personalizado" o el servicio que uses</li>
              <li>4. Ingresa el <strong>Server URL (RTMP)</strong></li>
              <li>5. Ingresa tu <strong>Stream Key</strong></li>
              <li>6. Haz clic en "Iniciar transmisión"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📺 Paso 3: Obtener URL HLS</h4>
            <p className="text-sm text-muted-foreground">
              El servicio de streaming convertirá tu señal RTMP a HLS (formato .m3u8).
              Copia esa URL HLS y pégala en el campo "Stream URL HLS" de cada sede abajo.
            </p>
          </div>

          <div className="bg-background/60 p-3 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Ejemplo con Ant Media Server:</strong> La URL HLS será algo como:
              <code className="ml-2 text-primary">https://stream.tudominio.com:5443/LiveApp/streams/sede-norte-live.m3u8</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Streams por Sede */}
      <div className="grid gap-4">
        {streams.map((stream) => (
          <Card key={stream.sedeId} className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stream.isLive 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{stream.sedeName}</h3>
                    <p className="text-sm text-muted-foreground">ID: {stream.sedeId}</p>
                  </div>
                </div>
                <Badge 
                  variant={stream.isLive ? "default" : "secondary"}
                  className={stream.isLive ? "bg-green-500 animate-pulse" : ""}
                >
                  {stream.isLive ? (
                    <>
                      <Radio className="w-3 h-3 mr-1" />
                      EN VIVO
                    </>
                  ) : (
                    'OFFLINE'
                  )}
                </Badge>
              </div>

              {/* Stream URL HLS */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Stream URL HLS (Playback)</label>
                  {editingId === stream.sedeId ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://tu-stream.com/video.m3u8"
                      />
                      <Button 
                        onClick={() => saveEdit(stream.sedeId)} 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={cancelEdit} 
                        size="sm" 
                        variant="outline"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted/50 border border-primary/20 rounded-lg text-sm break-all">
                        {stream.streamUrl || 'No configurado'}
                      </div>
                      <Button 
                        onClick={() => startEdit(stream)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {stream.streamUrl && (
                        <Button 
                          onClick={() => copyToClipboard(stream.streamUrl, `url-${stream.sedeId}`)} 
                          size="sm" 
                          variant="outline"
                        >
                          {copiedId === `url-${stream.sedeId}` ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* RTMP Info (para referencia) */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">
                      RTMP Server (para OBS)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted/30 border border-primary/10 rounded-lg text-xs break-all text-muted-foreground">
                        {stream.rtmpUrl || 'rtmp://tu-servidor.com/live'}
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(stream.rtmpUrl || '', `rtmp-${stream.sedeId}`)} 
                        size="sm" 
                        variant="ghost"
                        disabled={!stream.rtmpUrl}
                      >
                        {copiedId === `rtmp-${stream.sedeId}` ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">
                      Stream Key (para OBS)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted/30 border border-primary/10 rounded-lg text-xs break-all text-muted-foreground font-mono">
                        {stream.streamKey || 'tu-stream-key-secreto'}
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(stream.streamKey || '', `key-${stream.sedeId}`)} 
                        size="sm" 
                        variant="ghost"
                        disabled={!stream.streamKey}
                      >
                        {copiedId === `key-${stream.sedeId}` ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                <div className="text-xs text-muted-foreground">
                  {stream.lastUpdated && (
                    <>Última actualización: {new Date(stream.lastUpdated).toLocaleString('es')}</>
                  )}
                </div>
                <Button
                  onClick={() => toggleLiveStatus(stream.sedeId, stream.isLive)}
                  variant={stream.isLive ? "outline" : "default"}
                  size="sm"
                  className={stream.isLive ? "border-red-500 text-red-500 hover:bg-red-500/10" : "bg-green-500 hover:bg-green-600"}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  {stream.isLive ? 'Marcar como Offline' : 'Marcar como En Vivo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guía adicional */}
      <Card className="border-primary/20 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">📖 Recursos Útiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>🔥 Ant Media Server (RECOMENDADO):</strong>{' '}
            <a 
              href="https://github.com/ant-media/Ant-Media-Server/wiki" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Documentación oficial
            </a>
            {' | '}
            <a 
              href="https://antmedia.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Sitio web
            </a>
          </p>
          <p>
            <strong>AWS IVS:</strong>{' '}
            <a 
              href="https://docs.aws.amazon.com/ivs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Documentación
            </a>
          </p>
          <p>
            <strong>OBS Studio:</strong>{' '}
            <a 
              href="https://obsproject.com/wiki/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Guía completa
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}