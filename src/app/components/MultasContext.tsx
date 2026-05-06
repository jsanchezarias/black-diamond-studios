import { createContext, useContext, useState, ReactNode } from 'react';
import { 
  notificarMultaAplicada, 
  notificarMultaPagada 
} from './NotificacionesHelpers';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

export interface Multa {
  id: string;
  modeloId: string;
  modeloNombre: string;
  modeloEmail: string;
  tipo: string;
  motivo: string;
  monto: number;
  fecha: string;
  estado: 'activa' | 'pagada' | 'cancelada';
  jornadaId?: string;
  horasTrabajadas?: number;
  horasRequeridas?: number;
  horasFaltantes?: number;
}

interface MultasContextType {
  multas: Multa[];
  agregarMulta: (multa: Omit<Multa, 'id' | 'fecha' | 'estado'>) => Promise<void>;
  eliminarMulta: (id: string) => Promise<void>;
  actualizarEstadoMulta: (id: string, estado: 'activa' | 'pagada' | 'cancelada') => Promise<void>;
  obtenerMultasPorModelo: (modeloId: string) => Multa[];
  obtenerMultasPorEmail: (modeloEmail: string) => Multa[];
  obtenerTotalMultasPendientes: (modeloId: string) => number;
  obtenerTotalMultasPendientesPorEmail: (modeloEmail: string) => number;
}

const MultasContext = createContext<MultasContextType | undefined>(undefined);

import { useEffect, useCallback } from 'react';

export function MultasProvider({ children }: { children: ReactNode }) {
  const [multas, setMultas] = useState<Multa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarMultas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('multas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setMultas((data || []).map(m => ({
        id: m.id,
        modeloId: m.modelo_id,
        modeloNombre: m.modelo_nombre,
        modeloEmail: m.modelo_email,
        tipo: m.tipo,
        motivo: m.motivo,
        monto: m.monto,
        fecha: m.created_at,
        estado: m.estado,
        jornadaId: m.jornada_id,
        horasTrabajadas: m.horas_trabajadas,
        horasRequeridas: m.horas_requeridas,
        horasFaltantes: m.horas_faltantes
      })));
    } catch (e) {
      console.error('Error cargando multas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMultas();
    
    const channel = supabase
      .channel('multas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'multas' }, cargarMultas)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cargarMultas]);

  const agregarMulta = async (multa: Omit<Multa, 'id' | 'fecha' | 'estado'>) => {
    const { data, error } = await supabase
      .from('multas')
      .insert({
        modelo_id: multa.modeloId,
        modelo_nombre: multa.modeloNombre,
        modelo_email: multa.modeloEmail,
        tipo: multa.tipo,
        motivo: multa.motivo,
        monto: multa.monto,
        estado: 'activa'
      })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear multa');
      throw error;
    }

    // 🔔 NOTIFICACIÓN
    notificarMultaAplicada({
      clienteEmail: multa.modeloEmail,
      clienteNombre: multa.modeloNombre,
      monto: multa.monto,
      motivo: multa.motivo
    }).catch(() => {});
  };

  const eliminarMulta = async (id: string) => {
    const { error } = await supabase
      .from('multas')
      .delete()
      .eq('id', id);
    if (error) toast.error('Error al eliminar multa');
  };

  const actualizarEstadoMulta = async (id: string, estado: 'activa' | 'pagada' | 'cancelada') => {
    const multa = multas.find(m => m.id === id);
    
    const { error } = await supabase
      .from('multas')
      .update({ estado })
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar multa');
      return;
    }

    if (estado === 'pagada' && multa) {
      notificarMultaPagada({
        clienteEmail: multa.modeloEmail,
        monto: multa.monto
      }).catch(() => {});
      
      // Registro en balance
      await supabase.from('balance_financiero').insert({
        tipo: 'egreso',
        categoria: 'multa',
        concepto: `Multa — ${multa.motivo} (${multa.modeloNombre})`,
        monto: multa.monto,
        referencia_id: id,
        referencia_tabla: 'multas',
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  };

  const obtenerMultasPorModelo = (modeloId: string) => {
    return multas.filter(m => m.modeloId === modeloId);
  };

  const obtenerMultasPorEmail = (modeloEmail: string) => {
    return multas.filter(m => m.modeloEmail === modeloEmail);
  };

  const obtenerTotalMultasPendientes = (modeloId: string) => {
    return multas
      .filter(m => m.modeloId === modeloId && m.estado === 'activa')
      .reduce((total, m) => total + m.monto, 0);
  };

  const obtenerTotalMultasPendientesPorEmail = (modeloEmail: string) => {
    return multas
      .filter(m => m.modeloEmail === modeloEmail && m.estado === 'activa')
      .reduce((total, m) => total + m.monto, 0);
  };

  return (
    <MultasContext.Provider
      value={{
        multas,
        agregarMulta,
        eliminarMulta,
        actualizarEstadoMulta,
        obtenerMultasPorModelo,
        obtenerMultasPorEmail,
        obtenerTotalMultasPendientes,
        obtenerTotalMultasPendientesPorEmail,
      }}
    >
      {children}
    </MultasContext.Provider>
  );
}

export function useMultas() {
  const context = useContext(MultasContext);
  if (context === undefined) {
    throw new Error('useMultas debe usarse dentro de MultasProvider');
  }
  return context;
}
