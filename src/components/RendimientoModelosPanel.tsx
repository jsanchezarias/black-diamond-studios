import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Star, DollarSign, Clock, ShoppingBag, Award, ArrowUpDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useModelos } from '../src/app/components/ModelosContext';
import { useServicios } from '../src/app/components/ServiciosContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type SortOption = 'ingresos' | 'servicios' | 'rating' | 'nombre';
type PeriodoOption = 'semana' | 'mes' | 'trimestre' | 'año';

interface RendimientoModelo {
  id: number;
  nombre: string;
  fotoPerfil: string;
  totalServicios: number;
  totalIngresos: number;
  ingresosPromedio: number;
  tiempoPromedioServicio: number;
  consumoPromedio: number;
  productosVendidos: number;
  rating: number;
  tendencia: 'up' | 'down' | 'stable';
  serviciosPorTipo: Record<string, number>;
  ingresosMensuales: Array<{ mes: string; ingresos: number }>;
}

export function RendimientoModelosPanel() {
  const { modelos } = useModelos();
  const { serviciosFinalizados } = useServicios();
  
  const [sortBy, setSortBy] = useState<SortOption>('ingresos');
  const [periodo, setPeriodo] = useState<PeriodoOption>('mes');
  const [modeloSeleccionado, setModeloSeleccionado] = useState<number | null>(null);

  const COLORS = ['#d4af37', '#b8960f', '#8b7220', '#f0d875', '#9d8534'];

  // Calcular rendimiento de cada modelo
  const rendimientos = useMemo<RendimientoModelo[]>(() => {
    return modelos.map(modelo => {
      const serviciosModelo = serviciosFinalizados.filter(s => s.modeloEmail === modelo.email);
      
      const totalServicios = serviciosModelo.length;
      const totalIngresos = serviciosModelo.reduce((sum, s) => 
        sum + s.costoServicio + s.costoAdicionales + s.costoConsumo, 0
      );
      const ingresosPromedio = totalServicios > 0 ? totalIngresos / totalServicios : 0;
      
      const consumoPromedio = totalServicios > 0 
        ? serviciosModelo.reduce((sum, s) => sum + s.costoConsumo, 0) / totalServicios 
        : 0;
      
      // Calcular servicios por tipo
      const serviciosPorTipo: Record<string, number> = {};
      serviciosModelo.forEach(s => {
        serviciosPorTipo[s.tipoServicio] = (serviciosPorTipo[s.tipoServicio] || 0) + 1;
      });

      // Simular rating basado en desempeño
      const rating = totalServicios > 0 
        ? Math.min(5, 3 + (totalServicios / 50) + (ingresosPromedio / 500000)) 
        : 0;

      // Simular tendencia
      const tendencia: 'up' | 'down' | 'stable' = 
        totalServicios > 10 ? 'up' : totalServicios > 5 ? 'stable' : 'down';

      // Simular datos mensuales (últimos 6 meses)
      const meses = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
      const ingresosMensuales = meses.map((mes, idx) => ({
        mes,
        ingresos: totalIngresos * (0.6 + (idx * 0.08)) / 6
      }));

      return {
        id: modelo.id,
        nombre: modelo.nombreArtistico || modelo.nombre,
        fotoPerfil: modelo.fotoPerfil,
        totalServicios,
        totalIngresos,
        ingresosPromedio,
        tiempoPromedioServicio: 75, // minutos promedio
        consumoPromedio,
        productosVendidos: Math.floor(totalServicios * 1.5),
        rating: parseFloat(rating.toFixed(1)),
        tendencia,
        serviciosPorTipo,
        ingresosMensuales
      };
    });
  }, [modelos, serviciosFinalizados]);

  // Ordenar modelos según criterio seleccionado
  const rendimientosOrdenados = useMemo(() => {
    const sorted = [...rendimientos];
    
    switch (sortBy) {
      case 'ingresos':
        return sorted.sort((a, b) => b.totalIngresos - a.totalIngresos);
      case 'servicios':
        return sorted.sort((a, b) => b.totalServicios - a.totalServicios);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'nombre':
        return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
      default:
        return sorted;
    }
  }, [rendimientos, sortBy]);

  // Top 3 modelos
  const top3Modelos = rendimientosOrdenados.slice(0, 3);

  // Datos para gráfico comparativo
  const datosComparativos = rendimientosOrdenados.slice(0, 8).map(r => ({
    nombre: r.nombre.split(' ')[0],
    servicios: r.totalServicios,
    ingresos: r.totalIngresos / 1000000 // en millones
  }));

  // Modelo seleccionado para detalles
  const modeloDetalle = modeloSeleccionado 
    ? rendimientos.find(r => r.id === modeloSeleccionado) 
    : null;

  const datosServiciosPorTipo = modeloDetalle 
    ? Object.entries(modeloDetalle.serviciosPorTipo).map(([tipo, cantidad]) => ({
        name: tipo,
        value: cantidad
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top 3 Podio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3Modelos.map((modelo, index) => {
          const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          const borderColor = index === 0 ? 'border-yellow-500' : index === 1 ? 'border-gray-400' : 'border-amber-700';
          
          return (
            <Card 
              key={modelo.id} 
              className={`border-2 ${borderColor} bg-gradient-to-br from-card to-card/50 relative overflow-hidden`}
            >
              <div className="absolute top-2 right-2 text-4xl opacity-20">
                {medalla}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={modelo.fotoPerfil} 
                    alt={modelo.nombreArtistico || modelo.nombre}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{modelo.nombreArtistico || modelo.nombre}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{modelo.rating}</span>
                      <Badge className="ml-2 bg-primary/20 text-primary text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-bold text-primary">
                    ${(modelo.totalIngresos / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Servicios</span>
                  <span className="font-bold">{modelo.totalServicios}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Promedio</span>
                  <span className="font-bold text-green-400">
                    ${(modelo.ingresosPromedio / 1000).toFixed(0)}K
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controles de ordenamiento y filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Rendimiento por Modelo</CardTitle>
              <CardDescription>Análisis detallado de desempeño y métricas</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ingresos">Mayor Ingreso</option>
                  <option value="servicios">Más Servicios</option>
                  <option value="rating">Mejor Rating</option>
                  <option value="nombre">Nombre A-Z</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as PeriodoOption)}
                  className="px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="trimestre">Trimestre</option>
                  <option value="año">Este Año</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabla de rendimiento */}
          <div className="space-y-3">
            {rendimientosOrdenados.map((modelo, index) => (
              <div 
                key={modelo.id}
                className="p-4 bg-secondary/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setModeloSeleccionado(modelo.id === modeloSeleccionado ? null : modelo.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Ranking */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex-shrink-0">
                    <span className="font-bold text-primary">#{index + 1}</span>
                  </div>

                  {/* Foto y nombre */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img 
                      src={modelo.fotoPerfil} 
                      alt={modelo.nombreArtistico || modelo.nombre}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{modelo.nombreArtistico || modelo.nombre}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm">{modelo.rating}</span>
                        </div>
                        {modelo.tendencia === 'up' && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Crecimiento
                          </Badge>
                        )}
                        {modelo.tendencia === 'down' && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Bajo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="hidden md:grid md:grid-cols-4 gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
                      <p className="font-bold text-primary">
                        ${(modelo.totalIngresos / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Servicios</p>
                      <p className="font-bold">{modelo.totalServicios}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Promedio</p>
                      <p className="font-bold text-green-400">
                        ${(modelo.ingresosPromedio / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Consumo</p>
                      <p className="font-bold text-blue-400">
                        ${(modelo.consumoPromedio / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>

                  {/* Métricas móvil */}
                  <div className="md:hidden grid grid-cols-2 gap-2 flex-shrink-0 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <p className="font-bold text-primary text-sm">
                        ${(modelo.totalIngresos / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Servicios</p>
                      <p className="font-bold text-sm">{modelo.totalServicios}</p>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {modeloSeleccionado === modelo.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    {/* Estadísticas detalladas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ingreso/Servicio</p>
                          <p className="font-bold">${(modelo.ingresosPromedio / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tiempo Prom.</p>
                          <p className="font-bold">{modelo.tiempoPromedioServicio} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                        <ShoppingBag className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Productos</p>
                          <p className="font-bold">{modelo.productosVendidos}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                          <p className="font-bold">{modelo.rating}/5.0</p>
                        </div>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Gráfico de ingresos mensuales */}
                      <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                        <h4 className="text-sm font-medium mb-3">Tendencia de Ingresos (6 meses)</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={modelo.ingresosMensuales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="mes" 
                              stroke="#888"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              stroke="#888"
                              style={{ fontSize: '12px' }}
                              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1a1a24', 
                                border: '1px solid #d4af37',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Ingresos']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="ingresos" 
                              stroke="#d4af37" 
                              strokeWidth={2}
                              dot={{ fill: '#d4af37', r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Gráfico de servicios por tipo */}
                      {datosServiciosPorTipo.length > 0 && (
                        <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                          <h4 className="text-sm font-medium mb-3">Distribución de Servicios</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={datosServiciosPorTipo}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {datosServiciosPorTipo.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1a1a24', 
                                  border: '1px solid #d4af37',
                                  borderRadius: '8px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {rendimientosOrdenados.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay datos de rendimiento disponibles</p>
              <p className="text-sm text-muted-foreground mt-2">
                Las estadísticas aparecerán cuando se completen servicios
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico comparativo general */}
      {rendimientosOrdenados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativa General</CardTitle>
            <CardDescription>Top 8 modelos por servicios e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosComparativos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="nombre" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a24', 
                    border: '1px solid #d4af37',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'ingresos') return [`$${value.toFixed(2)}M`, 'Ingresos'];
                    return [value, 'Servicios'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="servicios" fill="#8b7220" name="Servicios" />
                <Bar yAxisId="right" dataKey="ingresos" fill="#d4af37" name="Ingresos (M)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}