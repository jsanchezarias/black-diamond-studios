import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface Agendamiento {
  id: string; // ✅ UUID de Supabase
  modeloEmail: string;
  modeloNombre: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  tipoServicio: string;
  estado: 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show';
  notas?: string;
  creadoPor: string;
  fechaCreacion: string;
  motivoCancelacion?: string;
  canceladoPor?: string;
  fechaCancelacion?: string;
}

interface AgendamientosContextType {
  agendamientos: Agendamiento[];
  agregarAgendamiento: (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion'>) => Promise<void>;
  actualizarAgendamiento: (id: string, agendamiento: Partial<Agendamiento>) => Promise<void>;
  eliminarAgendamiento: (id: string) => Promise<void>;
  obtenerAgendamientosPorModelo: (modeloEmail: string) => Agendamiento[];
  obtenerAgendamientosPendientes: (modeloEmail: string) => Agendamiento[];
  marcarComoCompletado: (id: string) => Promise<void>;
  cancelarAgendamiento: (id: string, motivo: string, canceladoPor: string) => Promise<void>;
  marcarComoNoShow: (id: string, motivo: string, marcadoPor: string) => Promise<void>;
  recargarAgendamientos: () => Promise<void>;
}

const AgendamientosContext = createContext<AgendamientosContextType | undefined>(undefined);

export function AgendamientosProvider({ children }: { children: ReactNode }) {
  const [agendamientos, setAgendamientos] = useState<Agendamiento[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar agendamientos desde Supabase al inicializar
  useEffect(() => {
    cargarAgendamientos();
  }, []);

  const cargarAgendamientos = async () => {
    try {
      console.log('🔄 Cargando agendamientos desde Supabase...');
      
      const { data, error } = await supabase
        .from('agendamientos')
        .select('*')
        .order('fecha', { ascending: true }); // ✅ CORREGIDO: Solo ordenar por fecha (ya incluye hora)

      if (error) {
        console.error('❌ Error cargando agendamientos:', error);
        return;
      }

      if (data) {
        // Convertir snake_case de Supabase a camelCase
        const agendamientosFormateados: Agendamiento[] = data.map(item => ({
          id: item.id,
          modeloEmail: item.modelo_email,
          modeloNombre: item.modelo_nombre,
          clienteNombre: item.cliente_nombre,
          clienteTelefono: item.cliente_telefono,
          fecha: item.fecha,
          hora: item.hora,
          duracionMinutos: item.duracion_minutos,
          tipoServicio: item.tipo_servicio,
          estado: item.estado,
          notas: item.notas,
          creadoPor: item.creado_por,
          fechaCreacion: item.fecha_creacion,
          motivoCancelacion: item.motivo_cancelacion,
          canceladoPor: item.cancelado_por,
          fechaCancelacion: item.fecha_cancelacion,
        }));

        setAgendamientos(agendamientosFormateados);
        console.log(`✅ ${agendamientosFormateados.length} agendamientos cargados`);
      }
    } catch (error) {
      console.error('❌ Error cargando agendamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAgendamiento = async (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion'>) => {
    try {
      console.log('📝 Creando agendamiento en Supabase...');
      
      // Convertir camelCase a snake_case para Supabase
      const { data, error } = await supabase
        .from('agendamientos')
        .insert({
          modelo_email: agendamiento.modeloEmail,
          modelo_nombre: agendamiento.modeloNombre,
          cliente_nombre: agendamiento.clienteNombre,
          cliente_telefono: agendamiento.clienteTelefono,
          fecha: agendamiento.fecha,
          hora: agendamiento.hora,
          duracion_minutos: agendamiento.duracionMinutos,
          tipo_servicio: agendamiento.tipoServicio,
          estado: agendamiento.estado,
          notas: agendamiento.notas,
          creado_por: agendamiento.creadoPor,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando agendamiento:', error);
        throw error;
      }

      console.log('✅ Agendamiento creado exitosamente');
      await cargarAgendamientos(); // Recargar lista
    } catch (error) {
      console.error('❌ Error en agregarAgendamiento:', error);
      throw error;
    }
  };

  const actualizarAgendamiento = async (id: string, agendamiento: Partial<Agendamiento>) => {
    try {
      console.log('🔄 Actualizando agendamiento:', id);
      
      // Convertir campos a snake_case
      const updateData: any = {};
      if (agendamiento.modeloEmail !== undefined) updateData.modelo_email = agendamiento.modeloEmail;
      if (agendamiento.modeloNombre !== undefined) updateData.modelo_nombre = agendamiento.modeloNombre;
      if (agendamiento.clienteNombre !== undefined) updateData.cliente_nombre = agendamiento.clienteNombre;
      if (agendamiento.clienteTelefono !== undefined) updateData.cliente_telefono = agendamiento.clienteTelefono;
      if (agendamiento.fecha !== undefined) updateData.fecha = agendamiento.fecha;
      if (agendamiento.hora !== undefined) updateData.hora = agendamiento.hora;
      if (agendamiento.duracionMinutos !== undefined) updateData.duracion_minutos = agendamiento.duracionMinutos;
      if (agendamiento.tipoServicio !== undefined) updateData.tipo_servicio = agendamiento.tipoServicio;
      if (agendamiento.estado !== undefined) updateData.estado = agendamiento.estado;
      if (agendamiento.notas !== undefined) updateData.notas = agendamiento.notas;
      if (agendamiento.creadoPor !== undefined) updateData.creado_por = agendamiento.creadoPor;
      if (agendamiento.motivoCancelacion !== undefined) updateData.motivo_cancelacion = agendamiento.motivoCancelacion;
      if (agendamiento.canceladoPor !== undefined) updateData.cancelado_por = agendamiento.canceladoPor;
      if (agendamiento.fechaCancelacion !== undefined) updateData.fecha_cancelacion = agendamiento.fechaCancelacion;

      const { error } = await supabase
        .from('agendamientos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando agendamiento:', error);
        throw error;
      }

      console.log('✅ Agendamiento actualizado exitosamente');
      await cargarAgendamientos(); // Recargar lista
    } catch (error) {
      console.error('❌ Error en actualizarAgendamiento:', error);
      throw error;
    }
  };

  const eliminarAgendamiento = async (id: string) => {
    try {
      console.log('🗑️ Eliminando agendamiento:', id);
      
      const { error } = await supabase
        .from('agendamientos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando agendamiento:', error);
        throw error;
      }

      console.log('✅ Agendamiento eliminado exitosamente');
      await cargarAgendamientos(); // Recargar lista
    } catch (error) {
      console.error('❌ Error en eliminarAgendamiento:', error);
      throw error;
    }
  };

  const obtenerAgendamientosPorModelo = (modeloEmail: string) => {
    return agendamientos.filter(a => a.modeloEmail === modeloEmail);
  };

  const obtenerAgendamientosPendientes = (modeloEmail: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return agendamientos.filter(a => {
      const fechaAgendamiento = new Date(a.fecha);
      return a.modeloEmail === modeloEmail && 
             a.estado !== 'completado' && 
             a.estado !== 'cancelado' &&
             fechaAgendamiento >= hoy;
    }).sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`);
      const dateB = new Date(`${b.fecha}T${b.hora}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const marcarComoCompletado = async (id: string) => {
    await actualizarAgendamiento(id, { estado: 'completado' });
  };

  const cancelarAgendamiento = async (id: string, motivo: string, canceladoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'cancelado',
      motivoCancelacion: motivo,
      canceladoPor: canceladoPor,
      fechaCancelacion: new Date().toISOString(),
    });
  };

  const marcarComoNoShow = async (id: string, motivo: string, marcadoPor: string) => {
    await actualizarAgendamiento(id, {
      estado: 'no_show',
      motivoCancelacion: motivo,
      canceladoPor: marcadoPor,
      fechaCancelacion: new Date().toISOString(),
    });
  };

  const recargarAgendamientos = async () => {
    await cargarAgendamientos();
  };

  return (
    <AgendamientosContext.Provider
      value={{
        agendamientos,
        agregarAgendamiento,
        actualizarAgendamiento,
        eliminarAgendamiento,
        obtenerAgendamientosPorModelo,
        obtenerAgendamientosPendientes,
        marcarComoCompletado,
        cancelarAgendamiento,
        marcarComoNoShow,
        recargarAgendamientos,
      }}
    >
      {children}
    </AgendamientosContext.Provider>
  );
}

export function useAgendamientos() {
  const context = useContext(AgendamientosContext);
  if (context === undefined) {
    throw new Error('useAgendamientos debe usarse dentro de AgendamientosProvider');
  }
  return context;
}