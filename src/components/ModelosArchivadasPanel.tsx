import { useState } from 'react';
import { Archive, RotateCcw, Search, Calendar, FileText, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useModelos } from '../src/app/components/ModelosContext';
import { toast } from 'sonner@2.0.3';

export function ModelosArchivadasPanel() {
  const { modelosArchivadas, restaurarModelo } = useModelos();
  const [searchTerm, setSearchTerm] = useState('');

  const handleRestaurar = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de restaurar a ${nombre}?\n\nLa modelo volverá a estar activa y podrá iniciar sesión nuevamente.`)) {
      restaurarModelo(id);
      toast.success(`✅ Modelo restaurada exitosamente!`, {
        description: `${nombre} ha sido restaurada y puede volver a trabajar.`
      });
    }
  };

  const filteredModelos = modelosArchivadas.filter(modelo =>
    modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.nombreArtistico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.cedula.includes(searchTerm) ||
    modelo.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Archive className="w-5 h-5" />
              Modelos Archivadas
            </CardTitle>
            <CardDescription>
              Backup de modelos que ya no están activas - Puedes restaurarlas en cualquier momento
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {modelosArchivadas.length} archivadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {modelosArchivadas.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input-background border-border focus:border-primary"
              />
            </div>
          </div>
        )}

        {filteredModelos.length > 0 ? (
          <div className="space-y-3">
            {filteredModelos.map((modelo) => (
              <div 
                key={modelo.id}
                className="bg-secondary rounded-lg border border-yellow-500/30 hover:border-yellow-500/50 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-yellow-500/30 flex-shrink-0">
                      <img 
                        src={modelo.fotoPerfil} 
                        alt={modelo.nombre}
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{modelo.nombre}</h3>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Archive className="w-3 h-3 mr-1" />
                            Archivada
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {modelo.edad} años
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            CC: {modelo.cedula}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">
                          <span className="font-medium">Email:</span> {modelo.email}
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">Teléfono:</span> {modelo.telefono}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Servicios</p>
                          <p className="text-lg font-bold text-primary">{modelo.servicios}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ingresos Generados</p>
                          <p className="text-lg font-bold text-primary">
                            ${(modelo.ingresos / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Promedio/Servicio</p>
                          <p className="text-lg font-bold text-primary">
                            ${modelo.servicios > 0 ? ((modelo.ingresos / modelo.servicios) / 1000).toFixed(0) : 0}K
                          </p>
                        </div>
                      </div>

                      {modelo.fechaArchivado && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm space-y-1">
                            <div className="text-muted-foreground">
                              <span className="font-medium text-foreground">Archivada el:</span>{' '}
                              {new Date(modelo.fechaArchivado).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {modelo.motivoArchivo && (
                              <div className="text-muted-foreground">
                                <span className="font-medium text-foreground">Motivo:</span>{' '}
                                {modelo.motivoArchivo}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRestaurar(modelo.id, modelo.nombre)}
                        className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : modelosArchivadas.length > 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron modelos con "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No hay modelos archivadas</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cuando archives una modelo, aparecerá aquí y podrás restaurarla cuando regrese
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
