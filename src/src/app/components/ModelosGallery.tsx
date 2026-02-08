import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, Heart, MessageCircle, Filter, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { useModelos } from './ModelosContext';
import { useAgendamientos } from './AgendamientosContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ModelosGalleryProps {
  onSelectModelo: (modeloEmail: string) => void;
}

// Tarifas a domicilio fijas según el brief
const TARIFAS_DOMICILIO = [
  { horas: 1, precio: 250000 },
  { horas: 2, precio: 480000 },
  { horas: 3, precio: 690000 },
  { horas: 6, precio: 1200000 },
  { horas: 8, precio: 1500000 },
  { horas: 12, precio: 2000000 },
  { horas: 24, precio: 2500000 },
];

export function ModelosGallery({ onSelectModelo }: ModelosGalleryProps) {
  const { modelos } = useModelos();
  const { agendamientos } = useAgendamientos();
  const [selectedModelo, setSelectedModelo] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<'todas' | 'disponibles' | 'ocupadas'>('disponibles');
  const [filterServicio, setFilterServicio] = useState<'todos' | 'sede' | 'domicilio'>('todos');

  // Filtrar solo modelos activas y no archivadas
  const modelosActivas = modelos.filter(m => m.activa && !m.fechaArchivado);

  // Aplicar filtros
  const modelosFiltradas = modelosActivas.filter(modelo => {
    // Filtro de disponibilidad
    if (filterDisponibilidad === 'disponibles' && !modelo.disponible) return false;
    if (filterDisponibilidad === 'ocupadas' && modelo.disponible) return false;

    // Filtro de servicio
    if (filterServicio === 'sede' && !modelo.sede) return false;
    if (filterServicio === 'domicilio' && !modelo.domicilio) return false;

    return true;
  });

  // Función para obtener próximas citas de una modelo
  const getProximasCitas = (modeloEmail: string) => {
    const hoy = new Date();
    return agendamientos
      .filter(a => 
        a.modeloEmail === modeloEmail && 
        a.estado !== 'cancelado' && 
        a.estado !== 'completado' &&
        new Date(a.fecha) >= hoy
      )
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  };

  // Función para formatear precio en pesos colombianos
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black p-4 md:p-8">
      {/* Header con filtros */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 mb-2">
              Nuestras Modelos
            </h1>
            <p className="text-gray-400 font-montserrat">
              {modelosFiltradas.length} modelos disponibles
            </p>
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-semibold gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <Card className="bg-neutral-900/50 border-amber-500/20 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Disponibilidad</label>
                  <Select value={filterDisponibilidad} onValueChange={(v: any) => setFilterDisponibilidad(v)}>
                    <SelectTrigger className="bg-black/50 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-amber-500/30">
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="disponibles">Disponibles ahora</SelectItem>
                      <SelectItem value="ocupadas">Ocupadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Tipo de servicio</label>
                  <Select value={filterServicio} onValueChange={(v: any) => setFilterServicio(v)}>
                    <SelectTrigger className="bg-black/50 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-amber-500/30">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="sede">Solo sede</SelectItem>
                      <SelectItem value="domicilio">A domicilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grid de modelos */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelosFiltradas.map((modelo) => {
          const proximasCitas = getProximasCitas(modelo.email);
          const servicios = modelo.serviciosDisponibles || [];

          return (
            <Card
              key={modelo.id}
              className="group bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border-amber-500/20 hover:border-amber-500/60 transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-amber-500/20"
              onClick={() => setSelectedModelo(modelo)}
            >
              <CardContent className="p-0">
                {/* Imagen principal */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <ImageWithFallback
                    src={modelo.fotoPerfil}
                    alt={modelo.nombreArtistico}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Overlay con gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 right-4">
                    {modelo.disponible ? (
                      <Badge className="bg-green-500/90 text-white font-semibold backdrop-blur-sm">
                        Disponible
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/90 text-white font-semibold backdrop-blur-sm">
                        Ocupada
                      </Badge>
                    )}
                  </div>

                  {/* Badge de servicio a domicilio */}
                  {modelo.domicilio && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-amber-500/90 text-black font-semibold backdrop-blur-sm">
                        🏠 Domicilio
                      </Badge>
                    </div>
                  )}

                  {/* Info en overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-playfair font-bold mb-1">
                      {modelo.nombreArtistico}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                      <span>{modelo.edad} años</span>
                      {modelo.altura && <span>• {modelo.altura}</span>}
                      {modelo.medidas && <span>• {modelo.medidas}</span>}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-300 ml-2">4.8</span>
                    </div>

                    {/* Sede */}
                    {modelo.sede && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{modelo.sede}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="p-4">
                  {/* Descripción corta */}
                  {modelo.descripcion && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {modelo.descripcion}
                    </p>
                  )}

                  {/* Próximas disponibilidades */}
                  {proximasCitas.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Próximas citas:</p>
                      <div className="space-y-1">
                        {proximasCitas.map((cita, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{new Date(cita.fecha).toLocaleDateString('es-CO')} - {cita.hora}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Sin citas próximas
                      </Badge>
                    </div>
                  )}

                  {/* Botón de agendar */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModelo(modelo.email);
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-semibold gap-2 group"
                  >
                    <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Agendar Cita
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de detalle de modelo */}
      {selectedModelo && (
        <Dialog open={!!selectedModelo} onOpenChange={() => setSelectedModelo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-3xl font-playfair text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600">
                {selectedModelo.nombreArtistico}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Galería de fotos */}
              <div>
                <div className="aspect-[3/4] rounded-lg overflow-hidden mb-4">
                  <ImageWithFallback
                    src={selectedModelo.fotoPerfil}
                    alt={selectedModelo.nombreArtistico}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Fotos adicionales */}
                {selectedModelo.fotosAdicionales && selectedModelo.fotosAdicionales.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedModelo.fotosAdicionales.slice(0, 6).map((foto: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                        <ImageWithFallback
                          src={foto}
                          alt={`${selectedModelo.nombreArtistico} ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Información y servicios */}
              <div>
                {/* Info básica */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 text-gray-300 mb-4">
                    <span>{selectedModelo.edad} años</span>
                    {selectedModelo.altura && <span>• {selectedModelo.altura}</span>}
                    {selectedModelo.medidas && <span>• {selectedModelo.medidas}</span>}
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                      />
                    ))}
                    <span className="text-gray-300 ml-2">4.8 (124 reseñas)</span>
                  </div>

                  {selectedModelo.descripcion && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {selectedModelo.descripcion}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedModelo.disponible && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Disponible ahora
                      </Badge>
                    )}
                    {selectedModelo.domicilio && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Servicio a domicilio
                      </Badge>
                    )}
                    {selectedModelo.sede && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {selectedModelo.sede}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Servicios disponibles */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-amber-400 mb-3">Servicios en Sede</h4>
                  <div className="space-y-2">
                    {(selectedModelo.serviciosDisponibles || []).map((servicio: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-neutral-900/50 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                      >
                        <div>
                          <p className="text-white font-medium">{servicio.name}</p>
                          <p className="text-gray-400 text-xs">{servicio.duration}</p>
                        </div>
                        <p className="text-amber-400 font-semibold">{servicio.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarifas a domicilio */}
                {selectedModelo.domicilio && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-amber-400 mb-3">Tarifas a Domicilio</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {TARIFAS_DOMICILIO.map((tarifa, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-neutral-900/50 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors text-center"
                        >
                          <p className="text-white font-medium">{tarifa.horas}h</p>
                          <p className="text-amber-400 font-semibold text-sm">{formatPrecio(tarifa.precio)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      onSelectModelo(selectedModelo.email);
                      setSelectedModelo(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-semibold gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Cita
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-500/50 hover:bg-amber-500/10 text-amber-400"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-500/50 hover:bg-amber-500/10 text-amber-400"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mensaje si no hay modelos */}
      {modelosFiltradas.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-gray-400 text-lg mb-4">
            No hay modelos disponibles con los filtros seleccionados
          </p>
          <Button
            onClick={() => {
              setFilterDisponibilidad('todas');
              setFilterServicio('todos');
            }}
            variant="outline"
            className="border-amber-500/50 hover:bg-amber-500/10 text-amber-400"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
