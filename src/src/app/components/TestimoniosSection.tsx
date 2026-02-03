import { Star, MessageSquare, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useTestimonios } from './TestimoniosContext';
import { useState } from 'react';

interface TestimoniosSectionProps {
  onAddTestimonio: () => void;
}

export function TestimoniosSection({ onAddTestimonio }: TestimoniosSectionProps) {
  const { getTestimoniosAprobados } = useTestimonios();
  const testimoniosAprobados = getTestimoniosAprobados();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimoniosPerPage = 3;
  const totalPages = Math.ceil(testimoniosAprobados.length / testimoniosPerPage);
  const currentTestimonios = testimoniosAprobados.slice(
    currentIndex * testimoniosPerPage,
    (currentIndex + 1) * testimoniosPerPage
  );

  const nextPage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
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
    <section className="py-20 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-amber-400 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-background" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Experiencias de <span className="text-primary">Nuestros Clientes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre lo que nuestros clientes dicen sobre su experiencia con nosotros
          </p>
        </div>

        {/* Testimonios Grid */}
        {testimoniosAprobados.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentTestimonios.map((testimonio) => (
                <Card
                  key={testimonio.id}
                  className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                >
                  <CardContent className="p-6">
                    {/* Quote Icon */}
                    <div className="mb-4">
                      <Quote className="w-10 h-10 text-primary/30" />
                    </div>

                    {/* Calificación */}
                    <div className="mb-4">
                      {renderStars(testimonio.calificacion)}
                    </div>

                    {/* Comentario */}
                    <p className="text-foreground mb-4 italic leading-relaxed">
                      "{testimonio.comentario}"
                    </p>

                    {/* Respuesta del Admin */}
                    {testimonio.respuestaAdmin && (
                      <div className="mb-4 p-3 bg-primary/10 border-l-2 border-primary rounded-r">
                        <p className="text-sm text-primary font-semibold mb-1">
                          Respuesta de Black Diamond Studios:
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          {testimonio.respuestaAdmin}
                        </p>
                      </div>
                    )}

                    {/* Nombre y Fecha */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div>
                        <p className="font-bold text-primary">{testimonio.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(testimonio.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-background font-bold text-xl">
                        {testimonio.nombre.charAt(0)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={prevPage}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIndex
                          ? 'bg-primary w-8'
                          : 'bg-primary/30 hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextPage}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aún no hay testimonios publicados. ¡Sé el primero en compartir tu experiencia!
            </p>
          </div>
        )}

        {/* Botón para agregar testimonio */}
        <div className="text-center mt-12">
          <Button
            onClick={onAddTestimonio}
            size="lg"
            className="bg-gradient-to-r from-primary to-amber-400 hover:from-primary/90 hover:to-amber-400/90 text-background font-bold px-8 py-6 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Comparte tu Experiencia
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Tu testimonio será revisado antes de publicarse
          </p>
        </div>
      </div>
    </section>
  );
}
