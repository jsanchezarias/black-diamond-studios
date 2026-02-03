import { createContext, useContext, useState, ReactNode } from 'react';

export interface Testimonio {
  id: string;
  nombre: string;
  email: string;
  comentario: string;
  calificacion: number;
  fecha: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  respuestaAdmin?: string;
}

interface TestimoniosContextType {
  testimonios: Testimonio[];
  agregarTestimonio: (testimonio: Omit<Testimonio, 'id' | 'fecha' | 'estado'>) => void;
  aprobarTestimonio: (id: string, respuesta?: string) => void;
  rechazarTestimonio: (id: string) => void;
  eliminarTestimonio: (id: string) => void;
  getTestimoniosAprobados: () => Testimonio[];
  getTestimoniosPendientes: () => Testimonio[];
}

const TestimoniosContext = createContext<TestimoniosContextType | undefined>(undefined);

// ✅ SIN DATOS DEMO - Sistema listo para producción
const testimoniosIniciales: Testimonio[] = [];

export function TestimoniosProvider({ children }: { children: ReactNode }) {
  const [testimonios, setTestimonios] = useState<Testimonio[]>(testimoniosIniciales);

  const agregarTestimonio = (nuevoTestimonio: Omit<Testimonio, 'id' | 'fecha' | 'estado'>) => {
    const testimonio: Testimonio = {
      ...nuevoTestimonio,
      id: Date.now().toString(),
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente'
    };
    setTestimonios([...testimonios, testimonio]);
  };

  const aprobarTestimonio = (id: string, respuesta?: string) => {
    setTestimonios(testimonios.map(t => 
      t.id === id 
        ? { ...t, estado: 'aprobado' as const, respuestaAdmin: respuesta } 
        : t
    ));
  };

  const rechazarTestimonio = (id: string) => {
    setTestimonios(testimonios.map(t => 
      t.id === id 
        ? { ...t, estado: 'rechazado' as const } 
        : t
    ));
  };

  const eliminarTestimonio = (id: string) => {
    setTestimonios(testimonios.filter(t => t.id !== id));
  };

  const getTestimoniosAprobados = () => {
    return testimonios.filter(t => t.estado === 'aprobado').sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const getTestimoniosPendientes = () => {
    return testimonios.filter(t => t.estado === 'pendiente').sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  return (
    <TestimoniosContext.Provider value={{
      testimonios,
      agregarTestimonio,
      aprobarTestimonio,
      rechazarTestimonio,
      eliminarTestimonio,
      getTestimoniosAprobados,
      getTestimoniosPendientes
    }}>
      {children}
    </TestimoniosContext.Provider>
  );
}

export function useTestimonios() {
  const context = useContext(TestimoniosContext);
  if (context === undefined) {
    throw new Error('useTestimonios debe ser usado dentro de TestimoniosProvider');
  }
  return context;
}
