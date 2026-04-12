import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useTestimonios } from './TestimoniosContext';
import { useState, useEffect, useRef } from 'react';
import { ParticlesBackground } from './ParticlesBackground';

interface TestimoniosSectionProps {
  onAddTestimonio: () => void;
}

export function TestimoniosSection({ onAddTestimonio }: TestimoniosSectionProps) {
  const { getTestimoniosAprobados } = useTestimonios();
  const testimoniosAprobados = getTestimoniosAprobados();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

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

  // Auto-slide testimonios cada 6s
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(nextPage, 6000);
    return () => clearInterval(interval);
  }, [totalPages]);

  // Scroll-reveal para esta sección
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const animated = section.querySelectorAll<HTMLElement>(
      '.bd-animate-fade-up, .bd-animate-scale-in, .bd-animate-fade-in'
    );
    animated.forEach(el => {
      el.style.animationPlayState = 'paused';
      el.style.opacity = '0';
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animated.forEach(el => {
            el.style.opacity = '';
            el.style.animationPlayState = 'running';
          });
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 transition-all duration-300 ${
            star <= rating
              ? 'fill-primary text-primary'
              : 'fill-muted/30 text-muted/30'
          }`}
        />
      ))}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden"
    >
      {/* Partículas de densidad media con nebulosa */}
      <ParticlesBackground
        density="medium"
        showConnections={true}
        showNebula={true}
        mouseRadius={110}
        className="opacity-45"
      />

      {/* Halo decorativo de fondo */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-12 left-8 w-48 h-48 bg-primary rounded-full blur-3xl opacity-[0.07]"
          style={{ animation: 'bd-float 5s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-12 right-8 w-64 h-64 bg-primary rounded-full blur-3xl opacity-[0.06]"
          style={{ animation: 'bd-float 7s ease-in-out infinite reverse' }}
        />
      </div>

      <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-amber-400 rounded-full mb-5 shadow-lg shadow-primary/30 bd-animate-scale-in bd-delay-0 bd-animate-float"
          >
            <Star className="w-8 h-8 text-background" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 bd-animate-fade-up bd-delay-1"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Experiencias de{' '}
            <span className="text-primary">Nuestros Clientes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto bd-animate-fade-up bd-delay-2">
            Descubre lo que nuestros clientes dicen sobre su experiencia con nosotros
          </p>
          <div className="bd-shimmer-line max-w-xs mx-auto mt-6" />
        </div>

        {/* Testimonios Grid */}
        {testimoniosAprobados.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentTestimonios.map((testimonio, idx) => (
                <Card
                  key={testimonio.id}
                  className={`border-primary/20 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 bd-animate-scale-in bd-card-hover`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Quote icon dorado decorativo */}
                    <div className="mb-4">
                      <Quote className="w-8 h-8 text-primary/40 fill-primary/10" />
                    </div>

                    {/* Calificación */}
                    <div className="mb-3">
                      {renderStars(testimonio.calificacion)}
                    </div>

                    {/* Comentario */}
                    <p className="text-foreground/90 mb-5 italic leading-relaxed flex-1 text-sm">
                      "{testimonio.comentario}"
                    </p>

                    {/* Respuesta del Admin */}
                    {testimonio.respuestaAdmin && (
                      <div className="mb-4 p-3 bg-primary/10 border-l-2 border-primary rounded-r-lg">
                        <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wide">
                          Black Diamond Studios:
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          {testimonio.respuestaAdmin}
                        </p>
                      </div>
                    )}

                    {/* Nombre y Fecha */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                      <div>
                        <p className="font-bold text-primary text-sm">{testimonio.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(testimonio.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-background font-bold text-base shadow-md shadow-primary/30"
                      >
                        {testimonio.nombre.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mb-10">
                <Button
                  onClick={prevPage}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-2 items-center">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentIndex
                          ? 'bg-primary w-8 h-2'
                          : 'bg-primary/30 hover:bg-primary/60 w-2 h-2'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextPage}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Star className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              Aún no hay testimonios publicados.
            </p>
            <p className="text-sm text-muted-foreground">
              ¡Sé el primero en compartir tu experiencia!
            </p>
          </div>
        )}

        {/* Botón para agregar testimonio */}
        <div className="text-center mt-4 bd-animate-fade-up bd-delay-3">
          <Button
            onClick={onAddTestimonio}
            size="lg"
            className="bg-gradient-to-r from-primary to-amber-400 hover:from-primary/90 hover:to-amber-400/90 text-background font-bold px-10 py-6 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1"
          >
            <Star className="w-5 h-5 mr-2" />
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
