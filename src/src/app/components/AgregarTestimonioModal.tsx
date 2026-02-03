import { useState } from 'react';
import { X, Star, MessageSquare, User, Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useTestimonios } from './TestimoniosContext';
import { toast } from 'sonner';

interface AgregarTestimonioModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgregarTestimonioModal({ open, onClose }: AgregarTestimonioModalProps) {
  const { agregarTestimonio } = useTestimonios();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    comentario: '',
    calificacion: 5
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.email.trim() || !formData.comentario.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (formData.comentario.length < 20) {
      toast.error('El comentario debe tener al menos 20 caracteres');
      return;
    }

    agregarTestimonio(formData);
    setShowSuccess(true);

    // Cerrar modal después de 3 segundos
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      email: '',
      comentario: '',
      calificacion: 5
    });
    setShowSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card backdrop-blur-lg border-primary/30 shadow-2xl">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Comparte tu Experiencia
              </DialogTitle>
              <DialogDescription>
                Tu opinión es muy valiosa para nosotros. Será revisada antes de publicarse.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Calificación */}
              <div className="space-y-3">
                <Label>
                  Calificación <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, calificacion: rating })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 transition-all ${
                          rating <= formData.calificacion
                            ? 'fill-primary text-primary scale-110'
                            : 'fill-muted text-muted hover:text-primary/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.calificacion === 5 && '⭐ ¡Excelente!'}
                  {formData.calificacion === 4 && '👍 Muy bueno'}
                  {formData.calificacion === 3 && '😊 Bueno'}
                  {formData.calificacion === 2 && '😐 Regular'}
                  {formData.calificacion === 1 && '😞 Necesita mejorar'}
                </p>
              </div>

              {/* Información Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="bg-background/70 border-border focus:border-primary pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background/70 border-border focus:border-primary pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No se publicará, solo para verificación
                  </p>
                </div>
              </div>

              {/* Comentario */}
              <div className="space-y-2">
                <Label htmlFor="comentario">
                  Tu Experiencia <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="comentario"
                  placeholder="Cuéntanos sobre tu experiencia con Black Diamond Studios..."
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  rows={5}
                  className="bg-background/70 border-border focus:border-primary resize-none"
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mínimo 20 caracteres</span>
                  <span className={formData.comentario.length >= 20 ? 'text-primary' : ''}>
                    {formData.comentario.length} / 500
                  </span>
                </div>
              </div>

              {/* Nota de privacidad */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ℹ️ Tu testimonio será revisado por nuestro equipo antes de publicarse. 
                  Esto puede tomar hasta 24-48 horas. Nos reservamos el derecho de no publicar 
                  comentarios que contengan lenguaje inapropiado o información falsa.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-border/50 hover:bg-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-amber-400 hover:from-primary/90 hover:to-amber-400/90 text-background font-bold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Testimonio
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-background" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              ¡Gracias por tu Testimonio!
            </h3>
            <p className="text-muted-foreground mb-2">
              Tu experiencia ha sido recibida exitosamente
            </p>
            <p className="text-sm text-muted-foreground">
              Será revisada y publicada pronto...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
