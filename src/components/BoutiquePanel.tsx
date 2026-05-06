import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Pencil, Trash2, Package, 
  Image as ImageIcon, ShoppingBag, Search, Filter,
  History, BarChart3, TrendingUp, PieChart as PieChartIcon,
  Download, Eye, Calendar, User, Receipt, X, Check, RefreshCw
} from 'lucide-react';
import { supabase } from '../utils/supabase/info';
import { useAgendamientos } from '../app/components/AgendamientosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useInventory, Producto } from '../app/components/InventoryContext';
import { useCarrito, Compra } from '../app/components/CarritoContext';
import { GestionBoutiqueModal } from './GestionBoutiqueModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

type TabType = 'inventario' | 'ventas' | 'pedidos' | 'analytics';

interface BoutiquePanelProps {
  accessToken?: string;
  userId?: string;
}

export function BoutiquePanel({ accessToken: _accessToken, userId: _userId }: BoutiquePanelProps = {}) {
  const { inventario, eliminarProducto } = useInventory();
  const { compras, cargarTodasLasCompras } = useCarrito();
  const [activeTab, setActiveTab] = useState<TabType>('inventario');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Compra | null>(null);

  // Estados para Pedidos Boutique
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [pedidoARechazar, setPedidoARechazar] = useState<any>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState<string | null>(null);
  const { recargarProductos } = useInventory();

  // Cargar todas las compras al montar si estamos en modo admin
  useEffect(() => {
    cargarTodasLasCompras();
    cargarPedidosBoutique();
    
    // Suscripción Realtime para pedidos nuevos
    const channel = supabase
      .channel('admin-boutique-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_boutique' }, () => {
        cargarPedidosBoutique();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cargarPedidosBoutique = async () => {
    setLoadingPedidos(true);
    try {
      const { data, error } = await supabase
        .from('ventas_boutique')
        .select('*, modelo:usuarios!modelo_id(nombreArtistico, email)')
        .order('fecha', { ascending: false });
      if (error) throw error;
      setPedidosPendientes(data || []);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const handleAceptarPedido = async (pedido: any) => {
    setProcesandoAccion(pedido.id);
    try {
      // 1. Obtener stock actual
      const { data: prod } = await supabase.from('inventario_boutique').select('stock, nombre').eq('id', pedido.producto_id).single();
      if (!prod || prod.stock < pedido.cantidad) {
        toast.error(`Stock insuficiente para ${prod?.nombre || 'el producto'}`);
        return;
      }

      // 2. Transacción: Actualizar pedido, descontar stock y registrar gasto
      const { error: errorUpdate } = await supabase
        .from('ventas_boutique')
        .update({ 
          estado: 'aceptado', 
          aceptado_en: new Date().toISOString(),
          aceptado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', pedido.id);
      
      if (errorUpdate) throw errorUpdate;

      // Descontar stock
      await supabase.rpc('increment_inventory_stock', { 
        row_id: pedido.producto_id, 
        increment_by: -pedido.cantidad 
      });

      // Registrar en gastos (como una salida de inventario / costo)
      await supabase.from('gastos').insert({
        tipo: 'operativo',
        categoria: 'inventario_boutique',
        monto: pedido.total,
        descripcion: `Venta Boutique: ${pedido.cantidad}x ${pedido.producto_nombre} (Modelo: ${pedido.modelo?.nombreArtistico || 'N/A'})`,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        estado: 'pagado'
      });

      // Notificar a la modelo
      await supabase.from('notificaciones').insert({
        usuario_id: pedido.modelo_id,
        titulo: '✅ Pedido Aprobado',
        mensaje: `Tu pedido de ${pedido.producto_nombre} ha sido aprobado. Puedes pasar a recogerlo.`,
        tipo: 'pedido_boutique',
        leida: false
      });

      toast.success('Pedido aprobado correctamente');
      recargarProductos();
      cargarPedidosBoutique();
    } catch (err) {
      toast.error('Error al procesar la aprobación');
    } finally {
      setProcesandoAccion(null);
    }
  };

  const handleRechazarPedido = async () => {
    if (!pedidoARechazar || !motivoRechazo.trim()) {
      toast.error('Debes ingresar un motivo');
      return;
    }
    setProcesandoAccion(pedidoARechazar.id);
    try {
      const { error } = await supabase
        .from('ventas_boutique')
        .update({ 
          estado: 'rechazado', 
          rechazado_en: new Date().toISOString(),
          motivo_rechazo: motivoRechazo
        })
        .eq('id', pedidoARechazar.id);
      
      if (error) throw error;

      // Notificar a la modelo
      await supabase.from('notificaciones').insert({
        usuario_id: pedidoARechazar.modelo_id,
        titulo: '❌ Pedido Rechazado',
        mensaje: `Tu pedido de ${pedidoARechazar.producto_nombre} ha sido rechazado. Motivo: ${motivoRechazo}`,
        tipo: 'pedido_boutique',
        leida: false
      });

      toast.success('Pedido rechazado');
      setPedidoARechazar(null);
      setMotivoRechazo('');
      cargarPedidosBoutique();
    } catch (err) {
      toast.error('Error al procesar el rechazo');
    } finally {
      setProcesandoAccion(null);
    }
  };

  const categorias = [
    'Todas',
    'Bebidas',
    'Snacks',
    'Cigarrillos',
    'Preservativos',
    'Lubricantes',
    'Juguetes',
    'Accesorios',
    'Ropa Interior',
    'Otro',
  ];

  // Filtrar productos
  const productosFiltrados = inventario.filter(p => p != null).filter(producto => {
    const coincideBusqueda = (producto.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                             (producto.descripcion || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const handleNuevoProducto = () => {
    setProductoEditar(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditar(producto);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleEliminarProducto = (producto: Producto) => {
    setProductoEliminar(producto);
  };

  const confirmarEliminar = () => {
    if (productoEliminar) {
      eliminarProducto(productoEliminar.id);
      toast.success('Producto eliminado');
      setProductoEliminar(null);
    }
  };

  // ==================== ANALYTICS DATA ====================
  
  const analyticsData = useMemo(() => {
    // 1. Top productos vendidos
    const productosMap = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();
    
    compras.forEach(compra => {
      compra.items.forEach(item => {
        const current = productosMap.get(item.productoId) || { nombre: item.nombre || 'Producto', cantidad: 0, ingresos: 0 };
        productosMap.set(item.productoId, {
          ...current,
          cantidad: current.cantidad + (item.cantidad || 0),
          ingresos: current.ingresos + ((item.precio || 0) * (item.cantidad || 0))
        });
      });
    });

    const topProductos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // 2. Ventas por categoría
    const categoriasMap = new Map<string, number>();
    inventario.forEach(p => {
      // const _actual = categoriasMap.get(p.categoria) || 0;
      // Aquí necesitaríamos los vendidos reales de las compras, pero para simplicidad:
      const totalVendidoCat = compras.reduce((sum, c) => {
        const itemsCat = (c.items || []).filter(i => i.categoria === p.categoria);
        return sum + itemsCat.reduce((s, i) => s + ((i.precio || 0) * (i.cantidad || 0)), 0);
      }, 0);
      categoriasMap.set(p.categoria, totalVendidoCat);
    });

    const ventasPorCategoria = Array.from(categoriasMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // 3. Tendencia de ventas (últimos 7 días)
      const tendenciaVentas = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const ventasDia = compras.filter(c => {
          if (!c.fecha) return false;
          const f = typeof c.fecha === 'string' ? c.fecha.split('T')[0] : c.fecha.toISOString().split('T')[0];
          return f === fechaStr;
        });

        return {
          fecha: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          total: (ventasDia || []).reduce((sum, v) => sum + (v.total || 0), 0),
          cantidad: (ventasDia || []).length
        };
      }).reverse();

    return { topProductos, ventasPorCategoria, tendenciaVentas };
  }, [compras, inventario]);

  const COLORS = ['#D4AF37', '#C9A961', '#B8956A', '#A6845C', '#8C6F4C'];

  // Calcular estadísticas
  const totalProductos = inventario.filter(p => p != null).length;
  // const _totalStock = inventario.filter(p => p != null).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  // const _valorInventario = inventario.filter(p => p != null).reduce((sum, p) => sum + ((p.precioRegular || 0) * (Number(p.stock) || 0)), 0);
  // const _productosConStockBajo = inventario.filter(p => p != null && (Number(p.stock) || 0) <= 5).length;
  // const _ingresosTotales = compras.filter(c => c != null).reduce((sum, c) => sum + (c.total || 0), 0);
  // const _totalVentasCount = compras.filter(c => c != null).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header con Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              BOUTIQUE <span className="text-primary">& PREMIUM</span>
            </h2>
            <p className="text-muted-foreground mt-1">
              Control centralizado de inventario, ventas y analítica
            </p>
          </div>
          
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-primary/10">
            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventario' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventario
            </button>
            <button
              onClick={() => setActiveTab('ventas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ventas' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Ventas
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'pedidos' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Pedidos
              {pedidosPendientes.filter(p => p.estado === 'pendiente').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center p-0 rounded-full text-[10px] font-bold">
                  {pedidosPendientes.filter(p => p.estado === 'pendiente').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'inventario' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Inventario */}
            <div className="flex items-center justify-between bg-card/30 p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Control de Existencias</h3>
                  <p className="text-xs text-muted-foreground">{totalProductos} productos en catálogo</p>
                </div>
              </div>
              <Button onClick={handleNuevoProducto} className="bg-primary hover:bg-primary/90 text-black font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            {/* Buscador y Filtros */}
            <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-primary/10">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 bg-background/50 border-white/10"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background/50 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none cursor-pointer"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#1a1b1e]">
                        {cat === 'Todas' ? 'Todas las categorías' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            {productosFiltrados.length === 0 ? (
              <Card className="bg-card/20 border-dashed border-primary/20">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-primary/30" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Ajusta los filtros de búsqueda o agrega un nuevo producto para comenzar.
                  </p>
                  {inventario.length === 0 && (
                    <Button onClick={handleNuevoProducto} className="bg-primary hover:bg-primary/90 text-black font-bold">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primer Producto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosFiltrados.map((producto) => (
                  <Card key={producto.id} className="overflow-hidden bg-card/40 border-primary/10 hover:border-primary/30 transition-all hover:shadow-2xl group">
                    {/* Imagen */}
                    <div className="relative h-56 bg-secondary flex items-center justify-center overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <ImageIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground/40">Sin imagen de producto</p>
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {producto.stock <= 5 && producto.stock > 0 && (
                          <Badge className="bg-yellow-500/90 text-black font-bold shadow-lg backdrop-blur-sm">
                            Stock Bajo
                          </Badge>
                        )}
                        {producto.stock === 0 && (
                          <Badge className="bg-red-500/90 text-white font-bold shadow-lg backdrop-blur-sm">
                            Sin Stock
                          </Badge>
                        )}
                        {producto.precioInicial && producto.precioFinal && producto.precioInicial > producto.precioFinal && (
                          <Badge className="bg-primary text-black font-bold shadow-lg backdrop-blur-sm">
                            -{Math.round(((producto.precioInicial - producto.precioFinal) / producto.precioInicial) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] to-transparent opacity-60"></div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="outline" className="bg-black/50 border-primary/30 text-primary backdrop-blur-md">
                          {producto.categoria}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{producto.nombre}</CardTitle>
                      {producto.descripcion && (
                        <CardDescription className="line-clamp-1 text-xs">
                          {producto.descripcion}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Precios */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">PVP</p>
                          <div className="flex flex-col">
                            {producto.precioInicial && producto.precioFinal && producto.precioInicial > 0 ? (
                              <>
                                <span className="text-[10px] text-muted-foreground/50 line-through">
                                  ${(producto.precioInicial || 0).toLocaleString('es-CO')}
                                </span>
                                <span className="font-bold text-primary text-lg leading-tight">
                                  ${(producto.precioFinal || 0).toLocaleString('es-CO')}
                                </span>
                              </>
                            ) : (
                              <p className="font-bold text-white text-lg leading-tight">
                                ${(producto.precioRegular || 0).toLocaleString('es-CO')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <p className="text-[10px] text-primary/70 uppercase tracking-widest mb-1">En Servicio</p>
                          <p className="font-bold text-primary text-lg leading-tight">
                            ${(producto.precioServicio || 0).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xs text-muted-foreground">Disponibilidad</span>
                        <span className={`font-bold ${
                          producto.stock === 0 ? 'text-red-400' :
                          producto.stock <= 5 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {producto.stock} uds
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-white/10 hover:bg-primary hover:text-black transition-all font-bold"
                          onClick={() => handleEditarProducto(producto)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="w-12 border-white/10 text-red-400 hover:bg-red-500/10 transition-all"
                          onClick={() => handleEliminarProducto(producto)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ventas' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card className="bg-card/50 border-primary/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <CardTitle>Historial de Ventas</CardTitle>
                  <CardDescription>Registro completo de transacciones realizadas</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-primary/20">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-muted-foreground text-left">
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Fecha / Hora</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Modelo</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Productos</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Método</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px] text-right">Total</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px] text-center">Estado</th>
                        <th className="p-4 font-medium uppercase tracking-wider text-[10px] text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {compras.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-muted-foreground">
                            No se registran ventas aún.
                          </td>
                        </tr>
                      ) : (
                        compras.map((venta) => (
                          <tr key={venta.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-primary" />
                                <div>
                                  <p className="font-medium text-white">
                                    {(() => {
                                      const d = new Date(venta.fecha);
                                      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-CO');
                                    })()}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {(() => {
                                      const d = new Date(venta.fecha);
                                      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{venta.modeloNombre}</span>
                              </div>
                            </td>
                            <td className="p-4 max-w-[200px]">
                              <p className="truncate text-xs">
                                {venta.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                              </p>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="bg-white/5 border-primary/20 text-primary">
                                {venta.metodoPago}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-bold text-white">
                              ${(venta.total || 0).toLocaleString('es-CO')}
                            </td>
                            <td className="p-4 text-center">
                              <Badge className={
                                venta.estado === 'completada' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                venta.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                'bg-red-500/20 text-red-400 border-red-500/20'
                              }>
                                {venta.estado.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => setVentaSeleccionada(venta)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitudes de Boutique</CardTitle>
                <CardDescription>Gestión de pedidos realizados por las modelos</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={cargarPedidosBoutique} disabled={loadingPedidos}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingPedidos ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidosPendientes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/5 rounded-xl">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No hay pedidos registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-white/10">
                          <th className="pb-3 pl-2">Fecha</th>
                          <th className="pb-3">Modelo</th>
                          <th className="pb-3">Producto</th>
                          <th className="pb-3">Cantidad</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Estado</th>
                          <th className="pb-3 pr-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pedidosPendientes.map((pedido) => (
                          <tr key={pedido.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-4 pl-2 text-xs text-muted-foreground">
                              {new Date(pedido.fecha).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-white">{pedido.modelo?.nombreArtistico || 'Modelo'}</span>
                                <span className="text-[10px] text-muted-foreground">{pedido.modelo?.email}</span>
                              </div>
                            </td>
                            <td className="py-4 text-white font-medium">{pedido.producto_nombre}</td>
                            <td className="py-4 text-center">{pedido.cantidad}</td>
                            <td className="py-4 font-bold text-primary">{formatCOP(pedido.total)}</td>
                            <td className="py-4">
                              <Badge className={`
                                ${pedido.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500' : 
                                  pedido.estado === 'aceptado' ? 'bg-green-500/10 text-green-500' : 
                                  'bg-red-500/10 text-red-500'}
                              `}>
                                {pedido.estado}
                              </Badge>
                            </td>
                            <td className="py-4 pr-2 text-right">
                              {pedido.estado === 'pendiente' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                    onClick={() => handleAceptarPedido(pedido)}
                                    disabled={procesandoAccion === pedido.id}
                                  >
                                    {procesandoAccion === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="h-8 px-2"
                                    onClick={() => setPedidoARechazar(pedido)}
                                    disabled={procesandoAccion === pedido.id}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Procesado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por Categoría */}
              <Card className="bg-card/50 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Ingresos por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.ventasPorCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.ventasPorCategoria.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #333', borderRadius: '8px' }}
                        formatter={(value: number) => `$${(value || 0).toLocaleString('es-CO')}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Productos */}
              <Card className="bg-card/50 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Top 5 Productos Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.topProductos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="nombre" stroke="#888" fontSize={10} interval={0} />
                      <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => (val || 0).toLocaleString()} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #333', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                        formatter={(value: number) => [`${(value || 0).toLocaleString()} uds`, 'Cantidad']}
                      />
                      <Bar dataKey="cantidad" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Unidades Vendidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tendencia de Ingresos */}
              <Card className="bg-card/50 border-primary/10 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tendencia de Ingresos (Últimos 7 días)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.tendenciaVentas}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="fecha" stroke="#888" fontSize={10} />
                      <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `$${((val || 0) / 1000).toLocaleString()}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #333', borderRadius: '8px' }}
                        formatter={(value: number) => `$${(value || 0).toLocaleString('es-CO')}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#D4AF37" 
                        strokeWidth={3} 
                        dot={{ fill: '#D4AF37', r: 4 }} 
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        name="Ingresos Diarios"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de Venta Modal */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#121318] border border-primary/20 rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl overflow-x-hidden custom-scrollbar">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-tighter">Detalle de Transacción</h3>
                  <p className="text-[10px] text-primary/70 font-mono">{ventaSeleccionada.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setVentaSeleccionada(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Modelo</p>
                  <p className="font-medium text-white">{ventaSeleccionada.modeloNombre}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase">Fecha</p>
                  <p className="font-medium text-white">
                    {(() => {
                      const d = new Date(ventaSeleccionada.fecha);
                      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Método de Pago</p>
                  <p className="font-medium text-white">{ventaSeleccionada.metodoPago}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase">Estado</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                    {ventaSeleccionada.estado.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase font-bold border-b border-white/5 pb-2">Productos</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {ventaSeleccionada.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white/5 p-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold">x{item.cantidad}</span>
                        <span className="text-white/90">{item.nombre}</span>
                      </div>
                      <span className="font-medium">${((item.precio || 0) * (item.cantidad || 0)).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Monto Total</span>
                  <span className="text-2xl font-bold text-primary">${(ventaSeleccionada.total || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button onClick={() => setVentaSeleccionada(null)} className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 rounded-xl">
                Cerrar Detalle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión */}
      <GestionBoutiqueModal
        open={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoEditar(null);
        }}
        producto={productoEditar}
        modo={modoModal}
      />

      {/* Alerta de Eliminación */}
      <AlertDialog open={!!productoEliminar} onOpenChange={(open) => !open && setProductoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{productoEliminar?.nombre}" del inventario de la boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmarEliminar}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Motivo de Rechazo */}
      <AlertDialog open={!!pedidoARechazar} onOpenChange={(open) => !open && setPedidoARechazar(null)}>
        <AlertDialogContent className="bg-[#1a1b1e] border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Rechazar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor indica el motivo del rechazo para informar a la modelo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Ej: Producto no disponible en este momento..."
              rows={4}
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleRechazarPedido(); }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
