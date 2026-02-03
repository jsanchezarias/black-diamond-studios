import { createContext, useContext, useState, ReactNode } from 'react';

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

interface InventoryContextType {
  inventario: Producto[];
  agregarProducto: (producto: Omit<Producto, 'id'>) => void;
  eliminarProducto: (id: number) => void;
  actualizarProducto: (id: number, producto: Partial<Producto>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  // ✅ SIN DATOS DEMO - Sistema listo para producción
  const [inventario, setInventario] = useState<Producto[]>([]);

  const agregarProducto = (producto: Omit<Producto, 'id'>) => {
    const newId = Math.max(...inventario.map(p => p.id), 0) + 1;
    setInventario(prev => [...prev, { ...producto, id: newId }]);
  };

  const eliminarProducto = (id: number) => {
    setInventario(prev => prev.filter(p => p.id !== id));
  };

  const actualizarProducto = (id: number, producto: Partial<Producto>) => {
    setInventario(prev => prev.map(p => p.id === id ? { ...p, ...producto } : p));
  };

  return (
    <InventoryContext.Provider value={{ inventario, agregarProducto, eliminarProducto, actualizarProducto }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory debe usarse dentro de InventoryProvider');
  }
  return context;
}
