import { useState } from 'react';
import { DollarSign, Plus, TrendingUp, Calendar, Filter, CheckCircle, XCircle, Clock, Eye, Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useGastos } from '../src/app/components/GastosContext';
import { AgregarGastoModal } from './AgregarGastoModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GastosOperativosPanelProps {
  userEmail: string;
}

export function GastosOperativosPanel({ userEmail }: GastosOperativosPanelProps) {
  const { 
    gastosOperativos, 
    aprobarGasto, 
    rechazarGasto, 
    eliminarGasto,
    obtenerTotalGastosMes,
    obtenerTotalGastosPorCategoria 
  } = useGastos();
  
  const [mostrarAgregarGasto, setMostrarAgregarGasto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  // Filtrar gastos
  const gastosFiltrados = gastosOperativos.filter(gasto => {
    if (filtroEstado !== 'todos' && gasto.estado !== filtroEstado) return false;
    if (filtroCategoria !== 'todas' && gasto.categoria !== filtroCategoria) return false;
    return true;
  });

  // Estadísticas
  const totalMesActual = obtenerTotalGastosMes(mesActual, anioActual);
  const totalPendientes = gastosOperativos.filter(g => g.estado === 'pendiente').length;
  const totalAprobados = gastosOperativos.filter(g => g.estado === 'aprobado').length;

  // Datos para gráficos
  const categorias = [
    { id: 'nomina', nombre: 'Nómina', icon: '👥', color: '#d4af37' },
    { id: 'arriendo', nombre: 'Arriendo', icon: '🏢', color: '#8b7355' },
    { id: 'servicios', nombre: 'Servicios', icon: '💡', color: '#6366f1' },
    { id: 'mantenimiento', nombre: 'Mantenimiento', icon: '🔧', color: '#10b981' },
    { id: 'marketing', nombre: 'Marketing', icon: '📢', color: '#f59e0b' },
    { id: 'insumos', nombre: 'Insumos', icon: '📦', color: '#ec4899' },
    { id: 'transporte', nombre: 'Transporte', icon: '🚗', color: '#06b6d4' },
    { id: 'honorarios', nombre: 'Honorarios', icon: '💼', color: '#8b5cf6' },
    { id: 'otros', nombre: 'Otros', icon: '📋', color: '#64748b' },
  ];

  const datosPorCategoria = categorias.map(cat => ({
    nombre: cat.nombre,
    total: obtenerTotalGastosPorCategoria(cat.id),
    color: cat.color,
  })).filter(item => item.total > 0);

  // Gastos por mes (últimos 6 meses)
  const gastosPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(anioActual, mesActual - i, 1);
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    const total = obtenerTotalGastosMes(mes, anio);
    
    gastosPorMes.push({
      mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
      total: total / 1000000, // Convertir a millones
    });
  }

  const handleAprobar = (gastoId: string) => {
    aprobarGasto(gastoId, userEmail);
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const categoriaInfo = (categoriaId: string) => {
    const cat = categorias.find(c => c.id === categoriaId);
    return cat || { nombre: 'Otros', icon: '📋', color: '#64748b' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Gastos Operativos</h2>
          <p className="text-muted-foreground mt-1">Gestión de gastos de la agencia</p>
        </div>
        <Button 
          onClick={() => setMostrarAgregarGasto(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Gasto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Mes Actual</CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${(totalMesActual / 1000000).toFixed(1)}M
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Pendientes Aprobación</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {totalPendientes}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Aprobados</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {totalAprobados}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Gastos</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {gastosOperativos.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Gastos Últimos 6 Meses
            </CardTitle>
            <CardDescription>Evolución mensual en millones (COP)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mes" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #d4af37' }}
                  formatter={(value: any) => `$${value.toFixed(1)}M`}
                />
                <Bar dataKey="total" fill="#d4af37" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gastos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Distribución por Categoría
            </CardTitle>
            <CardDescription>Total aprobado por categoría (COP)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.nombre}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {datosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #d4af37' }}
                  formatter={(value: any) => `$${(value / 1000000).toFixed(2)}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobado">Aprobados</option>
                <option value="rechazado">Rechazados</option>
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Gastos</CardTitle>
          <CardDescription>
            Mostrando {gastosFiltrados.length} de {gastosOperativos.length} gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gastosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay gastos registrados</p>
              </div>
            ) : (
              gastosFiltrados.map((gasto) => {
                const cat = categoriaInfo(gasto.categoria);
                return (
                  <div
                    key={gasto.id}
                    className="bg-secondary/50 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-card border border-border">
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{gasto.concepto}</h3>
                            <p className="text-sm text-muted-foreground">{cat.nombre}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ${(gasto.monto / 1000000).toFixed(2)}M
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(gasto.fecha).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        
                        {gasto.descripcion && (
                          <p className="text-sm text-muted-foreground mb-3">{gasto.descripcion}</p>
                        )}
                        
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {estadoBadge(gasto.estado)}
                            {gasto.comprobante && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                Con comprobante
                              </Badge>
                            )}
                          </div>
                          
                          {gasto.estado === 'pendiente' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAprobar(gasto.id)}
                                className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rechazarGasto(gasto.id)}
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                          
                          {gasto.estado === 'rechazado' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarGasto(gasto.id)}
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Agregar Gasto */}
      <AgregarGastoModal
        isOpen={mostrarAgregarGasto}
        onClose={() => setMostrarAgregarGasto(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
