import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, MapPin, Clock, ChevronRight, Check, X, Heart, MessageCircle, ZoomIn, ChevronLeft, Send, Building2, Home } from 'lucide-react';

// ── Lucetas doradas ──────────────────────────────────────────
const GOLD_COLORS = ['#d4af37', '#e5c158', '#ffd700', '#f0d060', '#c9a227'];

interface GoldSparkle { id: string; x: number; y: number; size: number; tx: number; ty: number; color: string; }

function useGoldSparkles() {
  const [sparkles, setSparkles] = useState<GoldSparkle[]>([]);
  const lastTime = useRef(0);
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const now = Date.now();
    if (now - lastTime.current < 85) return;
    lastTime.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const s: GoldSparkle = {
      id: `${now}-${Math.random()}`,
      x: (e.clientX - rect.left) + (Math.random() - 0.5) * 50,
      y: (e.clientY - rect.top) + (Math.random() - 0.5) * 50,
      size: Math.random() * 14 + 7,
      tx: (Math.random() - 0.5) * 60,
      ty: -(Math.random() * 55 + 20),
      color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
    };
    setSparkles(prev => [...prev.slice(-12), s]);
    setTimeout(() => setSparkles(prev => prev.filter(p => p.id !== s.id)), 750);
  }, []);
  const onMouseLeave = useCallback(() => setSparkles([]), []);
  return { sparkles, onMouseMove, onMouseLeave };
}

function SparkleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <path d="M80 7C80 7 74 36 68 56C62 76 40 92 7 80C40 68 62 84 68 104C74 124 80 153 80 153C80 153 86 124 92 104C98 84 120 68 153 80C120 92 98 76 92 56C86 36 80 7 80 7Z" fill={color} />
    </svg>
  );
}
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
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
  onContact: () => void;
}

export function ModelCard({ model, onContact }: ModelCardProps) {
  const { sparkles, onMouseMove: onPhotoMouseMove, onMouseLeave: onPhotoMouseLeave } = useGoldSparkles();
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'sede' | 'domicilio'>('sede');
  const [columnCount, setColumnCount] = useState(2); // Solo para el modal de galería completa
  const [imageOrientations, setImageOrientations] = useState<('horizontal' | 'vertical' | 'square')[]>([]); // Track orientación de cada imagen
  const [showFullscreen, setShowFullscreen] = useState(false); // Nuevo estado para fullscreen
  const [rightColumnHeight, setRightColumnHeight] = useState<number | null>(null); // Altura de la columna derecha
  const rightColumnRef = useRef<HTMLDivElement>(null); // Referencia a la columna derecha
  const headerRef = useRef<HTMLDivElement>(null); // Referencia al header de la galería

  // Determinar si la descripción es larga (más de 150 caracteres)
  const isLongDescription = model.description.length > 150;

  // Detectar orientación de imágenes al cargar
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
      setImageOrientations(orientations);
    };

    loadImageOrientations();
  }, [model.gallery]);

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

  // Función para abrir Telegram con mensaje personalizado
  const handleReservar = () => {
    let mensaje = '';
    
    if (selectedService) {
      // Mensaje con servicio seleccionado
      // Si la modelo NO hace domicilio, siempre usar precio de sede y ubicación en sede
      const precioSeleccionado = model.domicilio 
        ? (selectedLocation === 'sede' ? selectedService.price : (selectedService.priceHome || selectedService.price))
        : selectedService.price;
      const ubicacion = model.domicilio 
        ? (selectedLocation === 'sede' ? 'En Sede' : 'A Domicilio')
        : 'En Sede';
      
      mensaje = `Hola! 👋\\n\\n` +
                `Quiero reservar con *${model.name}*\\n\\n` +
                `📋 *Servicio:* ${selectedService.name}\\n` +
                `⏱️ *Duración:* ${selectedService.duration}\\n` +
                `📍 *Ubicación:* ${ubicacion}\\n` +
                `💰 *Tarifa:* $${precioSeleccionado}\\n\\n` +
                `¿Cómo puedo confirmar la reserva?`;
    } else {
      // Mensaje sin servicio seleccionado
      mensaje = `Hola! 👋\\n\\nQuiero reservar con *${model.name}*\\n\\n¿Podrían enviarme más información sobre disponibilidad y tarifas?`;
    }
    
    window.open(`https://t.me/BlackDiamondScorts?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

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
  useEffect(() => {
    const updateHeights = () => {
      const rightCol = rightColumnRef.current;
      const headerEl = headerRef.current;
      
      if (rightCol && headerEl) {
        const rightHeight = rightCol.offsetHeight;
        const headerHeight = headerEl.offsetHeight;
        const galleryHeight = rightHeight - headerHeight - 32; // 32px de padding
        
        setRightColumnHeight(galleryHeight);
      }
    };

    // Actualizar al montar y cuando cambie el contenido
    updateHeights();
    
    // Actualizar en resize
    window.addEventListener('resize', updateHeights);
    
    // Actualizar después de que las imágenes carguen
    const timer = setTimeout(updateHeights, 100);
    
    return () => {
      window.removeEventListener('resize', updateHeights);
      clearTimeout(timer);
    };
  }, [model, selectedService, showFullDescription, selectedLocation]);

  return (
    <>
      <Card className="border-primary/15 bg-gradient-card shadow-card hover:shadow-premium hover:border-primary/25 transition-all duration-500 overflow-hidden w-full group">
        <CardContent className="p-0">
          {/* Layout Vertical optimizado para cuadrícula (Grid) */}
          <div className="flex flex-col">
            {/* Cabecera: Foto de perfil + Info básica */}
            <div className="w-full flex-shrink-0 flex flex-col border-b border-primary/10">
              {/* Header con foto de perfil */}
              <div
                ref={headerRef}
                className="relative bg-gradient-to-br from-black to-neutral-950 p-6 backdrop-blur-sm flex-shrink-0 overflow-hidden"
                onMouseMove={onPhotoMouseMove}
                onMouseLeave={onPhotoMouseLeave}
              >
                {/* Lucetas en el header */}
                {sparkles.map(s => (
                  <div key={s.id} className="bd-sparkle" style={{ left: s.x, top: s.y, '--s-tx': `${s.tx}px`, '--s-ty': `${s.ty}px` } as React.CSSProperties}>
                    <SparkleIcon size={s.size} color={s.color} />
                  </div>
                ))}
                <div className="flex items-start gap-5">
                  {/* Foto de perfil circular */}
                  <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-lg shadow-amber-500/20 bd-gold-photo-border group-hover:border-amber-500/60 transition-all duration-500">
                      <ImageWithFallback
                        src={model.photo}
                        alt={model.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {model.available && (
                      <div className="absolute bottom-1 right-1 w-7 h-7 bg-amber-400 rounded-full border-4 border-black animate-pulse shadow-lg shadow-amber-400/60"></div>
                    )}
                  </div>

                  {/* Info básica */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-3xl font-bold mb-1 bd-gold-shimmer" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {model.name}
                        </h3>
                        <p className="text-base text-muted-foreground">{model.age} años</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border border-primary/30 shadow-sm hover:shadow-md transition-shadow">
                        <Star className="w-3 h-3 mr-1 fill-primary" />
                        {model.rating}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="border-primary/30 text-xs backdrop-blur-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {model.location}
                      </Badge>
                      {model.available ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shadow-sm">
                          Disponible Ahora
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-muted text-xs">
                          Ocupada
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Galería - LIMITADA por la altura restante disponible */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Galería de Fotos
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGallery(true)}
                    className="text-primary hover:text-primary/80 text-xs"
                  >
                    Ver todas <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                
                {/* Scroll contenedor con altura calculada dinámicamente */}
                <div 
                  className="overflow-y-auto pr-1"
                  style={{
                    maxHeight: '300px'
                  }}
                >
                  <div 
                    className="grid gap-2"
                    style={{
                      // Grid adaptativo: 3 columnas en desktop, 2 en tablet, 1 en mobile
                      gridTemplateColumns: model.gallery.length === 1 
                        ? '1fr' 
                        : 'repeat(3, 1fr)',
                      // Auto flow dense para llenar espacios vacíos
                      gridAutoFlow: 'dense',
                      gridAutoRows: 'minmax(80px, auto)', // Filas adaptativas
                    }}
                  >
                    {model.gallery.slice(0, 9).map((img, idx) => {
                      const orientation = imageOrientations[idx] || 'square';
                      
                      // Determinar si una foto vertical debe ocupar 2 filas
                      // (solo si hay suficientes fotos y no es la última)
                      const shouldSpanTwoRows = orientation === 'vertical' && 
                                                model.gallery.length > 4 && 
                                                idx < model.gallery.length - 1;
                      
                      return (
                        <div
                          key={idx}
                          className={`rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] transform shadow-md hover:shadow-xl relative group ${
                            // Fotos horizontales ocupan 2 columnas
                            orientation === 'horizontal' && model.gallery.length > 2 
                              ? 'col-span-2' 
                              : 'col-span-1'
                          } ${
                            // Fotos verticales pueden ocupar 2 filas para llenar espacio
                            shouldSpanTwoRows ? 'row-span-2' : ''
                          }`}
                          onClick={() => {
                            setSelectedImage(idx);
                            setShowGallery(true);
                          }}
                        >
                          {/* Imagen con aspect ratio natural según orientación */}
                          <ImageWithFallback
                            src={img}
                            alt={`${model.name} - Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                            style={{
                              // Aspect ratio natural según orientación
                              // Para row-span-2, usar h-full para llenar el espacio
                              aspectRatio: shouldSpanTwoRows 
                                ? 'auto' 
                                : orientation === 'horizontal' 
                                ? '16/9' 
                                : orientation === 'vertical'
                                ? '3/4'
                                : '1/1'
                            }}
                          />
                          {/* Overlay sutil en hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Hint si hay más fotos */}
                  {model.gallery.length > 9 && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        +{model.gallery.length - 9} fotos más • Click en "Ver todas"
                      </p>
                    </div>
                  )}
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
                      <ChevronRight className={`w-3 h-3 transition-transform ${showFullDescription ? 'rotate-90' : ''}`} />
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
                  // ✅ Modelo PRESTA servicio a domicilio - Mostrar selector
                  <div className="flex gap-2 mb-3 p-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <button
                      onClick={() => setSelectedLocation('sede')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-300 ${
                        selectedLocation === 'sede'
                          ? 'bg-primary text-background shadow-sm shadow-primary/30 border border-primary'
                          : 'bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground border border-transparent'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 transition-all ${
                        selectedLocation === 'sede' ? 'text-background' : 'text-primary'
                      }`} />
                      <span>En Sede</span>
                    </button>
                    <button
                      onClick={() => setSelectedLocation('domicilio')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-300 ${
                        selectedLocation === 'domicilio'
                          ? 'bg-primary text-background shadow-sm shadow-primary/30 border border-primary'
                          : 'bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground border border-transparent'
                      }`}
                    >
                      <Home className={`w-3.5 h-3.5 transition-all ${
                        selectedLocation === 'domicilio' ? 'text-background' : 'text-primary'
                      }`} />
                      <span>A Domicilio</span>
                    </button>
                  </div>
                ) : (
                  // ❌ Modelo NO hace domicilios - Mostrar aviso
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
                        className={`flex flex-col justify-between p-2 rounded-lg transition-all cursor-pointer border ${
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

              {/* Tarifas adicionales y botón */}
              <div className="p-3 bg-gradient-to-br from-primary/5 to-transparent border-t border-primary/10">
                {selectedService && (
                  <div className="mb-2 p-2 bg-primary/10 rounded-lg border border-primary/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-primary">{selectedService.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {selectedLocation === 'sede' ? (
                          <><Building2 className="w-2.5 h-2.5 text-primary" /> En Sede</>
                        ) : (
                          <><Home className="w-2.5 h-2.5 text-primary" /> A Domicilio</>
                        )}
                      </p>
                    </div>
                    <p className="text-base font-bold text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ${selectedLocation === 'sede' ? selectedService.price : (selectedService.priceHome || selectedService.price)}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleReservar}
                  className={`w-full gap-2 h-9 text-xs transition-all ${
                    selectedService 
                      ? 'bg-primary text-background hover:bg-primary/90 shadow-md shadow-primary/20 scale-[1.02]' 
                      : 'bg-primary/20 text-primary hover:bg-primary/30'
                  }`}
                  size="sm"
                >
                  <Send className="w-3 h-3" />
                  {selectedService ? `Confirmar Reserva` : `Selecciona un servicio`}
                </Button>
                {!selectedService && (
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Selecciona un servicio para habilitar la reserva
                  </p>
                )}
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
                    className={`rounded-xl overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-2xl relative group ${
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