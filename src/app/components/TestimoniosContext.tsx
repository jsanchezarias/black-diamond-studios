import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';

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

export function TestimoniosProvider({ children }: { children: ReactNode }) {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);

  // Cargar testimonios reales desde Supabase
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('testimonios')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(100);

        if (error) {
          if (process.env.NODE_ENV === 'development') console.error('⚠️ Tabla testimonios no encontrada o error al cargar:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setTestimonios(data.map((row: any) => ({
            id: String(row.id),
            nombre: row.nombre ?? '',
            email: row.email ?? '',
            comentario: row.comentario ?? '',
            calificacion: row.calificacion ?? 5,
            fecha: row.fecha ?? row.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            estado: row.estado ?? 'pendiente',
            respuestaAdmin: row.respuesta_admin ?? undefined,
          })));
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('⚠️ Error cargando testimonios:', err);
      }
    };
    cargar();
  }, []);

  const agregarTestimonio = async (nuevoTestimonio: Omit<Testimonio, 'id' | 'fecha' | 'estado'>) => {
    const fecha = new Date().toISOString().split('T')[0];
    const temp: Testimonio = {
      ...nuevoTestimonio,
      id: Date.now().toString(),
      fecha,
      estado: 'pendiente',
    };

    try {
      const { data, error } = await (supabase as any)
        .from('testimonios')
        .insert({
          nombre: nuevoTestimonio.nombre,
          email: nuevoTestimonio.email,
          comentario: nuevoTestimonio.comentario,
          calificacion: nuevoTestimonio.calificacion,
          fecha,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (!error && data) {
        setTestimonios(prev => [{ ...temp, id: String(data.id) }, ...prev]);
        return;
      }
    } catch {}

    // Fallback local si tabla no existe
    setTestimonios(prev => [temp, ...prev]);
  };

  const aprobarTestimonio = async (id: string, respuesta?: string) => {
    setTestimonios(prev => prev.map(t =>
      t.id === id ? { ...t, estado: 'aprobado' as const, respuestaAdmin: respuesta } : t
    ));
    try {
      await (supabase as any)
        .from('testimonios')
        .update({ estado: 'aprobado', respuesta_admin: respuesta ?? null })
        .eq('id', id);
    } catch {}
  };

  const rechazarTestimonio = async (id: string) => {
    setTestimonios(prev => prev.map(t =>
      t.id === id ? { ...t, estado: 'rechazado' as const } : t
    ));
    try {
      await (supabase as any)
        .from('testimonios')
        .update({ estado: 'rechazado' })
        .eq('id', id);
    } catch {}
  };

  const eliminarTestimonio = async (id: string) => {
    setTestimonios(prev => prev.filter(t => t.id !== id));
    try {
      await (supabase as any)
        .from('testimonios')
        .delete()
        .eq('id', id);
    } catch {}
  };

  const getTestimoniosAprobados = () =>
    testimonios.filter(t => t.estado === 'aprobado')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getTestimoniosPendientes = () =>
    testimonios.filter(t => t.estado === 'pendiente')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <TestimoniosContext.Provider value={{
      testimonios,
      agregarTestimonio,
      aprobarTestimonio,
      rechazarTestimonio,
      eliminarTestimonio,
      getTestimoniosAprobados,
      getTestimoniosPendientes,
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
