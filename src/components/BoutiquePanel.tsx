import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, DollarSign, Image as ImageIcon, ShoppingBag, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useInventory } from '../src/app/components/InventoryContext';
import { GestionBoutiqueModal } from './GestionBoutiqueModal';
import { toast } from 'sonner@2.0.3';

interface Producto {
  id: number;
  nombre: string;
  precioRegular: number;
  precioServicio: number;
  stock: number;
  categoria: string;
  descripcion: string;
  imagen: string;
}

export function BoutiquePanel() {
  const { inventario, eliminarProducto } = useInventory();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

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
  const productosFiltrados = inventario.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             producto.descripcion.toLowerCase().includes(busqueda.toLowerCase());
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
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
      eliminarProducto(producto.id);
      toast.success('Producto eliminado');
    }
  };

  // Calcular estadísticas
  const totalProductos = inventario.length;
  const totalStock = inventario.reduce((sum, p) => sum + p.stock, 0);
  const valorInventario = inventario.reduce((sum, p) => sum + (p.precioRegular * p.stock), 0);
  const productosConStockBajo = inventario.filter(p => p.stock <= 5).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gestión de Boutique</h2>
            <p className="text-muted-foreground mt-1">
              Administra el inventario de productos para venta
            </p>
          </div>
          <Button onClick={handleNuevoProducto} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total Productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProductos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Total Stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStock}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${valorInventario.toLocaleString('es-CO')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Package className="w-4 h-4 text-yellow-500" />
                Stock Bajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{productosConStockBajo}</div>
              <p className="text-xs text-muted-foreground mt-1">productos ≤ 5 unidades</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'Todas' ? 'Todas las categorías' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de productos */}
        {productosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {inventario.length === 0 ? 'No hay productos en la boutique' : 'No se encontraron productos'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {inventario.length === 0 
                  ? 'Comienza agregando tu primer producto a la boutique'
                  : 'Intenta con otros términos de búsqueda o filtros'}
              </p>
              {inventario.length === 0 && (
                <Button onClick={handleNuevoProducto} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((producto) => (
              <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Imagen */}
                <div className="relative h-48 bg-secondary flex items-center justify-center overflow-hidden">
                  {producto.imagen ? (
                    <img 
                      src={producto.imagen} 
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Sin imagen</p>
                    </div>
                  )}
                  
                  {/* Badge de stock bajo */}
                  {producto.stock <= 5 && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      Stock Bajo
                    </Badge>
                  )}
                  
                  {/* Badge de sin stock */}
                  {producto.stock === 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Sin Stock
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-1">{producto.nombre}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1">
                      {producto.categoria}
                    </Badge>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Descripción */}
                  {producto.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {producto.descripcion}
                    </p>
                  )}

                  {/* Precios */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground mb-1">Regular</p>
                      <p className="font-bold text-green-500">
                        ${producto.precioRegular.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground mb-1">En Servicio</p>
                      <p className="font-bold text-primary">
                        ${producto.precioServicio.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="p-2 bg-secondary rounded text-center">
                    <p className="text-xs text-muted-foreground mb-1">Stock Disponible</p>
                    <p className={`font-bold text-lg ${
                      producto.stock === 0 ? 'text-red-500' :
                      producto.stock <= 5 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {producto.stock} unidades
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditarProducto(producto)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
    </>
  );
}
