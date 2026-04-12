import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

// Interfaz de producto
export interface Producto {
  id: string; // ✅ UUID de Supabase
  nombre: string;
  precioRegular: number;
  precioServicio: number;
  stock: number;
  categoria: string;
  descripcion: string;
  imagen: string;
  created_at?: string;
  updated_at?: string;
}

interface InventoryContextType {
  inventario: Producto[];
  loading: boolean;
  agregarProducto: (producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;
  actualizarProducto: (id: string, producto: Partial<Producto>) => Promise<void>;
  actualizarStock: (id: string, cantidad: number) => Promise<void>;
  recargarProductos: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventario, setInventario] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar productos desde Supabase al inicializar + Realtime
  useEffect(() => {
    cargarProductos();

    // ✅ REALTIME: recargar inventario ante cualquier cambio en productos
    const channel = supabase
      .channel('inventario-productos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        cargarProductos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cargarProductos = async () => {
    try {
      const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando productos:', error);
        setLoading(false);
        return;
      }

      if (productos && productos.length > 0) {
        setInventario(productos);
      } else {
        setInventario([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Agregar nuevo producto a Supabase
  const agregarProducto = async (producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: producto.nombre,
          precioRegular: producto.precioRegular,
          precioServicio: producto.precioServicio,
          stock: producto.stock,
          categoria: producto.categoria,
          descripcion: producto.descripcion || '',
          imagen: producto.imagen || '',
        })
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error agregando producto:', error);
        throw error;
      }

      if (data) {
        // Actualizar estado local
        setInventario(prev => [...prev, data]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado agregando producto:', error);
      throw error;
    }
  };

  // ✅ Eliminar producto de Supabase
  const eliminarProducto = async (id: string) => {
    try {
      
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error eliminando producto:', error);
        throw error;
      }

      // Actualizar estado local
      setInventario(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado eliminando producto:', error);
      throw error;
    }
  };

  // ✅ Actualizar producto en Supabase
  const actualizarProducto = async (id: string, producto: Partial<Producto>) => {
    try {
      
      const datosActualizar: any = {};
      if (producto.nombre !== undefined) datosActualizar.nombre = producto.nombre;
      if (producto.precioRegular !== undefined) datosActualizar.precioRegular = producto.precioRegular;
      if (producto.precioServicio !== undefined) datosActualizar.precioServicio = producto.precioServicio;
      if (producto.stock !== undefined) datosActualizar.stock = producto.stock;
      if (producto.categoria !== undefined) datosActualizar.categoria = producto.categoria;
      if (producto.descripcion !== undefined) datosActualizar.descripcion = producto.descripcion;
      if (producto.imagen !== undefined) datosActualizar.imagen = producto.imagen;
      
      const { data, error } = await supabase
        .from('productos')
        .update(datosActualizar)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando producto:', error);
        throw error;
      }

      if (data) {
        // Actualizar estado local
        setInventario(prev => prev.map(p => p.id === id ? data : p));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado actualizando producto:', error);
      throw error;
    }
  };

  // ✅ Actualizar solo el stock de un producto
  const actualizarStock = async (id: string, cantidad: number) => {
    try {
      
      const { data, error } = await supabase
        .from('productos')
        .update({ stock: cantidad })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando stock:', error);
        throw error;
      }

      if (data) {
        // Actualizar estado local
        setInventario(prev => prev.map(p => p.id === id ? data : p));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado actualizando stock:', error);
      throw error;
    }
  };

  const contextValue: InventoryContextType = {
    inventario,
    loading,
    agregarProducto,
    eliminarProducto,
    actualizarProducto,
    actualizarStock,
    recargarProductos: cargarProductos,
  };

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    // Retornar valores por defecto seguros durante hot-reload
    return {
      inventario: [],
      loading: true,
      agregarProducto: async () => {},
      eliminarProducto: async () => {},
      actualizarProducto: async () => {},
      actualizarStock: async () => {},
      recargarProductos: async () => {},
    };
  }
  return context;
}
