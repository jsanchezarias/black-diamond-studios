import { Star, CheckCircle, XCircle, Trash2, MessageSquare, User, Mail, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useTestimonios } from '../src/app/components/TestimoniosContext';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

export function GestionTestimoniosPanel() {
  const { getTestimoniosPendientes, aprobarTestimonio, rechazarTestimonio, eliminarTestimonio, testimonios } = useTestimonios();
  const pendientes = getTestimoniosPendientes();
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});

  const handleAprobar = (id: string) => {
    aprobarTestimonio(id, respuestas[id] || undefined);
    setRespuestas({ ...respuestas, [id]: '' });
    toast.success('✅ Testimonio aprobado y publicado');
  };

  const handleRechazar = (id: string) => {
    if (confirm('¿Estás seguro de rechazar este testimonio?')) {
      rechazarTestimonio(id);
      toast.warning('❌ Testimonio rechazado');
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de eliminar permanentemente este testimonio?')) {
      eliminarTestimonio(id);
      toast.error('🗑️ Testimonio eliminado');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-primary text-primary'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Testimonios Pendientes */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Testimonios Pendientes ({pendientes.length})
          </h3>
          
          {pendientes.length > 0 ? (
            <div className="space-y-4">
              {pendientes.map((testimonio) => (
                <Card key={testimonio.id} className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4 space-y-4">
                    {/* Header del testimonio */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-background font-bold text-xl">
                          {testimonio.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{testimonio.nombre}</p>
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
                              Pendiente
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3" />
                            {testimonio.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(testimonio.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Calificación */}
                      <div className="text-right">
                        {renderStars(testimonio.calificacion)}
                        <p className="text-sm text-muted-foreground mt-1">
                          {testimonio.calificacion}/5 estrellas
                        </p>
                      </div>
                    </div>

                    {/* Comentario */}
                    <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Comentario del cliente:</p>
                      <p className="text-foreground italic">"{testimonio.comentario}"</p>
                    </div>

                    {/* Respuesta opcional */}
                    <div className="space-y-2">
                      <Label htmlFor={`respuesta-${testimonio.id}`}>
                        Respuesta (Opcional)
                      </Label>
                      <Textarea
                        id={`respuesta-${testimonio.id}`}
                        placeholder="Escribe una respuesta para agradecer al cliente..."
                        value={respuestas[testimonio.id] || ''}
                        onChange={(e) => setRespuestas({ ...respuestas, [testimonio.id]: e.target.value })}
                        rows={2}
                        className="bg-background/70 border-border focus:border-primary resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        La respuesta se mostrará debajo del testimonio cuando sea publicado
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button
                        onClick={() => handleAprobar(testimonio.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar y Publicar
                      </Button>
                      <Button
                        onClick={() => handleRechazar(testimonio.id)}
                        variant="outline"
                        className="border-destructive/50 hover:bg-destructive/20 text-destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => handleEliminar(testimonio.id)}
                        variant="outline"
                        className="border-destructive/50 hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-muted-foreground text-lg">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground mt-2">
                No hay testimonios pendientes de aprobación
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonios Aprobados */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Testimonios Publicados ({testimonios.filter(t => t.estado === 'aprobado').length})
          </h3>
          
          {testimonios.filter(t => t.estado === 'aprobado').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonios.filter(t => t.estado === 'aprobado').map((testimonio) => (
                <Card key={testimonio.id} className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{testimonio.nombre}</p>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Publicado
                          </Badge>
                        </div>
                        <div className="mt-2">{renderStars(testimonio.calificacion)}</div>
                      </div>
                      <Button
                        onClick={() => handleEliminar(testimonio.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-foreground italic">"{testimonio.comentario}"</p>
                    
                    {testimonio.respuestaAdmin && (
                      <div className="p-3 bg-primary/10 border-l-2 border-primary rounded-r">
                        <p className="text-xs text-primary font-semibold mb-1">Tu respuesta:</p>
                        <p className="text-xs text-muted-foreground italic">{testimonio.respuestaAdmin}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(testimonio.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">No hay testimonios publicados aún</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonios Rechazados */}
      {testimonios.filter(t => t.estado === 'rechazado').length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-destructive mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Testimonios Rechazados ({testimonios.filter(t => t.estado === 'rechazado').length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonios.filter(t => t.estado === 'rechazado').map((testimonio) => (
                <Card key={testimonio.id} className="border-destructive/30 bg-destructive/5 opacity-60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{testimonio.nombre}</p>
                          <Badge variant="destructive" className="text-xs">
                            Rechazado
                          </Badge>
                        </div>
                        <div className="mt-2">{renderStars(testimonio.calificacion)}</div>
                      </div>
                      <Button
                        onClick={() => handleEliminar(testimonio.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-foreground italic line-through opacity-50">"{testimonio.comentario}"</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(testimonio.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
