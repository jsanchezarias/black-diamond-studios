import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, projectId, publicAnonKey } from '../../utils/supabase/info'; // ✅ Agregamos projectId y publicAnonKey
import { 
  notificarNuevoAgendamiento, 
  notificarAgendamientoConfirmado, 
  notificarAgendamientoCancelado,
  notificarServicioCompletado 
} from './NotificacionesHelpers';
import { configurarVerificacionPeriodica, AgendamientoParaRecordatorio } from './NotificacionesRecordatorios';

export interface Agendamiento {
  id: string; // ✅ UUID de Supabase
  modeloEmail: string;
  modeloNombre: string;
  clienteId: string; // ✅ CORREGIDO: ID del cliente (FK)
  clienteNombre: string; // ✅ Campo calculado (para display) - se obtiene del JOIN
  clienteTelefono: string; // ✅ Campo calculado (para display) - se obtiene del JOIN
  fecha: string;
  hora: string;
  duracionMinutos: number;
  tipoServicio: string; // 'sede' | 'domicilio'
  estado: 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show';
  notas?: string;
  creadoPor?: string; // ✅ Opcional porque puede no existir en la tabla
  fechaCreacion?: string; // ✅ Opcional porque puede no existir en la tabla
  motivoCancelacion?: string;
  canceladoPor?: string;
  fechaCancelacion?: string;
  // 🆕 CAMPOS DE PAGO
  montoPago: number; // Monto total del servicio
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado'; // Estado del pago
  metodoPago?: string; // 'PSE' | 'Nequi' | 'Tarjeta' | etc.
  transaccionId?: string; // ID de la transacción de la pasarela
  fechaPago?: string; // Fecha en que se realizó el pago
  comprobantePago?: string; // URL del comprobante si aplica
  // 🆕 CAMPOS DE TARIFA - Para sincronización con el perfil de la modelo
  tarifaNombre?: string; // Nombre de la tarifa (ej: "1 hora", "2 horas")
  tarifaDescripcion?: string; // Descripción de la tarifa
}

interface AgendamientosContextType {
  agendamientos: Agendamiento[];
  agregarAgendamiento: (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion' | 'creadoPor'>) => Promise<{ success: boolean, error?: any, data?: any }>; // ✅ clienteNombre y clienteTelefono ya NO se excluyen
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
      console.log('🔄 Cargando agendamientos desde servidor...');
      
      // ✅ SOLUCIÓN: Usar el endpoint del servidor que tiene permisos SERVICE_ROLE
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/agendamientos`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', errorText);
        console.warn('⚠️ Usando MODO FALLBACK - Sin agendamientos iniciales');
        setAgendamientos([]);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const agendamientosFormateados = result.data
          .sort((a: Agendamiento, b: Agendamiento) => {
            const dateA = new Date(`${a.fecha}T${a.hora || '00:00'}`);
            const dateB = new Date(`${b.fecha}T${b.hora || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
          });

        setAgendamientos(agendamientosFormateados);
        console.log(`✅ ${agendamientosFormateados.length} agendamientos cargados desde servidor`);
      } else {
        setAgendamientos([]);
        console.log('📋 No hay agendamientos guardados');
      }
    } catch (error) {
      console.error('❌ Error cargando agendamientos:', error);
      setAgendamientos([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarAgendamiento = async (agendamiento: Omit<Agendamiento, 'id' | 'fechaCreacion' | 'creadoPor'>) => {
    try {
      console.log('📝 Creando agendamiento...');
      
      // ✅ SOLUCIÓN: Usar el endpoint del servidor en lugar de acceso directo a KV Store
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/agendamientos`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agendamiento),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error guardando agendamiento:', errorData);
        return { success: false, error: errorData };
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Agendamiento creado exitosamente');
        await cargarAgendamientos(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        console.error('❌ Error en respuesta del servidor:', result);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error en agregarAgendamiento:', error);
      return { success: false, error };
    }
  };

  const actualizarAgendamiento = async (id: string, agendamiento: Partial<Agendamiento>) => {
    try {
      console.log('🔄 Actualizando agendamiento:', id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/agendamientos/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agendamiento),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error actualizando agendamiento:', errorData);
        throw new Error(errorData.error || 'Error actualizando agendamiento');
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Agendamiento actualizado exitosamente');
        await cargarAgendamientos(); // Recargar lista
      } else {
        throw new Error(result.error || 'Error actualizando agendamiento');
      }
    } catch (error) {
      console.error('❌ Error en actualizarAgendamiento:', error);
      throw error;
    }
  };

  const eliminarAgendamiento = async (id: string) => {
    try {
      console.log('🗑️ Eliminando agendamiento:', id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/agendamientos/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error eliminando agendamiento:', errorData);
        throw new Error(errorData.error || 'Error eliminando agendamiento');
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
    try {
      // Obtener datos del agendamiento antes de actualizarlo
      const agendamiento = agendamientos.find(a => a.id === id);
      if (!agendamiento) {
        throw new Error('Agendamiento no encontrado');
      }

      // 1. Actualizar el agendamiento
      await actualizarAgendamiento(id, { estado: 'completado' });
      
      // 2. Enviar notificación
      await notificarServicioCompletado({
        modeloEmail: agendamiento.modeloEmail,
        clienteNombre: agendamiento.clienteNombre,
        monto: agendamiento.montoPago,
        duracion: agendamiento.duracionMinutos
      });
      
      // 3. Crear servicio desde el agendamiento
      console.log(`📝 Creando servicio completado para agendamiento ${id}`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios/desde-agendamiento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agendamientoId: id,
            estado: 'completado',
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Servicio completado creado exitosamente');
      } else {
        console.error('⚠️ Error creando servicio completado:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error en marcarComoCompletado:', error);
      throw error;
    }
  };

  const cancelarAgendamiento = async (id: string, motivo: string, canceladoPor: string) => {
    try {
      // Obtener datos del agendamiento antes de cancelarlo
      const agendamiento = agendamientos.find(a => a.id === id);
      if (!agendamiento) {
        throw new Error('Agendamiento no encontrado');
      }

      // 1. Actualizar el agendamiento
      await actualizarAgendamiento(id, {
        estado: 'cancelado',
        motivoCancelacion: motivo,
        canceladoPor: canceladoPor,
        fechaCancelacion: new Date().toISOString(),
      });
      
      // 2. Enviar notificación
      await notificarAgendamientoCancelado({
        modeloEmail: agendamiento.modeloEmail,
        clienteNombre: agendamiento.clienteNombre,
        fecha: agendamiento.fecha,
        hora: agendamiento.hora,
        motivo
      });
      
      // 3. Crear servicio cancelado
      console.log(`📝 Creando servicio cancelado para agendamiento ${id}`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios/desde-agendamiento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agendamientoId: id,
            estado: 'cancelado',
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Servicio cancelado creado exitosamente');
      } else {
        console.error('⚠️ Error creando servicio cancelado:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error en cancelarAgendamiento:', error);
      throw error;
    }
  };

  const marcarComoNoShow = async (id: string, motivo: string, marcadoPor: string) => {
    try {
      // 1. Actualizar el agendamiento
      await actualizarAgendamiento(id, {
        estado: 'no_show',
        motivoCancelacion: motivo,
        canceladoPor: marcadoPor,
        fechaCancelacion: new Date().toISOString(),
      });
      
      // 2. Crear servicio no_show (el servidor aplicará multa automática si corresponde)
      console.log(`📝 Creando servicio no_show para agendamiento ${id}`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/servicios/desde-agendamiento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agendamientoId: id,
            estado: 'no_show',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Servicio no_show creado exitosamente:', result);
        
        if (result.data?.multaAplicada) {
          console.log(`💸 Multa automática aplicada: $${result.data.montoMulta?.toLocaleString()}`);
        }
      } else {
        console.error('⚠️ Error creando servicio no_show:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error en marcarComoNoShow:', error);
      throw error;
    }
  };

  const recargarAgendamientos = async () => {
    await cargarAgendamientos();
  };

  // 🔔 SISTEMA DE RECORDATORIOS AUTOMÁTICOS
  // Verificar cada hora si hay agendamientos próximos (24h antes) y enviar recordatorios
  useEffect(() => {
    if (agendamientos.length === 0) return;

    console.log('⏰ Configurando verificación de recordatorios automáticos...');

    // Convertir agendamientos al formato requerido por el sistema de recordatorios
    const agendamientosParaRecordatorio: AgendamientoParaRecordatorio[] = agendamientos
      .filter(a => a.estado === 'confirmado' || a.estado === 'pendiente')
      .map(a => ({
        id: a.id,
        modeloEmail: a.modeloEmail,
        modeloNombre: a.modeloNombre,
        clienteNombre: a.clienteNombre,
        fecha: a.fecha, // Ya debe estar en formato ISO
        hora: a.hora,
        tipoServicio: a.tipoServicio,
        estado: a.estado
      }));

    // Configurar verificación periódica (cada 60 minutos)
    const cleanup = configurarVerificacionPeriodica(agendamientosParaRecordatorio, 60);

    console.log(`✅ Sistema de recordatorios configurado para ${agendamientosParaRecordatorio.length} agendamientos activos`);

    // Limpiar al desmontar
    return cleanup;
  }, [agendamientos]); // Re-configurar cuando cambien los agendamientos

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
    console.warn('⚠️ useAgendamientos debe usarse dentro de AgendamientosProvider');
    // Retornar un objeto con valores por defecto en lugar de undefined
    return {
      agendamientos: [],
      agregarAgendamiento: async () => { 
        console.warn('AgendamientosProvider no disponible'); 
        return { success: false, error: { message: 'Provider no disponible' } };
      },
      actualizarAgendamiento: async () => { console.warn('AgendamientosProvider no disponible'); },
      eliminarAgendamiento: async () => { console.warn('AgendamientosProvider no disponible'); },
      obtenerAgendamientosPorModelo: () => [],
      obtenerAgendamientosPendientes: () => [],
      marcarComoCompletado: async () => { console.warn('AgendamientosProvider no disponible'); },
      cancelarAgendamiento: async () => { console.warn('AgendamientosProvider no disponible'); },
      marcarComoNoShow: async () => { console.warn('AgendamientosProvider no disponible'); },
      recargarAgendamientos: async () => { console.warn('AgendamientosProvider no disponible'); },
    };
  }
  return context;
}