import { useState, useCallback, useRef } from 'react';
import { Calendar, Clock, MapPin, Star, Heart, MessageCircle, Filter, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useModelos } from './ModelosContext';
import { useAgendamientos } from './AgendamientosContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface ModelosGalleryProps {
  onSelectModelo: (modeloEmail: string) => void;
}

const TARIFAS_DOMICILIO = [
  { horas: 1, precio: 250000 },
  { horas: 2, precio: 480000 },
  { horas: 3, precio: 690000 },
  { horas: 6, precio: 1200000 },
  { horas: 8, precio: 1500000 },
  { horas: 12, precio: 2000000 },
  { horas: 24, precio: 2500000 },
];

const GOLD = ['#d4af37', '#e5c158', '#ffd700', '#f0d060', '#c9a227'];

interface GoldSparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  tx: number;
  ty: number;
  color: string;
  duration: number;
}

// Hook de lucetas doradas
function useGoldSparkles() {
  const [sparkles, setSparkles] = useState<GoldSparkle[]>([]);
  const lastTime = useRef(0);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const now = Date.now();
    if (now - lastTime.current < 90) return;
    lastTime.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s: GoldSparkle = {
      id: `${now}-${Math.random()}`,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: Math.random() * 16 + 8,
      tx: (Math.random() - 0.5) * 60,
      ty: -(Math.random() * 55 + 20),
      color: GOLD[Math.floor(Math.random() * GOLD.length)],
      duration: Math.random() * 300 + 550,
    };

    setSparkles(prev => [...prev.slice(-12), s]);
    setTimeout(() => setSparkles(prev => prev.filter(p => p.id !== s.id)), s.duration);
  }, []);

  const onMouseLeave = useCallback(() => setSparkles([]), []);

  return { sparkles, onMouseMove, onMouseLeave };
}

// SVG luceta (estrella de 4 puntas)
function SparkleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <path
        d="M80 7C80 7 74 36 68 56C62 76 40 92 7 80C40 68 62 84 68 104C74 124 80 153 80 153C80 153 86 124 92 104C98 84 120 68 153 80C120 92 98 76 92 56C86 36 80 7 80 7Z"
        fill={color}
      />
    </svg>
  );
}

// Tarjeta de modelo con lucetas
function ModeloCardItem({
  modelo,
  proximasCitas,
  onSelectModelo,
}: {
  modelo: any;
  proximasCitas: any[];
  onSelectModelo: (email: string) => void;
}) {
  const { sparkles, onMouseMove, onMouseLeave } = useGoldSparkles();

  return (
    <Card
      className="group relative bd-gold-card bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border border-amber-500/20 overflow-hidden cursor-pointer bd-card-enter"
      onClick={() => onSelectModelo(modelo.email)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Lucetas */}
      {sparkles.map(s => (
        <div
          key={s.id}
          className="bd-sparkle"
          style={{
            left: s.x,
            top: s.y,
            '--s-tx': `${s.tx}px`,
            '--s-ty': `${s.ty}px`,
          } as React.CSSProperties}
        >
          <SparkleIcon size={s.size} color={s.color} />
        </div>
      ))}

      <CardContent className="p-0">
        {/* Imagen principal */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <ImageWithFallback
            src={modelo.fotoPerfil}
            alt={modelo.nombreArtistico}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />

          {/* Overlay gold */}
          <div className="absolute inset-0 bd-gold-overlay" />

          {/* Halo dorado en hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.18) 0%, transparent 65%)' }}
          />

          {/* Badge disponibilidad */}
          <div className="absolute top-4 right-4 z-10">
            {modelo.disponible ? (
              <Badge className="bg-black/70 text-amber-400 border border-amber-500/60 backdrop-blur-sm font-semibold shadow-lg shadow-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse inline-block" />
                Disponible
              </Badge>
            ) : (
              <Badge className="bg-black/70 text-red-400 border border-red-500/40 backdrop-blur-sm font-semibold">
                Ocupada
              </Badge>
            )}
          </div>

          {/* Badge domicilio */}
          {modelo.domicilio && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-black/70 text-amber-300 border border-amber-500/50 backdrop-blur-sm font-semibold shadow-md">
                🏠 Domicilio
              </Badge>
            </div>
          )}

          {/* Info en overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
            <h3 className="text-2xl font-bold mb-1 bd-gold-shimmer"
              style={{ fontFamily: 'Playfair Display, serif' }}>
              {modelo.nombreArtistico}
            </h3>

            <div className="flex items-center gap-3 text-sm text-amber-200/80 mb-2">
              <span>{modelo.edad} años</span>
              {modelo.altura && <span>· {modelo.altura}</span>}
              {modelo.medidas && <span>· {modelo.medidas}</span>}
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
              ))}
              <span className="text-xs text-amber-300/70 ml-1">4.8</span>
            </div>

            {modelo.sede && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300/70">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{modelo.sede}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de tarjeta */}
        <div className="p-4 bg-gradient-to-b from-black to-neutral-950 border-t border-amber-500/10">
          {modelo.descripcion && (
            <p className="text-amber-200/50 text-xs mb-3 line-clamp-2 leading-relaxed">
              {modelo.descripcion}
            </p>
          )}

          {proximasCitas.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs text-amber-500/60 mb-1.5">Próximas citas:</p>
              <div className="space-y-1">
                {proximasCitas.slice(0, 2).map((cita, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-amber-300/60">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{new Date(cita.fecha).toLocaleDateString('es-CO')} – {cita.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Sin citas próximas
              </Badge>
            </div>
          )}

          <Button
            onClick={(e) => { e.stopPropagation(); onSelectModelo(modelo.email); }}
            className="w-full bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-black font-bold gap-2 shadow-lg shadow-amber-900/40 transition-all duration-300 hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            <Calendar className="w-4 h-4" />
            Agendar Cita
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelosGallery({ onSelectModelo }: ModelosGalleryProps) {
  const { modelos } = useModelos();
  const { agendamientos } = useAgendamientos();
  const [selectedModelo, setSelectedModelo] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<'todas' | 'disponibles' | 'ocupadas'>('disponibles');
  const [filterServicio, setFilterServicio] = useState<'todos' | 'sede' | 'domicilio'>('todos');

  const modelosActivas = modelos.filter(m => m.activa && !m.fechaArchivado);

  const modelosFiltradas = modelosActivas.filter(modelo => {
    if (filterDisponibilidad === 'disponibles' && !modelo.disponible) return false;
    if (filterDisponibilidad === 'ocupadas' && modelo.disponible) return false;
    if (filterServicio === 'sede' && !modelo.sede) return false;
    if (filterServicio === 'domicilio' && !modelo.domicilio) return false;
    return true;
  });

  const getProximasCitas = (modeloEmail: string) => {
    const hoy = new Date();
    return agendamientos
      .filter(a => a.modeloEmail === modeloEmail && a.estado !== 'cancelado' && a.estado !== 'completado' && new Date(a.fecha) >= hoy)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  };

  const formatPrecio = (precio: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);

  return (
    <div className="w-full min-h-screen bg-black p-4 md:p-8">
      {/* Fondo con destellos de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h1 className="text-3xl md:text-4xl font-bold bd-gold-shimmer"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                Nuestras Modelos
              </h1>
            </div>
            <p className="text-amber-500/60 text-sm">
              {modelosFiltradas.length} modelos disponibles
            </p>
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-black font-bold gap-2 shadow-lg shadow-amber-900/30 transition-all duration-300"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {/* Divisor dorado */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mb-6" />

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-black/80 border border-amber-500/20 rounded-xl backdrop-blur-sm mb-6 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-amber-500/70 mb-2 block uppercase tracking-widest">Disponibilidad</label>
                <Select value={filterDisponibilidad} onValueChange={(v: any) => setFilterDisponibilidad(v)}>
                  <SelectTrigger className="bg-black/60 border-amber-500/30 text-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-amber-500/30 text-amber-200">
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="disponibles">Disponibles ahora</SelectItem>
                    <SelectItem value="ocupadas">Ocupadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-amber-500/70 mb-2 block uppercase tracking-widest">Tipo de servicio</label>
                <Select value={filterServicio} onValueChange={(v: any) => setFilterServicio(v)}>
                  <SelectTrigger className="bg-black/60 border-amber-500/30 text-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-amber-500/30 text-amber-200">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sede">Solo sede</SelectItem>
                    <SelectItem value="domicilio">A domicilio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid de modelos */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {modelosFiltradas.map((modelo, idx) => (
          <div key={modelo.id} style={{ animationDelay: `${idx * 60}ms` }}>
            <ModeloCardItem
              modelo={modelo}
              proximasCitas={getProximasCitas(modelo.email)}
              onSelectModelo={(email) => setSelectedModelo(modelo)}
            />
          </div>
        ))}
      </div>

      {/* Modal de detalle */}
      {selectedModelo && (
        <Dialog open={!!selectedModelo} onOpenChange={() => setSelectedModelo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-neutral-950 via-black to-neutral-950 border border-amber-500/30 shadow-2xl shadow-amber-900/20">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold bd-gold-shimmer"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                {selectedModelo.nombreArtistico}
              </DialogTitle>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mt-2" />
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Galería */}
              <div>
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4 border border-amber-500/20 shadow-lg shadow-amber-900/20">
                  <ImageWithFallback
                    src={selectedModelo.fotoPerfil}
                    alt={selectedModelo.nombreArtistico}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedModelo.fotosAdicionales?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedModelo.fotosAdicionales.slice(0, 6).map((foto: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-amber-500/10 hover:border-amber-500/40 transition-colors">
                        <ImageWithFallback
                          src={foto}
                          alt={`${selectedModelo.nombreArtistico} ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="mb-5">
                  <div className="flex items-center gap-3 text-amber-200/70 mb-3 text-sm">
                    <span>{selectedModelo.edad} años</span>
                    {selectedModelo.altura && <span>· {selectedModelo.altura}</span>}
                    {selectedModelo.medidas && <span>· {selectedModelo.medidas}</span>}
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
                    ))}
                    <span className="text-amber-300/60 ml-2 text-sm">4.8 (124 reseñas)</span>
                  </div>
                  {selectedModelo.descripcion && (
                    <p className="text-amber-100/50 text-sm leading-relaxed mb-4">{selectedModelo.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedModelo.disponible && (
                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30">Disponible ahora</Badge>
                    )}
                    {selectedModelo.domicilio && (
                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30">Servicio a domicilio</Badge>
                    )}
                    {selectedModelo.sede && (
                      <Badge className="bg-amber-900/20 text-amber-300/70 border border-amber-500/20">{selectedModelo.sede}</Badge>
                    )}
                  </div>
                </div>

                {/* Servicios sede */}
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-widest">Servicios en Sede</h4>
                  <div className="space-y-2">
                    {(selectedModelo.serviciosDisponibles || []).map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-neutral-900/60 rounded-lg border border-amber-500/15 hover:border-amber-500/35 transition-colors">
                        <div>
                          <p className="text-white text-sm font-medium">{s.name}</p>
                          <p className="text-amber-500/50 text-xs">{s.duration}</p>
                        </div>
                        <p className="text-amber-400 font-bold">{s.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarifas domicilio */}
                {selectedModelo.domicilio && (
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-widest">Tarifas a Domicilio</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {TARIFAS_DOMICILIO.map((t, idx) => (
                        <div key={idx} className="p-3 bg-neutral-900/60 rounded-lg border border-amber-500/15 hover:border-amber-500/35 transition-colors text-center">
                          <p className="text-amber-200 font-medium text-sm">{t.horas}h</p>
                          <p className="text-amber-400 font-bold text-sm">{formatPrecio(t.precio)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => { onSelectModelo(selectedModelo.email); setSelectedModelo(null); }}
                    className="flex-1 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-black font-bold gap-2 shadow-lg shadow-amber-900/30 transition-all duration-300"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Cita
                  </Button>
                  <Button variant="outline" className="border-amber-500/40 hover:bg-amber-500/10 text-amber-400 hover:border-amber-400 transition-all">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="border-amber-500/40 hover:bg-amber-500/10 text-amber-400 hover:border-amber-400 transition-all">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sin modelos */}
      {modelosFiltradas.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-20">
          <Sparkles className="w-12 h-12 text-amber-500/30 mx-auto mb-4" />
          <p className="text-amber-500/50 text-lg mb-4">No hay modelos disponibles con los filtros seleccionados</p>
          <Button
            onClick={() => { setFilterDisponibilidad('todas'); setFilterServicio('todos'); }}
            variant="outline"
            className="border-amber-500/40 hover:bg-amber-500/10 text-amber-400"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
