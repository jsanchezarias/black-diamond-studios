import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Eye, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Modelo {
  id: string;
  nombre: string;
  nombreArtistico: string;
  email: string;
  estado: string;
  disponible: boolean;
  fotoPerfil?: string;
  edad?: number;
  altura?: string;
  sede?: string;
}

interface DebugResponse {
  success: boolean;
  total: number;
  porEstado: {
    activo: number;
    inactivo: number;
    archivado: number;
    sinEstado: number;
  };
  modelos: Modelo[];
}

export function DebugModelosPanel({ onClose }: { onClose: () => void }) {
  const [cargando, setCargando] = useState(false);
  const [data, setData] = useState<DebugResponse | null>(null);

  const cargarDebug = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/migration/debug-modelos`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setData(result);
        toast.success(`✅ Debug completado: ${result.total} modelos encontradas`);
      } else {
        toast.error(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en debug:', error);
      toast.error('❌ Error ejecutando debug');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>;
      case 'inactivo':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertCircle className="w-3 h-3 mr-1" />Inactiva</Badge>;
      case 'archivado':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Archivada</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><AlertCircle className="w-3 h-3 mr-1" />Sin Estado</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🔍 Debug de Modelos en Supabase</CardTitle>
              <CardDescription>
                Ver todas las modelos en la base de datos, incluyendo inactivas y archivadas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={cargarDebug}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cargar Debug
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estadísticas */}
          {data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{data.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{data.porEstado.activo}</div>
                    <div className="text-sm text-muted-foreground">Activas</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400">{data.porEstado.inactivo}</div>
                    <div className="text-sm text-muted-foreground">Inactivas</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{data.porEstado.archivado}</div>
                    <div className="text-sm text-muted-foreground">Archivadas</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-500/10 border-gray-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-gray-400">{data.porEstado.sinEstado}</div>
                    <div className="text-sm text-muted-foreground">Sin Estado</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de modelos */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">📋 Lista Completa de Modelos</h3>
                {data.modelos.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay modelos en la base de datos</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {data.modelos.map((modelo) => (
                      <Card key={modelo.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Foto */}
                            {modelo.fotoPerfil ? (
                              <img
                                src={modelo.fotoPerfil}
                                alt={modelo.nombre}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Img';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                Sin foto
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold truncate">{modelo.nombreArtistico || modelo.nombre}</h4>
                                {getEstadoBadge(modelo.estado)}
                                {modelo.disponible && (
                                  <Badge variant="outline" className="text-xs">Disponible</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{modelo.email}</p>
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                {modelo.edad && <span>Edad: {modelo.edad}</span>}
                                {modelo.altura && <span>Altura: {modelo.altura}</span>}
                                {modelo.sede && <span>Sede: {modelo.sede}</span>}
                              </div>
                            </div>

                            {/* ID */}
                            <div className="hidden md:block text-xs text-muted-foreground font-mono">
                              {modelo.id.substring(0, 8)}...
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Estado inicial */}
          {!data && !cargando && (
            <Card className="bg-blue-950/20 border-blue-500/30">
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-blue-300 mb-4">Haz click en "Cargar Debug" para ver todas las modelos</p>
                <p className="text-sm text-blue-400/70">
                  Este panel mostrará TODAS las modelos independientemente de su estado
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
