import { useState, useEffect, useRef } from 'react';
import { Star, MapPin, Clock, ChevronRight, X, ZoomIn, ChevronLeft, Building2, Home } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import Masonry from 'react-responsive-masonry';

interface Service {
  name: string;
  duration: string;
  price: string;
  priceHome?: string;
  description: string;
}

interface ModelData {
  id: string;
  name: string;
  age: number;
  photo: string;
  gallery: string[];
  rating: number;
  height: string;
  measurements: string;
  languages: string[];
  location: string;
  available: boolean;
  description: string;
  services: Service[];
  specialties: string[];
  domicilio: boolean; // ✅ Nuevo campo para indicar si presta servicio a domicilio
}

interface ModelCardProps {
  model: ModelData;
  onContact: (model: ModelData, service?: Service, location?: 'sede' | 'domicilio', price?: string) => void;
}

export function ModelCard({ model, onContact }: ModelCardProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'sede' | 'domicilio'>('sede');
  const [columnCount, setColumnCount] = useState(2); // Solo para el modal de galería completa
  const [showFullscreen, setShowFullscreen] = useState(false); // Nuevo estado para fullscreen
  const rightColumnRef = useRef<HTMLDivElement>(null); // Referencia a la columna derecha
  const headerRef = useRef<HTMLDivElement>(null); // Referencia al header de la galería

  // Determinar si la descripción es larga (más de 150 caracteres)
  const isLongDescription = model.description.length > 150;
  /*
  useEffect(() => {
    const loadImageOrientations = async () => {
      const orientations = await Promise.all(
        model.gallery.slice(0, 9).map((src) => {
          return new Promise<'horizontal' | 'vertical' | 'square'>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const ratio = img.width / img.height;
              if (ratio > 1.1) resolve('horizontal');
              else if (ratio < 0.9) resolve('vertical');
              else resolve('square');
            };
            img.onerror = () => resolve('square'); // Default en caso de error
            img.src = src;
          });
        })
      );
      // setImageOrientations(orientations);
    };

    if (model.gallery && model.gallery.length > 0) {
      loadImageOrientations();
    }
  }, [model.gallery]);
  */

  // Efecto para calcular columnas del MODAL de galería completa
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      const photoCount = model.gallery.length;
      
      if (width < 640) {
        setColumnCount(photoCount <= 2 ? 1 : photoCount <= 4 ? 2 : 3);
      } else if (width < 1024) {
        setColumnCount(photoCount <= 2 ? 1 : photoCount <= 6 ? 2 : 3);
      } else if (width < 1536) {
        setColumnCount(photoCount <= 3 ? 2 : 3);
      } else if (width < 1920) {
        setColumnCount(photoCount <= 4 ? 2 : 3);
      } else {
        setColumnCount(photoCount <= 6 ? 2 : 3);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [model.gallery.length]);

  // Función para solicitar reserva desde el sistema
  /*
  const handleReservar = () => {
    if (selectedService) {
      const precioSeleccionado = model.domicilio 
        ? (selectedLocation === 'sede' ? selectedService.price : (selectedService.priceHome || selectedService.price))
        : selectedService.price;
      onContact(model, selectedService, selectedLocation, precioSeleccionado);
    } else {
      onContact(model);
    }
  };
  */

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFullscreen) {
        if (e.key === 'Escape') {
          setShowFullscreen(false);
        } else if (e.key === 'ArrowLeft') {
          setSelectedImage((prev) => (prev > 0 ? prev - 1 : model.gallery.length - 1));
        } else if (e.key === 'ArrowRight') {
          setSelectedImage((prev) => (prev < model.gallery.length - 1 ? prev + 1 : 0));
        }
      } else if (showGallery && e.key === 'Escape') {
        setShowGallery(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreen, showGallery, selectedImage, model.gallery.length]);

  // Efecto para obtener la altura de la columna derecha
  /*
  useEffect(() => {
    const updateHeights = () => {
      const rightCol = rightColumnRef.current;
      const headerEl = headerRef.current;
      
      if (rightCol && headerEl) {
        const rightHeight = rightCol.offsetHeight;
        const headerHeight = headerEl.offsetHeight;
        const galleryHeight = rightHeight - headerHeight - 32; // 32px de padding
        
        // setRightColumnHeight(galleryHeight);
      }
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    const timer = setTimeout(updateHeights, 100);
    
    return () => {
      window.removeEventListener('resize', updateHeights);
      clearTimeout(timer);
    };
  }, [model, selectedService, showFullDescription, selectedLocation]);
  */

  return (
    <>
      <Card className="border-primary/15 bg-gradient-card shadow-card overflow-hidden w-full h-auto sm:h-[650px]">
        <CardContent className="p-0">
          {/* Layout Vertical optimizado para cuadrícula (Grid) */}
          <div className="flex flex-col h-full">
            {/* Cabecera: Foto de perfil + Info básica */}
            <div className="w-full flex-shrink-0 flex flex-col border-b border-primary/10">
              {/* Header tipo Carrusel Full Width */}
              <div
                ref={headerRef}
                className="relative w-full h-72 sm:h-80 md:h-[400px] flex-shrink-0 overflow-hidden group bg-black"
              >
                {model.gallery.length > 0 ? (
                  <>
                    <img
                      src={model.gallery[selectedImage]}
                      alt={model.name}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out cursor-pointer"
                      onClick={() => setShowFullscreen(true)}
                    />
                    
                    {/* Flechas del Carrusel */}
                    {model.gallery.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage((prev) => (prev > 0 ? prev - 1 : model.gallery.length - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-lg"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage((prev) => (prev < model.gallery.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-lg"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Puntos (Dots) */}
                        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-10">
                          {model.gallery.map((_, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(i);
                              }}
                              className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${
                                i === selectedImage
                                  ? 'w-6 bg-amber-400'
                                  : 'w-1.5 bg-white/50 hover:bg-white/80'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900">
                    <ImageWithFallback
                      src={model.photo}
                      alt={model.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                )}

                {/* Overlay Degradado y Status */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex justify-between items-end">
                  <div className="flex-1 pointer-events-auto">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-3xl font-bold text-white drop-shadow-md bd-gold-shimmer" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {model.name}
                      </h3>
                      {model.available && (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-sm backdrop-blur-sm px-2 py-0.5">
                        <Star className="w-3 h-3 mr-1 fill-amber-400" />
                        {model.rating}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {model.location}
                      </Badge>
                      <span className="text-sm font-medium text-white/80 ml-1">
                        {model.age} años
                      </span>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* Contenido: Info, Servicios y Tarifas */}
            <div className="flex-1 flex flex-col w-full" ref={rightColumnRef}>
              {/* Información detallada */}
              <div className="p-4 border-b border-primary/10">
                <div className="flex flex-wrap gap-1 mb-3">
                  {model.specialties.map((specialty, idx) => (
                    <Badge key={idx} className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                <h4 className="font-semibold mb-2 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Sobre mí
                </h4>
                <div>
                  <p className={`text-sm text-muted-foreground ${!showFullDescription && isLongDescription ? 'line-clamp-2' : ''}`}>
                    {model.description}
                  </p>
                  {isLongDescription && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-xs text-primary hover:text-primary/80 font-medium mt-1 flex items-center gap-1 transition-colors"
                    >
                      {showFullDescription ? 'Ver menos' : 'Leer más'}
                      <ChevronRight className={`w-3 h-3 ${showFullDescription ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                  <div>
                    <span className="text-muted-foreground">Estatura:</span>
                    <p className="font-medium">{model.height}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Medidas:</span>
                    <p className="font-medium">{model.measurements}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Idiomas:</span>
                    <p className="font-medium">{model.languages.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Servicios */}
              <div className="p-4 border-b border-primary/10 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Servicios Disponibles
                  </h4>
                  {selectedService && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      Seleccionado
                    </Badge>
                  )}
                </div>

                {/* Selector de Ubicación */}
                {model.domicilio ? (
                  <div className="flex gap-2 mb-3 p-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <button
                      onClick={() => setSelectedLocation('sede')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold tracking-wide transition-colors ${
                        selectedLocation === 'sede'
                          ? 'bg-primary text-background shadow-sm shadow-primary/30 border border-primary'
                          : 'bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground border border-transparent'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 ${
                        selectedLocation === 'sede' ? 'text-background' : 'text-primary'
                      }`} />
                      <span>En Sede</span>
                    </button>
                    <button
                      onClick={() => setSelectedLocation('domicilio')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold tracking-wide transition-colors ${
                        selectedLocation === 'domicilio'
                          ? 'bg-primary text-background shadow-sm shadow-primary/30 border border-primary'
                          : 'bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground border border-transparent'
                      }`}
                    >
                      <Home className={`w-3.5 h-3.5 ${
                        selectedLocation === 'domicilio' ? 'text-background' : 'text-primary'
                      }`} />
                      <span>A Domicilio</span>
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-amber-950/20 rounded-lg border border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-200 mb-1">
                          Servicios únicamente en sede
                        </p>
                        <p className="text-xs text-amber-300/80">
                          Esta modelo atiende exclusivamente en {model.location}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MOSAICO DE TARIFAS COMPACTO */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {model.services.map((service, idx) => {
                    const isSelected = selectedService?.name === service.name;
                    
                    // FILTRADO CORRECTO DE SERVICIOS
                    if (model.domicilio && selectedLocation === 'domicilio' && !service.priceHome) {
                      return null;
                    }
                    
                    const precioMostrado = model.domicilio 
                      ? (selectedLocation === 'sede' ? service.price : service.priceHome)
                      : service.price;
                    
                    if (!precioMostrado) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedService(service)}
                        className={`flex flex-col justify-between p-2 rounded-lg transition-colors cursor-default border ${
                          isSelected
                            ? 'bg-primary/20 border-primary shadow-sm'
                            : 'bg-primary/5 border-primary/10 hover:border-primary/30 hover:bg-primary/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-medium text-xs truncate ${
                            isSelected ? 'text-primary' : 'text-foreground/90'
                          }`}>
                            {service.name}
                          </p>
                          <div className="flex items-center text-[10px] text-muted-foreground opacity-70">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {service.duration}
                          </div>
                        </div>
                        
                        <p className={`text-sm font-bold text-right mt-1 ${
                          isSelected ? 'text-primary' : 'text-primary/80'
                        }`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          ${precioMostrado}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer con precio base y botón */}
              <div className="p-4 border-t border-primary/10 bg-background/60 backdrop-blur-md mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-0.5 text-primary">Desde</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-primary">$</span>
                      <span className="text-2xl font-black tracking-tighter text-foreground">
                        {(() => {
                          const prices = model.services
                            .map(s => {
                              const p = selectedLocation === 'domicilio' && s.priceHome ? s.priceHome : s.price;
                              return parseInt(String(p).replace(/[^0-9]/g, '')) || 0;
                            })
                            .filter(p => p > 0);
                          return prices.length > 0 ? Math.min(...prices).toLocaleString('es-CO') : '---';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onContact(model)}
                  className="w-full py-4 rounded-xl font-bold text-[13px] uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-black hover:shadow-[0_0_20px_rgba(184,134,11,0.4)] active:scale-95"
                >
                  ◆ Reservar ahora
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Galería con Mosaico Responsivo */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Botón cerrar - Ahora DENTRO del contenedor y VISIBLE */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Galería de {model.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {model.gallery.length} fotos disponibles • Click en una foto para verla en pantalla completa
                </p>
              </div>
              <Button
                onClick={() => setShowGallery(false)}
                variant="outline"
                size="icon"
                className="border-primary/30 hover:bg-primary/20 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenedor con scroll */}
            <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl border border-primary/20 p-6 overflow-y-auto flex-1">
              {/* Mosaico de fotos con Masonry */}
              <Masonry 
                columnsCount={columnCount} 
                gutter={window.innerWidth < 640 ? '8px' : window.innerWidth < 1024 ? '12px' : '16px'}
              >
                {model.gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl overflow-hidden cursor-default shadow-lg hover:shadow-2xl relative group ${
                      selectedImage === idx
                        ? 'ring-4 ring-primary'
                        : 'hover:ring-2 hover:ring-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedImage(idx);
                      setShowFullscreen(true);
                    }}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`${model.name} - Foto ${idx + 1}`}
                      className="w-full h-auto object-cover"
                    />
                    {/* Overlay con ícono de zoom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ))}
              </Masonry>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fullscreen para ver imagen individual */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          {/* Botón cerrar */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(false);
            }}
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 border-white/30 bg-black/50 hover:bg-black/70 text-white z-10"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Botón anterior */}
          {model.gallery.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) => (prev > 0 ? prev - 1 : model.gallery.length - 1));
              }}
              variant="outline"
              size="icon"
              className="absolute left-4 border-white/30 bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {/* Imagen principal */}
          <div 
            className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithFallback
              src={model.gallery[selectedImage]}
              alt={`${model.name} - Foto ${selectedImage + 1}`}
              className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Botón siguiente */}
          {model.gallery.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) => (prev < model.gallery.length - 1 ? prev + 1 : 0));
              }}
              variant="outline"
              size="icon"
              className="absolute right-4 border-white/30 bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}

          {/* Contador de fotos */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            {selectedImage + 1} / {model.gallery.length}
          </div>

          {/* Hint de teclado */}
          <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
            ← → para navegar • ESC para cerrar
          </div>
        </div>
      )}
    </>
  );
}
