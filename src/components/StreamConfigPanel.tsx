import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Video, Wifi, Copy, CheckCircle, AlertCircle, Edit2, Save, X, Radio } from 'lucide-react';
import { supabase } from '../utils/supabase/info';

interface StreamConfig {
  sedeId: string;
  sedeName: string;
  streamUrl: string;
  streamKey: string;
  rtmpUrl: string;
  isLive: boolean;
  lastUpdated?: string;
}

// Default sedes for when no DB data exists
const DEFAULT_SEDES: StreamConfig[] = [
  {
    sedeId: 'sede-norte',
    sedeName: 'Sede Norte',
    streamUrl: '',
    streamKey: '',
    rtmpUrl: 'rtmp://tu-servidor.com/live',
    isLive: false,
  },
  {
    sedeId: 'sede-sur',
    sedeName: 'Sede Sur',
    streamUrl: '',
    streamKey: '',
    rtmpUrl: 'rtmp://tu-servidor.com/live',
    isLive: false,
  },
];

interface StreamConfigPanelProps {
  accessToken?: string;
}

export function StreamConfigPanel({ accessToken }: StreamConfigPanelProps) {
  const [streams, setStreams] = useState<StreamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from Supabase stream_configs table
      const { data, error: dbError } = await supabase
        .from('stream_configs' as any)
        .select('*')
        .order('sede_name', { ascending: true });

      if (dbError || !data || data.length === 0) {
        // Use default sedes if table doesn't exist or is empty
        setStreams(DEFAULT_SEDES);
      } else {
        const mapped: StreamConfig[] = data.map((row: any) => ({
          sedeId: row.sede_id,
          sedeName: row.sede_name,
          streamUrl: row.stream_url || '',
          streamKey: row.stream_key || '',
          rtmpUrl: row.rtmp_url || '',
          isLive: row.is_live || false,
          lastUpdated: row.updated_at,
        }));
        setStreams(mapped);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching streams:', err);
      setStreams(DEFAULT_SEDES);
    } finally {
      setLoading(false);
    }
  };

  const updateStreamUrl = async (sedeId: string, newUrl: string) => {
    try {
      // Try to upsert in Supabase
      await supabase
        .from('stream_configs' as any)
        .upsert({
          sede_id: sedeId,
          stream_url: newUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'sede_id' });

      // Update local state
      setStreams(prev => prev.map(s =>
        s.sedeId === sedeId ? { ...s, streamUrl: newUrl, lastUpdated: new Date().toISOString() } : s
      ));
      setEditingId(null);
      setEditUrl('');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating stream:', err);
      // Still update locally
      setStreams(prev => prev.map(s =>
        s.sedeId === sedeId ? { ...s, streamUrl: newUrl } : s
      ));
      setEditingId(null);
      setEditUrl('');
    }
  };

  const toggleLiveStatus = async (sedeId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('stream_configs' as any)
        .upsert({
          sede_id: sedeId,
          is_live: !currentStatus,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'sede_id' });

      setStreams(prev => prev.map(s =>
        s.sedeId === sedeId ? { ...s, isLive: !currentStatus } : s
      ));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error toggling live status:', err);
      // Update locally anyway
      setStreams(prev => prev.map(s =>
        s.sedeId === sedeId ? { ...s, isLive: !currentStatus } : s
      ));
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
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>🔥 Ant Media Server</strong> - ⭐ RECOMENDADO: Control total, sin censura (~$25/mes)</li>
              <li>• <strong>AWS IVS</strong> - Sin restricciones de contenido, escalable (~$150/mes)</li>
              <li>• <strong>Castr.io</strong> - Permite contenido adulto explícitamente ($49/mes)</li>
              <li>• <strong>Wowza Cloud</strong> - Profesional, neutral con contenido ($49/mes)</li>
            </ul>
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
