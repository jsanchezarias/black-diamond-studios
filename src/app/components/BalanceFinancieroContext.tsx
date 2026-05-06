import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

export interface MovimientoBalance {
  id: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  monto: number;
  referencia_id?: string;
  referencia_tabla?: string;
  usuario_id?: string;
  fecha: string;
  created_at: string;
}

interface TotalesBalance {
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  ingresosHoy: number;
  egresosHoy: number;
  balanceHoy: number;
  ingresosMes: number;
  egresosMes: number;
  balanceMes: number;
}

interface BalanceFinancieroContextType extends TotalesBalance {
  movimientos: MovimientoBalance[];
  cargando: boolean;
  recargar: () => Promise<void>;
}

const BalanceFinancieroContext = createContext<BalanceFinancieroContextType | undefined>(undefined);

export function BalanceFinancieroProvider({ children }: { children: ReactNode }) {
  const [movimientos, setMovimientos] = useState<MovimientoBalance[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('balance_financiero')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error cargando movimientos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balance_financiero'
        },
        (payload) => {
          const nuevo = payload.new as MovimientoBalance;
          setMovimientos(prev => [nuevo, ...prev]);
          
          if (nuevo.tipo === 'ingreso') {
            toast.success(`💰 +$${nuevo.monto.toLocaleString('es-CO')} — ${nuevo.concepto}`);
          } else {
            toast.info(`📤 -$${nuevo.monto.toLocaleString('es-CO')} — ${nuevo.concepto}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calcularTotales = (): TotalesBalance => {
    const hoy = new Date().toISOString().split('T')[0];
    const mesActual = new Date().toISOString().slice(0, 7);

    const filtrados = {
      ingresos: movimientos.filter(m => m.tipo === 'ingreso'),
      egresos: movimientos.filter(m => m.tipo === 'egreso'),
    };

    const ingresosHoy = filtrados.ingresos.filter(m => m.fecha === hoy).reduce((sum, m) => sum + Number(m.monto), 0);
    const egresosHoy = filtrados.egresos.filter(m => m.fecha === hoy).reduce((sum, m) => sum + Number(m.monto), 0);
    
    const ingresosMes = filtrados.ingresos.filter(m => m.fecha.startsWith(mesActual)).reduce((sum, m) => sum + Number(m.monto), 0);
    const egresosMes = filtrados.egresos.filter(m => m.fecha.startsWith(mesActual)).reduce((sum, m) => sum + Number(m.monto), 0);

    const totalIngresos = filtrados.ingresos.reduce((sum, m) => sum + Number(m.monto), 0);
    const totalEgresos = filtrados.egresos.reduce((sum, m) => sum + Number(m.monto), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      ingresosHoy,
      egresosHoy,
      balanceHoy: ingresosHoy - egresosHoy,
      ingresosMes,
      egresosMes,
      balanceMes: ingresosMes - egresosMes
    };
  };

  const totales = calcularTotales();

  return (
    <BalanceFinancieroContext.Provider
      value={{
        movimientos,
        ...totales,
        cargando,
        recargar: cargarMovimientos
      }}
    >
      {children}
    </BalanceFinancieroContext.Provider>
  );
}

export function useBalanceFinanciero() {
  const context = useContext(BalanceFinancieroContext);
  if (context === undefined) {
    throw new Error('useBalanceFinanciero debe usarse dentro de un BalanceFinancieroProvider');
  }
  return context;
}
