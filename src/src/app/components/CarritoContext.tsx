import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface ItemCarrito {
  id: string; // ✅ UUID de Supabase
  productoId: string; // ✅ UUID del producto
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  categoria: string;
}

export interface Compra {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  items: ItemCarrito[];
  subtotal: number;
  total: number;
  metodoPago: 'Efectivo' | 'QR' | 'Nequi' | 'Daviplata' | 'Datafono' | 'Tarjeta';
  comprobantePago?: string;
  fecha: Date | string;
  estado: 'completada' | 'pendiente' | 'cancelada';
}

interface CarritoContextType {
  carrito: ItemCarrito[];
  compras: Compra[];
  agregarAlCarrito: (item: Omit<ItemCarrito, 'id' | 'cantidad'>, modeloEmail: string) => Promise<void>;
  eliminarDelCarrito: (id: string) => Promise<void>;
  actualizarCantidad: (id: string, cantidad: number) => Promise<void>;
  vaciarCarrito: (modeloEmail: string) => Promise<void>;
  obtenerTotal: () => number;
  finalizarCompra: (modeloEmail: string, modeloNombre: string, metodoPago: string, comprobantePago?: string) => Promise<void>;
  obtenerComprasPorModelo: (modeloEmail: string) => Compra[];
  cargarCarrito: (modeloEmail: string) => Promise<void>;
  cargarCompras: (modeloEmail: string) => Promise<void>;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar carrito desde Supabase
  const cargarCarrito = async (modeloEmail: string) => {
    try {
      console.log('🛒 Cargando carrito desde Supabase para:', modeloEmail);
      
      const { data, error } = await supabase
        .from('carrito_items')
        .select(`
          id,
          producto_id,
          cantidad,
          precio_unitario,
          inventario (
            nombre,
            imagen,
            categoria
          )
        `)
        .eq('modelo_email', modeloEmail);

      if (error) {
        console.error('❌ Error cargando carrito:', error);
        return;
      }

      if (data) {
        const carritoFormateado: ItemCarrito[] = data.map(item => ({
          id: item.id,
          productoId: item.producto_id,
          nombre: item.inventario?.nombre || 'Producto',
          precio: parseFloat(item.precio_unitario),
          cantidad: item.cantidad,
          imagen: item.inventario?.imagen || '',
          categoria: item.inventario?.categoria || '',
        }));

        setCarrito(carritoFormateado);
        console.log(`✅ ${carritoFormateado.length} items en carrito`);
      }
    } catch (error) {
      console.error('❌ Error cargando carrito:', error);
    }
  };

  // ✅ Cargar compras desde Supabase
  const cargarCompras = async (modeloEmail: string) => {
    try {
      console.log('📦 Cargando compras desde Supabase para:', modeloEmail);
      
      const { data: comprasData, error: comprasError } = await supabase
        .from('compras')
        .select('*')
        .eq('modelo_email', modeloEmail)
        .order('fecha', { ascending: false });

      if (comprasError) {
        console.error('❌ Error cargando compras:', error);
        return;
      }

      if (comprasData) {
        // Cargar items de cada compra
        const comprasConItems = await Promise.all(
          comprasData.map(async (compra) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('compras_items')
              .select('*')
              .eq('compra_id', compra.id);

            const items: ItemCarrito[] = itemsData
              ? itemsData.map(item => ({
                  id: item.id,
                  productoId: item.producto_id || '',
                  nombre: item.nombre,
                  precio: parseFloat(item.precio),
                  cantidad: item.cantidad,
                  imagen: item.imagen || '',
                  categoria: item.categoria || '',
                }))
              : [];

            return {
              id: compra.id,
              modeloEmail: compra.modelo_email,
              modeloNombre: compra.modelo_nombre,
              items,
              subtotal: parseFloat(compra.subtotal),
              total: parseFloat(compra.total),
              metodoPago: compra.metodo_pago as any,
              comprobantePago: compra.comprobante_pago,
              fecha: compra.fecha,
              estado: compra.estado as any,
            };
          })
        );

        setCompras(comprasConItems);
        console.log(`✅ ${comprasConItems.length} compras cargadas`);
      }
    } catch (error) {
      console.error('❌ Error cargando compras:', error);
    }
  };

  // ✅ Agregar al carrito
  const agregarAlCarrito = async (item: Omit<ItemCarrito, 'id' | 'cantidad'>, modeloEmail: string) => {
    try {
      console.log('➕ Agregando al carrito:', item.nombre);
      
      // Verificar si el producto ya está en el carrito
      const { data: existente, error: errorExistente } = await supabase
        .from('carrito_items')
        .select('*')
        .eq('modelo_email', modeloEmail)
        .eq('producto_id', item.productoId)
        .single();

      if (existente && !errorExistente) {
        // Incrementar cantidad
        const { error } = await supabase
          .from('carrito_items')
          .update({ cantidad: existente.cantidad + 1 })
          .eq('id', existente.id);

        if (error) throw error;
        console.log('✅ Cantidad incrementada');
      } else {
        // Crear nuevo item
        const { error } = await supabase
          .from('carrito_items')
          .insert({
            modelo_email: modeloEmail,
            producto_id: item.productoId,
            cantidad: 1,
            precio_unitario: item.precio,
          });

        if (error) throw error;
        console.log('✅ Item agregado al carrito');
      }

      await cargarCarrito(modeloEmail);
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      throw error;
    }
  };

  // ✅ Eliminar del carrito
  const eliminarDelCarrito = async (id: string) => {
    try {
      console.log('🗑️ Eliminando del carrito:', id);
      
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCarrito(prev => prev.filter(i => i.id !== id));
      console.log('✅ Item eliminado del carrito');
    } catch (error) {
      console.error('❌ Error eliminando del carrito:', error);
      throw error;
    }
  };

  // ✅ Actualizar cantidad
  const actualizarCantidad = async (id: string, cantidad: number) => {
    try {
      if (cantidad <= 0) {
        await eliminarDelCarrito(id);
        return;
      }

      console.log('🔄 Actualizando cantidad:', cantidad);
      
      const { error } = await supabase
        .from('carrito_items')
        .update({ cantidad })
        .eq('id', id);

      if (error) throw error;

      setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
      console.log('✅ Cantidad actualizada');
    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
      throw error;
    }
  };

  // ✅ Vaciar carrito
  const vaciarCarrito = async (modeloEmail: string) => {
    try {
      console.log('🧹 Vaciando carrito...');
      
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('modelo_email', modeloEmail);

      if (error) throw error;

      setCarrito([]);
      console.log('✅ Carrito vaciado');
    } catch (error) {
      console.error('❌ Error vaciando carrito:', error);
      throw error;
    }
  };

  // ✅ Obtener total
  const obtenerTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  // ✅ Finalizar compra
  const finalizarCompra = async (
    modeloEmail: string, 
    modeloNombre: string, 
    metodoPago: string,
    comprobantePago?: string
  ) => {
    try {
      console.log('💳 Finalizando compra...');
      
      const compraId = `COMP-${Date.now()}`;
      const total = obtenerTotal();

      // 1. Crear la compra
      const { error: errorCompra } = await supabase
        .from('compras')
        .insert({
          id: compraId,
          modelo_email: modeloEmail,
          modelo_nombre: modeloNombre,
          subtotal: total,
          total: total,
          metodo_pago: metodoPago,
          comprobante_pago: comprobantePago,
          estado: 'completada',
        });

      if (errorCompra) throw errorCompra;

      // 2. Crear los items de la compra
      const itemsInsert = carrito.map(item => ({
        compra_id: compraId,
        producto_id: item.productoId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        imagen: item.imagen,
        categoria: item.categoria,
      }));

      const { error: errorItems } = await supabase
        .from('compras_items')
        .insert(itemsInsert);

      if (errorItems) throw errorItems;

      // 3. Vaciar el carrito
      await vaciarCarrito(modeloEmail);

      // 4. Recargar compras
      await cargarCompras(modeloEmail);

      console.log('✅ Compra finalizada exitosamente');
    } catch (error) {
      console.error('❌ Error finalizando compra:', error);
      throw error;
    }
  };

  // ✅ Obtener compras por modelo
  const obtenerComprasPorModelo = (modeloEmail: string) => {
    return compras.filter(c => c.modeloEmail === modeloEmail);
  };

  return (
    <CarritoContext.Provider value={{
      carrito,
      compras,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      vaciarCarrito,
      obtenerTotal,
      finalizarCompra,
      obtenerComprasPorModelo,
      cargarCarrito,
      cargarCompras,
    }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (context === undefined) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return context;
}