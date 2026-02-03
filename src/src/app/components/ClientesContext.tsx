import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export interface ServicioCliente {
  id: string;
  fecha: string;
  modeloNombre: string;
  modeloEmail?: string; // Email de la modelo que atendió
  tipoServicio: string;
  tiempoServicio: string;
  duracionMinutos: number;
  monto: number;
  costoTotal: number;
  costoServicio: number;
  costoAdicionales: number;
  costoConsumo: number;
  costoTiemposAdicionales?: number;
  costoAdicionalesExtra?: number;
  costoConsumosDetallados?: number;
  metodoPago: string;
  habitacion?: string;
  adicionales?: string;
  consumo?: string;
  notas?: string;
  notasServicio?: string;
  observacionModelo?: string; // Observación privada de la modelo sobre el cliente
  estado?: 'completado' | 'cancelado' | 'no_show';
  motivoCancelacion?: string;
  agendamientoId?: number;
  tiemposAdicionales?: Array<{
    tiempo: string;
    costo: number;
    timestamp: Date;
  }>;
  adicionalesExtra?: Array<{
    descripcion: string;
    costo: number;
    comprobante?: string;
    timestamp: Date;
  }>;
  consumosDetallados?: Array<{
    descripcion: string;
    costo: number;
    cantidad: number;
    timestamp: Date;
  }>;
}

export interface ObservacionModelo {
  id: string;
  modeloNombre: string;
  modeloEmail: string;
  fecha: string;
  observacion: string;
  rating?: number; // Rating que la modelo le da al cliente (1-5)
  tipo?: 'positiva' | 'negativa' | 'neutral'; // Tipo de observación
}

export interface Cliente {
  id: string;
  telefono: string;
  nombre: string;
  nombreUsuario: string;
  email?: string;
  fechaNacimiento?: Date;
  ciudad?: string;
  preferencias?: string;
  notas?: string; // Notas administrativas internas
  observaciones?: ObservacionModelo[]; // Observaciones de las modelos
  rating?: number; // Rating promedio del cliente
  historialServicios: ServicioCliente[];
  userId?: string;
  fechaRegistro: Date;
  ultimaVisita?: Date;
  totalServicios: number;
  totalGastado: number;
  // Estadísticas adicionales
  modelosFrecuentes?: Array<{ modeloNombre: string; cantidad: number }>; // Modelos que más visita
  serviciosFrecuentes?: Array<{ tipoServicio: string; cantidad: number }>; // Tipos de servicio más frecuentes
}

interface ClientesContextType {
  clientes: Cliente[];
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'totalServicios' | 'totalGastado' | 'historialServicios' | 'observaciones'> & { password?: string }) => Promise<Cliente>;
  actualizarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  buscarPorTelefono: (telefono: string) => Cliente | undefined;
  buscarPorEmail: (email: string) => Cliente | undefined;
  buscarClientes: (query: string) => Cliente[];
  obtenerOCrearCliente: (nombre: string, telefono: string, email?: string) => Promise<Cliente>;
  registrarServicio: (clienteId: string, monto: number) => Promise<void>;
  agregarServicioACliente: (telefono: string, servicioData: any) => Promise<void>;
  agregarObservacionModelo: (telefono: string, modeloNombre: string, modeloEmail: string, observacion: string, rating?: number, tipo?: 'positiva' | 'negativa' | 'neutral') => Promise<void>;
  obtenerHistorialCliente: (clienteId: string) => ServicioCliente[];
  obtenerObservacionesCliente: (telefono: string) => ObservacionModelo[];
  obtenerNotasServiciosPrevios: (telefono: string) => string[];
  obtenerEstadisticasCliente: (telefono: string) => {
    totalServicios: number;
    totalGastado: number;
    servicioMasReciente?: Date;
    modeloFrecuente?: string;
    promedioGasto: number;
  };
  isLoading: boolean;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      console.log('🔄 Cargando clientes desde Supabase...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/clientes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`📥 Respuesta del servidor recibida:`, data.length, 'clientes');
        
        // Si el servidor devuelve array vacío (tabla no existe), mostrar advertencia
        if (Array.isArray(data) && data.length === 0) {
          console.warn('⚠️ No hay clientes en la tabla');
          console.warn('💡 Para agregar clientes, ve al panel "Historial de Clientes" y haz click en "Agregar Cliente"');
          setClientes([]);
        } else {
          // Filtrar clientes null y validar datos requeridos
          const clientesValidos = data
            .filter((c: any) => c && c.fechaRegistro && c.telefono)
            .map((c: any) => ({
              ...c,
              fechaRegistro: new Date(c.fechaRegistro),
              fechaNacimiento: c.fechaNacimiento ? new Date(c.fechaNacimiento) : undefined,
              ultimaVisita: c.ultimaVisita ? new Date(c.ultimaVisita) : undefined,
              historialServicios: c.historialServicios || [],
              observaciones: c.observaciones || [],
            }));
          setClientes(clientesValidos);
          console.log(`✅ ${clientesValidos.length} clientes cargados exitosamente en el frontend`);
        }
      } else {
        console.error('❌ Error al obtener clientes:', response.status);
        const errorText = await response.text();
        console.error('📋 Detalles:', errorText);
        // No cargar clientes si hay error, dejar array vacío
        setClientes([]);
      }
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      // En caso de error de red, inicializar con array vacío
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const agregarCliente = async (clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'totalServicios' | 'totalGastado' | 'historialServicios' | 'observaciones'> & { password?: string }): Promise<Cliente> => {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000; // 30 segundos
    
    for (let intento = 0; intento < MAX_RETRIES; intento++) {
      try {
        // Crear un controller para manejar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/clientes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          
          // Si es un error 500 de Supabase/Cloudflare, reintentar
          if (response.status >= 500 && intento < MAX_RETRIES - 1) {
            console.warn(`Error ${response.status} al agregar cliente, reintentando... (${intento + 1}/${MAX_RETRIES})`);
            // Esperar un poco antes de reintentar (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, intento) * 1000));
            continue;
          }
          
          throw new Error(`Error al agregar cliente: ${errorText}`);
        }

        const nuevoCliente = await response.json();
        const clienteConFechas = {
          ...nuevoCliente,
          fechaRegistro: new Date(nuevoCliente.fechaRegistro),
          fechaNacimiento: nuevoCliente.fechaNacimiento ? new Date(nuevoCliente.fechaNacimiento) : undefined,
          ultimaVisita: nuevoCliente.ultimaVisita ? new Date(nuevoCliente.ultimaVisita) : undefined,
          historialServicios: nuevoCliente.historialServicios || [],
          observaciones: nuevoCliente.observaciones || [],
        };

        setClientes(prev => [...prev, clienteConFechas]);
        return clienteConFechas;
      } catch (error: any) {
        // Si es un error de timeout o red y no es el último intento, reintentar
        if ((error.name === 'AbortError' || error.message?.includes('fetch')) && intento < MAX_RETRIES - 1) {
          console.warn(`Timeout/Error de red al agregar cliente, reintentando... (${intento + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, intento) * 1000));
          continue;
        }
        
        console.error('Error agregando cliente:', error);
        throw error;
      }
    }
    
    throw new Error('No se pudo agregar el cliente después de varios intentos');
  };

  const actualizarCliente = async (id: string, clienteData: Partial<Cliente>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/clientes/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clienteData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error al actualizar cliente: ${error}`);
      }

      setClientes(prev => prev.map(c => 
        c.id === id ? { ...c, ...clienteData } : c
      ));
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }
  };

  const buscarPorTelefono = (telefono: string): Cliente | undefined => {
    return clientes.find(c => c.telefono === telefono);
  };

  const buscarPorEmail = (email: string): Cliente | undefined => {
    return clientes.find(c => c.email === email);
  };

  const buscarClientes = (query: string): Cliente[] => {
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.telefono.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const obtenerOCrearCliente = async (nombre: string, telefono: string, email?: string): Promise<Cliente> => {
    const clienteExistente = buscarPorTelefono(telefono);
    if (clienteExistente) {
      return clienteExistente;
    }

    const nuevoClienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'totalServicios' | 'totalGastado' | 'historialServicios' | 'observaciones'> & { password?: string } = {
      nombre,
      telefono,
      nombreUsuario: nombre.toLowerCase().replace(/\s+/g, ''),
      email,
    };

    return agregarCliente(nuevoClienteData);
  };

  const registrarServicio = async (clienteId: string, monto: number) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    await actualizarCliente(clienteId, {
      totalServicios: cliente.totalServicios + 1,
      totalGastado: cliente.totalGastado + monto,
      ultimaVisita: new Date(),
    });
  };

  const agregarServicioACliente = async (telefono: string, servicioData: any) => {
    const cliente = clientes.find(c => c.telefono === telefono);
    if (!cliente) return;

    const nuevoServicio: ServicioCliente = {
      id: crypto.randomUUID(),
      fecha: servicioData.fecha,
      modeloNombre: servicioData.modeloNombre,
      modeloEmail: servicioData.modeloEmail,
      tipoServicio: servicioData.tipoServicio,
      tiempoServicio: servicioData.tiempoServicio,
      duracionMinutos: servicioData.duracionMinutos,
      monto: servicioData.costoTotal || servicioData.monto,
      costoTotal: servicioData.costoTotal,
      costoServicio: servicioData.costoServicio,
      costoAdicionales: servicioData.costoAdicionales,
      costoConsumo: servicioData.costoConsumo,
      costoTiemposAdicionales: servicioData.costoTiemposAdicionales,
      costoAdicionalesExtra: servicioData.costoAdicionalesExtra,
      costoConsumosDetallados: servicioData.costoConsumosDetallados,
      metodoPago: servicioData.metodoPago,
      habitacion: servicioData.habitacion,
      adicionales: servicioData.adicionales,
      consumo: servicioData.consumo,
      notas: servicioData.notasServicio || servicioData.notas,
      notasServicio: servicioData.notasServicio,
      observacionModelo: servicioData.observacionModelo,
      estado: servicioData.estado,
      motivoCancelacion: servicioData.motivoCancelacion,
      agendamientoId: servicioData.agendamientoId,
      tiemposAdicionales: servicioData.tiemposAdicionales,
      adicionalesExtra: servicioData.adicionalesExtra,
      consumosDetallados: servicioData.consumosDetallados,
    };

    const historialActualizado = [...cliente.historialServicios, nuevoServicio];

    await actualizarCliente(cliente.id, {
      totalServicios: cliente.totalServicios + 1,
      totalGastado: cliente.totalGastado + nuevoServicio.monto,
      ultimaVisita: new Date(),
      historialServicios: historialActualizado,
    });
  };

  const agregarObservacionModelo = async (telefono: string, modeloNombre: string, modeloEmail: string, observacion: string, rating?: number, tipo?: 'positiva' | 'negativa' | 'neutral') => {
    const cliente = clientes.find(c => c.telefono === telefono);
    if (!cliente) return;

    const nuevaObservacion: ObservacionModelo = {
      id: crypto.randomUUID(),
      modeloNombre,
      modeloEmail,
      fecha: new Date().toISOString(),
      observacion,
      rating,
      tipo,
    };

    const observacionesActualizadas = [...(cliente.observaciones || []), nuevaObservacion];

    await actualizarCliente(cliente.id, {
      observaciones: observacionesActualizadas,
    });
  };

  const obtenerHistorialCliente = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.historialServicios : [];
  };

  const obtenerObservacionesCliente = (telefono: string) => {
    const cliente = clientes.find(c => c.telefono === telefono);
    return cliente ? (cliente.observaciones || []) : [];
  };

  const obtenerNotasServiciosPrevios = (telefono: string) => {
    const cliente = clientes.find(c => c.telefono === telefono);
    return cliente ? cliente.historialServicios.map(s => s.notas || '').filter(n => n) : [];
  };

  const obtenerEstadisticasCliente = (telefono: string) => {
    const cliente = clientes.find(c => c.telefono === telefono);
    if (!cliente) return {
      totalServicios: 0,
      totalGastado: 0,
      promedioGasto: 0,
    };

    const totalServicios = cliente.totalServicios;
    const totalGastado = cliente.totalGastado;
    
    // Validar que haya servicios antes de intentar reduce
    const servicioMasReciente = cliente.historialServicios.length > 0
      ? cliente.historialServicios.reduce((max, servicio) => {
          return new Date(servicio.fecha) > new Date(max.fecha) ? servicio : max;
        }, { fecha: '1970-01-01T00:00:00Z' }).fecha
      : '1970-01-01T00:00:00Z';
    
    const modeloFrecuente = cliente.historialServicios.length > 0
      ? cliente.historialServicios.reduce((acc, servicio) => {
          const modelo = servicio.modeloNombre;
          acc[modelo] = (acc[modelo] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number })
      : {};
    
    const promedioGasto = totalGastado / totalServicios || 0;

    return {
      totalServicios,
      totalGastado,
      servicioMasReciente: new Date(servicioMasReciente),
      modeloFrecuente: Object.keys(modeloFrecuente).length > 0
        ? Object.keys(modeloFrecuente).reduce((a, b) => modeloFrecuente[a] > modeloFrecuente[b] ? a : b)
        : undefined,
      promedioGasto,
    };
  };

  return (
    <ClientesContext.Provider
      value={{
        clientes,
        agregarCliente,
        actualizarCliente,
        buscarPorTelefono,
        buscarPorEmail,
        buscarClientes,
        obtenerOCrearCliente,
        registrarServicio,
        agregarServicioACliente,
        agregarObservacionModelo,
        obtenerHistorialCliente,
        obtenerObservacionesCliente,
        obtenerNotasServiciosPrevios,
        obtenerEstadisticasCliente,
        isLoading,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    throw new Error('useClientes must be used within a ClientesProvider');
  }
  return context;
}