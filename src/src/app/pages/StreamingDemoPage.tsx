import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { StreamingControl } from '../components/StreamingControl';
import { LiveStreamPlayer } from '../components/LiveStreamPlayer';
import { 
  Radio, 
  Video, 
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

/**
 * PÁGINA DE DEMOSTRACIÓN DEL SISTEMA DE STREAMING
 * 
 * Esta página muestra ejemplos de cómo usar los componentes de streaming
 * Úsala como referencia para integrar en tu aplicación
 */

export function StreamingDemoPage() {
  // Datos de ejemplo de una modelo
  const modeloEjemplo = {
    id: '1',
    name: 'Isabella',
    photo: 'https://lh3.googleusercontent.com/d/1oGKB8qlDxBOKgbY3BQzCJ7LqeZq5KjNm',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-primary/20">
        <div className="container mx-auto px-4 py-16">
          <Badge className="bg-red-600 text-white mb-4 animate-pulse">
            <Radio className="w-3 h-3 mr-1" />
            SISTEMA DE STREAMING
          </Badge>
          <h1 className="text-5xl font-bold mb-4 text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Streaming en Vivo con OBS
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
            Sistema completo de transmisión en vivo integrado con Supabase. 
            Transmite desde OBS usando Cloudflare Stream, Mux o LiveKit.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">Backend Configurado</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">Supabase Conectado</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">UI Premium Lista</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Sección 1: Control de Streaming (Para Modelos) */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Panel de Control para Modelos
              </h2>
              <p className="text-muted-foreground">
                Las modelos usan este panel para iniciar/finalizar sus transmisiones
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Componente en Acción */}
            <div>
              <Card className="border-primary/20 bg-gradient-card mb-4">
                <CardContent className="p-4">
                  <Badge className="bg-primary/20 text-primary mb-2">
                    Componente en Vivo
                  </Badge>
                  <h3 className="font-semibold mb-2">StreamingControl</h3>
                  <p className="text-sm text-muted-foreground">
                    Este componente se integra en el dashboard de la modelo
                  </p>
                </CardContent>
              </Card>
              
              <StreamingControl
                modelId={modeloEjemplo.id}
                modelName={modeloEjemplo.name}
              />
            </div>

            {/* Cómo Integrar */}
            <div>
              <Card className="border-primary/20 bg-gradient-card h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Cómo Integrar</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">1. Importar el componente</p>
                      <code className="text-xs bg-black/40 p-3 rounded block overflow-x-auto">
                        {`import { StreamingControl } from './components/StreamingControl';`}
                      </code>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">2. Usar en el Dashboard</p>
                      <code className="text-xs bg-black/40 p-3 rounded block overflow-x-auto">
                        {`<StreamingControl 
  modelId={modelo.id}
  modelName={modelo.nombre}
/>`}
                      </code>
                    </div>

                    <div className="pt-4 border-t border-primary/20">
                      <p className="text-sm mb-2">
                        <strong>Características:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Botón para iniciar/finalizar transmisión</li>
                        <li>• Stream Key único generado automáticamente</li>
                        <li>• Campo para pegar URL de reproducción</li>
                        <li>• Instrucciones para configurar OBS</li>
                        <li>• Estadísticas en tiempo real (viewers, tiempo)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Sección 2: Reproductor (Para Espectadores) */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Reproductor para Espectadores
              </h2>
              <p className="text-muted-foreground">
                Vista pública del stream con controles premium
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Cómo Integrar */}
            <div className="order-2 md:order-1">
              <Card className="border-primary/20 bg-gradient-card h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Cómo Integrar</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">1. Importar el componente</p>
                      <code className="text-xs bg-black/40 p-3 rounded block overflow-x-auto">
                        {`import { LiveStreamPlayer } from './components/LiveStreamPlayer';`}
                      </code>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">2. Usar en la página</p>
                      <code className="text-xs bg-black/40 p-3 rounded block overflow-x-auto">
                        {`<LiveStreamPlayer
  modelId="1"
  modelName="Isabella"
  modelPhoto="url-foto"
/>`}
                      </code>
                    </div>

                    <div className="pt-4 border-t border-primary/20">
                      <p className="text-sm mb-2">
                        <strong>Características:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Badge "EN VIVO" animado</li>
                        <li>• Contador de espectadores en tiempo real</li>
                        <li>• Controles de reproducción (mute, fullscreen)</li>
                        <li>• Sistema de likes</li>
                        <li>• Chat en vivo (preparado)</li>
                        <li>• Botón de compartir</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Componente en Acción */}
            <div className="order-1 md:order-2">
              <Card className="border-primary/20 bg-gradient-card mb-4">
                <CardContent className="p-4">
                  <Badge className="bg-accent/20 text-accent mb-2">
                    Componente en Vivo
                  </Badge>
                  <h3 className="font-semibold mb-2">LiveStreamPlayer</h3>
                  <p className="text-sm text-muted-foreground">
                    Vista del reproductor para los espectadores
                  </p>
                </CardContent>
              </Card>
              
              <LiveStreamPlayer
                modelId={modeloEjemplo.id}
                modelName={modeloEjemplo.name}
                modelPhoto={modeloEjemplo.photo}
              />
            </div>
          </div>
        </section>

        {/* Sección 3: Próximos Pasos */}
        <section>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Próximos Pasos
                  </h2>
                  <p className="text-muted-foreground">
                    El sistema está listo. Ahora necesitas conectar un servicio de streaming externo.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="border-primary/20 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Elige un Servicio</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cloudflare Stream, Mux o LiveKit
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-primary/30"
                      onClick={() => window.open('https://cloudflare.com/products/cloudflare-stream/', '_blank')}
                    >
                      Ver Opciones <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Configura OBS</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Descarga e instala OBS Studio
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-primary/30"
                      onClick={() => window.open('https://obsproject.com/download', '_blank')}
                    >
                      Descargar OBS <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">¡Transmite!</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Conecta OBS y comienza a transmitir
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-primary/30"
                    >
                      Ver Guía <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Documentación Completa Disponible</p>
                    <p className="text-muted-foreground mb-2">
                      Revisa los archivos de documentación para guías paso a paso:
                    </p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• <code className="text-xs bg-black/40 px-2 py-0.5 rounded">/STREAMING_SETUP.md</code> - Guía técnica completa</li>
                      <li>• <code className="text-xs bg-black/40 px-2 py-0.5 rounded">/COMO_USAR_STREAMING.md</code> - Instrucciones de uso</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
