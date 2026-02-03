import React, { useState } from 'react';
import { StreamingControl } from '../components/StreamingControl';
import { LiveStreamPlayer } from '../components/LiveStreamPlayer';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Video, 
  Radio, 
  Settings,
  Eye,
  Code,
  Copy,
  CheckCircle2
} from 'lucide-react';

/**
 * 🎥 PÁGINA DE PRUEBA RÁPIDA DE STREAMING
 * 
 * USA ESTA PÁGINA PARA PROBAR TU CONFIGURACIÓN AHORA MISMO
 * 
 * INSTRUCCIONES:
 * 1. Importa este componente en App.tsx
 * 2. Agrégalo como ruta temporal
 * 3. Navega a esa ruta
 * 4. Usa las pestañas para probar todo
 */

export function StreamingTestPage() {
  const [copied, setCopied] = useState<string | null>(null);

  // Modelo de prueba - CAMBIA ESTOS VALORES
  const modeloDePrueba = {
    id: '1',
    name: 'Isabella', // Cambia por tu nombre
    photo: 'https://lh3.googleusercontent.com/d/1oGKB8qlDxBOKgbY3BQzCJ7LqeZq5KjNm',
  };

  const copyCode = (code: string, section: string) => {
    navigator.clipboard.writeText(code);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-primary/20 rounded-lg p-6 mb-6">
          <Badge className="bg-red-600 text-white mb-3 animate-pulse">
            <Radio className="w-3 h-3 mr-1" />
            TEST DE STREAMING
          </Badge>
          <h1 className="text-4xl font-bold mb-3 text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Prueba de Streaming en Vivo
          </h1>
          <p className="text-muted-foreground mb-4">
            Usa esta página para configurar y probar tu transmisión con OBS y Cloudflare.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-primary/10 border border-primary/20 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Paso 1</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Configura OBS con Cloudflare
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Paso 2</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Inicia transmisión en panel
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Paso 3</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Verifica que se vea en vivo
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="control" className="gap-2">
              <Settings className="w-4 h-4" />
              Panel de Control
            </TabsTrigger>
            <TabsTrigger value="player" className="gap-2">
              <Eye className="w-4 h-4" />
              Vista Espectador
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="w-4 h-4" />
              Código
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: PANEL DE CONTROL */}
          <TabsContent value="control" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Panel de Control - Vista Modelo</h2>
                    <p className="text-sm text-muted-foreground">
                      Este es el panel que las modelos usan para gestionar sus streams
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2 text-sm">📋 Instrucciones:</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Haz clic en "Iniciar Transmisión"</li>
                    <li>Configura OBS con las credenciales de Cloudflare (ve a /CONFIGURAR_AHORA.md)</li>
                    <li>En OBS: "Start Streaming"</li>
                    <li>Copia la HLS URL de Cloudflare</li>
                    <li>Pégala en el campo "URL de reproducción" abajo</li>
                    <li>Haz clic en "Actualizar"</li>
                    <li>Ve a la pestaña "Vista Espectador" para ver tu stream</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* COMPONENTE EN VIVO */}
            <StreamingControl
              modelId={modeloDePrueba.id}
              modelName={modeloDePrueba.name}
            />

            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> La URL de Cloudflare tiene este formato:
                  <code className="block mt-2 bg-black/40 p-2 rounded text-xs">
                    https://customer-[ID].cloudflarestream.com/[VIDEO-ID]/manifest/video.m3u8
                  </code>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 2: VISTA ESPECTADOR */}
          <TabsContent value="player" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vista Espectador</h2>
                    <p className="text-sm text-muted-foreground">
                      Así es como los espectadores verán tu transmisión en vivo
                    </p>
                  </div>
                </div>

                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2 text-sm">✅ Verifica que se vea:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Badge "EN VIVO" pulsando</li>
                    <li>• Tu video transmitiendo</li>
                    <li>• Controles funcionando (mute, fullscreen)</li>
                    <li>• Contador de espectadores</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* REPRODUCTOR EN VIVO */}
            <LiveStreamPlayer
              modelId={modeloDePrueba.id}
              modelName={modeloDePrueba.name}
              modelPhoto={modeloDePrueba.photo}
            />

            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Si no ves el video, verifica:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• OBS está transmitiendo (verde en status bar)</li>
                  <li>• La URL de reproducción está correcta</li>
                  <li>• Cloudflare muestra el stream como "Live"</li>
                  <li>• Esperaste 15-30 segundos para que procese</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 3: CÓDIGO */}
          <TabsContent value="code" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Código de Integración</h2>
                    <p className="text-sm text-muted-foreground">
                      Copia este código para integrar en tu app
                    </p>
                  </div>
                </div>

                {/* CÓDIGO 1: StreamingControl */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">StreamingControl (Dashboard Modelo)</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(
                        `import { StreamingControl } from './components/StreamingControl';\n\n<StreamingControl \n  modelId={modelo.id}\n  modelName={modelo.nombre}\n/>`,
                        'control'
                      )}
                    >
                      {copied === 'control' ? (
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
                  <pre className="bg-black/60 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{`import { StreamingControl } from './components/StreamingControl';

// En el dashboard de la modelo:
<div className="p-6">
  <h2 className="text-2xl font-bold mb-4">Mi Transmisión</h2>
  
  <StreamingControl 
    modelId={modelo.id}
    modelName={modelo.nombre}
  />
</div>`}</code>
                  </pre>
                </div>

                {/* CÓDIGO 2: LiveStreamPlayer */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">LiveStreamPlayer (Vista Pública)</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(
                        `import { LiveStreamPlayer } from './components/LiveStreamPlayer';\n\n<LiveStreamPlayer\n  modelId={model.id}\n  modelName={model.name}\n  modelPhoto={model.photo}\n/>`,
                        'player'
                      )}
                    >
                      {copied === 'player' ? (
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
                  <pre className="bg-black/60 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{`import { LiveStreamPlayer } from './components/LiveStreamPlayer';

// En el perfil de la modelo:
<section className="mt-8">
  <h3 className="text-xl font-bold mb-4">En Vivo Ahora</h3>
  
  <LiveStreamPlayer
    modelId={model.id}
    modelName={model.name}
    modelPhoto={model.photo}
  />
</section>`}</code>
                  </pre>
                </div>

                {/* CÓDIGO 3: StreamingPage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">StreamingPage (Galería de Streams)</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(
                        `import { StreamingPage } from './pages/StreamingPage';\n\n// En tus rutas:\n{\n  path: "/streaming",\n  element: <StreamingPage />\n}`,
                        'page'
                      )}
                    >
                      {copied === 'page' ? (
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
                  <pre className="bg-black/60 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{`import { StreamingPage } from './pages/StreamingPage';

// En tu router:
{
  path: "/streaming",
  element: <StreamingPage />
}

// O sin router, directo en App.tsx:
<StreamingPage />`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Documentación */}
            <Card className="border-primary/20 bg-gradient-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">📚 Documentación Completa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      /CONFIGURAR_AHORA.md
                    </Badge>
                    <span className="text-muted-foreground">Guía paso a paso de configuración</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      /STREAMING_SETUP.md
                    </Badge>
                    <span className="text-muted-foreground">Guía técnica completa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      /COMO_USAR_STREAMING.md
                    </Badge>
                    <span className="text-muted-foreground">Instrucciones de uso</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer con ayuda */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">🚀 Próximos Pasos</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Sigue la guía en <code className="bg-black/40 px-2 py-0.5 rounded">/CONFIGURAR_AHORA.md</code></li>
              <li>Configura Cloudflare Stream y OBS</li>
              <li>Haz tu primera transmisión de prueba aquí</li>
              <li>Una vez funcionando, integra los componentes en tu app</li>
              <li>¡Transmite en vivo con calidad premium! 🎥✨</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
