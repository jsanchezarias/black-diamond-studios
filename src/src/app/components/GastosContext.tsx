import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface GastoOperativo {
  id: string;
  fecha: Date | string;
  concepto: string;
  categoria: 'nomina' | 'arriendo' | 'servicios' | 'mantenimiento' | 'marketing' | 'insumos' | 'transporte' | 'honorarios' | 'otros';
  monto: number;
  descripcion: string;
  comprobante?: string;
  responsable: string;
  aprobadoPor?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface ServicioPublico {
  id: string;
  nombre: string;
  tipo: 'agua' | 'luz' | 'gas' | 'internet' | 'telefono' | 'alarma' | 'aseo' | 'otro';
  proveedor: string;
  numeroCuenta?: string;
  fechaLimitePago: number; // Día del mes (1-31)
  montoPromedio: number;
  ultimoPago?: {
    fecha: Date | string;
    monto: number;
    comprobante?: string;
    numeroReferencia?: string;
  };
  proximoPago?: Date | string;
  activo: boolean;
  notificacionEnviada: boolean;
}

interface GastosContextType {
  gastosOperativos: GastoOperativo[];
  serviciosPublicos: ServicioPublico[];
  
  // Gastos Operativos
  agregarGasto: (gasto: Omit<GastoOperativo, 'id'>) => Promise<void>;
  editarGasto: (id: string, gasto: Partial<GastoOperativo>) => Promise<void>;
  eliminarGasto: (id: string) => Promise<void>;
  aprobarGasto: (id: string, aprobadoPor: string) => Promise<void>;
  rechazarGasto: (id: string) => Promise<void>;
  obtenerGastosPorPeriodo: (inicio: Date, fin: Date) => GastoOperativo[];
  obtenerTotalGastosPorCategoria: (categoria: string) => number;
  obtenerTotalGastosMes: (mes: number, anio: number) => number;
  
  // Servicios Públicos
  agregarServicio: (servicio: Omit<ServicioPublico, 'id' | 'notificacionEnviada'>) => Promise<void>;
  editarServicio: (id: string, servicio: Partial<ServicioPublico>) => Promise<void>;
  eliminarServicio: (id: string) => Promise<void>;
  marcarServicioPagado: (id: string, monto: number, comprobante?: string, numeroReferencia?: string) => Promise<void>;
  obtenerServiciosPorPagar: () => ServicioPublico[];
  obtenerServiciosVencidos: () => ServicioPublico[];
  verificarNotificaciones: () => ServicioPublico[];
  
  // Métodos de recarga
  cargarGastos: () => Promise<void>;
  cargarServicios: () => Promise<void>;
}

const GastosContext = createContext<GastosContextType | undefined>(undefined);

export function GastosProvider({ children }: { children: ReactNode }) {
  const [gastosOperativos, setGastosOperativos] = useState<GastoOperativo[]>([]);
  const [serviciosPublicos, setServiciosPublicos] = useState<ServicioPublico[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar datos desde Supabase al inicializar
  useEffect(() => {
    cargarGastos();
    cargarServicios();
  }, []);

  // ✅ Verificar notificaciones al cargar y cada hora
  useEffect(() => {
    const verificarYNotificar = async () => {
      const serviciosParaNotificar = verificarNotificaciones();
      
      if (serviciosParaNotificar.length > 0) {
        // Reproducir alarma si hay servicios pendientes
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGi77eeeTRAMUKXh8LhjHAU4jtbxy34sBSh+zO/bkUALFF2z6OqnVRQKRp3e8r1sIQUrgc7y2Yk2BxhpvO3nnk0QDFA=');
        audio.play().catch(() => {});
        
        // Marcar como notificados en Supabase
        for (const servicio of serviciosParaNotificar) {
          try {
            await supabase
              .from('servicios_publicos')
              .update({ notificacion_enviada: true })
              .eq('id', servicio.id);
          } catch (error) {
            console.error('Error actualizando notificación:', error);
          }
        }
        
        await cargarServicios();
      }
    };

    verificarYNotificar();
    const interval = setInterval(verificarYNotificar, 3600000); // Cada hora

    return () => clearInterval(interval);
  }, []); // ✅ Sin dependencias - verificarYNotificar accede a serviciosPublicos mediante closure

  // ========================================
  // CARGAR DATOS DESDE SUPABASE
  // ========================================

  const cargarGastos = async () => {
    try {
      console.log('💰 Cargando gastos operativos desde Supabase...');
      
      const { data, error } = await supabase
        .from('gastos_operativos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('❌ Error cargando gastos:', error);
        return;
      }

      if (data) {
        const gastosFormateados: GastoOperativo[] = data.map(item => ({
          id: item.id,
          fecha: item.fecha,
          concepto: item.concepto,
          categoria: item.categoria,
          monto: parseFloat(item.monto),
          descripcion: item.descripcion,
          comprobante: item.comprobante,
          responsable: item.responsable,
          aprobadoPor: item.aprobado_por,
          estado: item.estado,
        }));

        setGastosOperativos(gastosFormateados);
        console.log(`✅ ${gastosFormateados.length} gastos cargados`);
      }
    } catch (error) {
      console.error('❌ Error cargando gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      console.log('🔌 Cargando servicios públicos desde Supabase...');
      
      const { data, error } = await supabase
        .from('servicios_publicos') // ✅ Tabla correcta según diccionario
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('❌ Error cargando servicios:', error);
        return;
      }

      if (data) {
        const serviciosFormateados: ServicioPublico[] = data.map(item => ({
          id: item.id,
          nombre: item.nombre,
          tipo: item.tipo,
          proveedor: item.proveedor,
          numeroCuenta: item.numero_cuenta,
          fechaLimitePago: item.fecha_limite_pago,
          montoPromedio: parseFloat(item.monto_promedio),
          ultimoPago: item.ultimo_pago_fecha ? {
            fecha: item.ultimo_pago_fecha,
            monto: parseFloat(item.ultimo_pago_monto || 0),
            comprobante: item.ultimo_pago_comprobante,
            numeroReferencia: item.ultimo_pago_referencia,
          } : undefined,
          proximoPago: item.proximo_pago,
          activo: item.activo,
          notificacionEnviada: item.notificacion_enviada,
        }));

        setServiciosPublicos(serviciosFormateados);
        console.log(`✅ ${serviciosFormateados.length} servicios cargados`);
      }
    } catch (error) {
      console.error('❌ Error cargando servicios:', error);
    }
  };

  // ========================================
  // GASTOS OPERATIVOS
  // ========================================

  const agregarGasto = async (gasto: Omit<GastoOperativo, 'id'>) => {
    try {
      console.log('➕ Creando gasto operativo...');
      
      const id = `gasto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('gastos_operativos')
        .insert({
          id,
          fecha: gasto.fecha,
          concepto: gasto.concepto,
          categoria: gasto.categoria,
          monto: gasto.monto,
          descripcion: gasto.descripcion,
          comprobante: gasto.comprobante,
          responsable: gasto.responsable,
          aprobado_por: gasto.aprobadoPor,
          estado: gasto.estado,
        });

      if (error) throw error;

      console.log('✅ Gasto creado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('❌ Error agregando gasto:', error);
      throw error;
    }
  };

  const editarGasto = async (id: string, gastoActualizado: Partial<GastoOperativo>) => {
    try {
      console.log('🔄 Actualizando gasto:', id);
      
      const updateData: any = {};
      if (gastoActualizado.fecha !== undefined) updateData.fecha = gastoActualizado.fecha;
      if (gastoActualizado.concepto !== undefined) updateData.concepto = gastoActualizado.concepto;
      if (gastoActualizado.categoria !== undefined) updateData.categoria = gastoActualizado.categoria;
      if (gastoActualizado.monto !== undefined) updateData.monto = gastoActualizado.monto;
      if (gastoActualizado.descripcion !== undefined) updateData.descripcion = gastoActualizado.descripcion;
      if (gastoActualizado.comprobante !== undefined) updateData.comprobante = gastoActualizado.comprobante;
      if (gastoActualizado.responsable !== undefined) updateData.responsable = gastoActualizado.responsable;
      if (gastoActualizado.aprobadoPor !== undefined) updateData.aprobado_por = gastoActualizado.aprobadoPor;
      if (gastoActualizado.estado !== undefined) updateData.estado = gastoActualizado.estado;

      const { error } = await supabase
        .from('gastos_operativos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Gasto actualizado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('❌ Error editando gasto:', error);
      throw error;
    }
  };

  const eliminarGasto = async (id: string) => {
    try {
      console.log('🗑️ Eliminando gasto:', id);
      
      const { error } = await supabase
        .from('gastos_operativos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Gasto eliminado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('❌ Error eliminando gasto:', error);
      throw error;
    }
  };

  const aprobarGasto = async (id: string, aprobadoPor: string) => {
    await editarGasto(id, { estado: 'aprobado', aprobadoPor });
  };

  const rechazarGasto = async (id: string) => {
    await editarGasto(id, { estado: 'rechazado' });
  };

  const obtenerGastosPorPeriodo = (inicio: Date, fin: Date) => {
    return gastosOperativos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      return fechaGasto >= inicio && fechaGasto <= fin;
    });
  };

  const obtenerTotalGastosPorCategoria = (categoria: string) => {
    return gastosOperativos
      .filter(gasto => gasto.categoria === categoria && gasto.estado === 'aprobado')
      .reduce((total, gasto) => total + gasto.monto, 0);
  };

  const obtenerTotalGastosMes = (mes: number, anio: number) => {
    return gastosOperativos
      .filter(gasto => {
        const fechaGasto = new Date(gasto.fecha);
        return (
          fechaGasto.getMonth() === mes &&
          fechaGasto.getFullYear() === anio &&
          gasto.estado === 'aprobado'
        );
      })
      .reduce((total, gasto) => total + gasto.monto, 0);
  };

  // ========================================
  // SERVICIOS PÚBLICOS
  // ========================================

  const agregarServicio = async (servicio: Omit<ServicioPublico, 'id' | 'notificacionEnviada'>) => {
    try {
      console.log('➕ Creando servicio público...');
      
      const id = `servicio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('servicios_publicos')
        .insert({
          id,
          nombre: servicio.nombre,
          tipo: servicio.tipo,
          proveedor: servicio.proveedor,
          numero_cuenta: servicio.numeroCuenta,
          fecha_limite_pago: servicio.fechaLimitePago,
          monto_promedio: servicio.montoPromedio,
          ultimo_pago_fecha: servicio.ultimoPago?.fecha,
          ultimo_pago_monto: servicio.ultimoPago?.monto,
          ultimo_pago_comprobante: servicio.ultimoPago?.comprobante,
          ultimo_pago_referencia: servicio.ultimoPago?.numeroReferencia,
          proximo_pago: servicio.proximoPago,
          activo: servicio.activo,
          notificacion_enviada: false,
        });

      if (error) throw error;

      console.log('✅ Servicio creado exitosamente');
      await cargarServicios();
    } catch (error) {
      console.error('❌ Error agregando servicio:', error);
      throw error;
    }
  };

  const editarServicio = async (id: string, servicioActualizado: Partial<ServicioPublico>) => {
    try {
      console.log('🔄 Actualizando servicio:', id);
      
      const updateData: any = {};
      if (servicioActualizado.nombre !== undefined) updateData.nombre = servicioActualizado.nombre;
      if (servicioActualizado.tipo !== undefined) updateData.tipo = servicioActualizado.tipo;
      if (servicioActualizado.proveedor !== undefined) updateData.proveedor = servicioActualizado.proveedor;
      if (servicioActualizado.numeroCuenta !== undefined) updateData.numero_cuenta = servicioActualizado.numeroCuenta;
      if (servicioActualizado.fechaLimitePago !== undefined) updateData.fecha_limite_pago = servicioActualizado.fechaLimitePago;
      if (servicioActualizado.montoPromedio !== undefined) updateData.monto_promedio = servicioActualizado.montoPromedio;
      if (servicioActualizado.ultimoPago !== undefined) {
        updateData.ultimo_pago_fecha = servicioActualizado.ultimoPago.fecha;
        updateData.ultimo_pago_monto = servicioActualizado.ultimoPago.monto;
        updateData.ultimo_pago_comprobante = servicioActualizado.ultimoPago.comprobante;
        updateData.ultimo_pago_referencia = servicioActualizado.ultimoPago.numeroReferencia;
      }
      if (servicioActualizado.proximoPago !== undefined) updateData.proximo_pago = servicioActualizado.proximoPago;
      if (servicioActualizado.activo !== undefined) updateData.activo = servicioActualizado.activo;
      if (servicioActualizado.notificacionEnviada !== undefined) updateData.notificacion_enviada = servicioActualizado.notificacionEnviada;

      const { error } = await supabase
        .from('servicios_publicos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Servicio actualizado exitosamente');
      await cargarServicios();
    } catch (error) {
      console.error('❌ Error editando servicio:', error);
      throw error;
    }
  };

  const eliminarServicio = async (id: string) => {
    try {
      console.log('🗑️ Eliminando servicio:', id);
      
      const { error } = await supabase
        .from('servicios_publicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Servicio eliminado exitosamente');
      await cargarServicios();
    } catch (error) {
      console.error('❌ Error eliminando servicio:', error);
      throw error;
    }
  };

  const marcarServicioPagado = async (
    id: string,
    monto: number,
    comprobante?: string,
    numeroReferencia?: string
  ) => {
    try {
      const servicio = serviciosPublicos.find(s => s.id === id);
      if (!servicio) return;

      const hoy = new Date();
      const diaLimite = servicio.fechaLimitePago;
      
      // Calcular próxima fecha de pago (siguiente mes)
      const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaLimite);

      await editarServicio(id, {
        ultimoPago: {
          fecha: hoy.toISOString(),
          monto,
          comprobante,
          numeroReferencia,
        },
        proximoPago: proximoPago.toISOString(),
        notificacionEnviada: false,
      });
    } catch (error) {
      console.error('❌ Error marcando servicio como pagado:', error);
      throw error;
    }
  };

  const obtenerServiciosPorPagar = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return serviciosPublicos.filter(servicio => {
      if (!servicio.activo || !servicio.proximoPago) return false;
      
      const proximoPago = new Date(servicio.proximoPago);
      const diasHastaPago = Math.ceil(
        (proximoPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return diasHastaPago >= 0 && diasHastaPago <= 7;
    });
  };

  const obtenerServiciosVencidos = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return serviciosPublicos.filter(servicio => {
      if (!servicio.activo || !servicio.proximoPago) return false;
      const proximoPago = new Date(servicio.proximoPago);
      return proximoPago < hoy;
    });
  };

  const verificarNotificaciones = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return serviciosPublicos.filter(servicio => {
      if (!servicio.activo || !servicio.proximoPago || servicio.notificacionEnviada) {
        return false;
      }

      const proximoPago = new Date(servicio.proximoPago);
      const diasHastaPago = Math.ceil(
        (proximoPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diasHastaPago <= 3;
    });
  };

  return (
    <GastosContext.Provider
      value={{
        gastosOperativos,
        serviciosPublicos,
        agregarGasto,
        editarGasto,
        eliminarGasto,
        aprobarGasto,
        rechazarGasto,
        obtenerGastosPorPeriodo,
        obtenerTotalGastosPorCategoria,
        obtenerTotalGastosMes,
        agregarServicio,
        editarServicio,
        eliminarServicio,
        marcarServicioPagado,
        obtenerServiciosPorPagar,
        obtenerServiciosVencidos,
        verificarNotificaciones,
        cargarGastos,
        cargarServicios,
      }}
    >
      {children}
    </GastosContext.Provider>
  );
}

export function useGastos() {
  const context = useContext(GastosContext);
  if (context === undefined) {
    throw new Error('useGastos debe usarse dentro de un GastosProvider');
  }
  return context;
}