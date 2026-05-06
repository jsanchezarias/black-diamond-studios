import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
import { notificarClienteBloqueado } from './NotificacionesHelpers';

export interface ServicioCliente {
  id: string;
  fecha: string;
  modeloNombre: string;
  modeloEmail?: string;
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
  observacionModelo?: string;
  estado?: 'completado' | 'cancelado' | 'no_show';
  motivoCancelacion?: string;
  agendamientoId?: number;
  tiemposAdicionales?: Array<{ tiempo: string; costo: number; timestamp: Date }>;
  adicionalesExtra?: Array<{ descripcion: string; costo: number; comprobante?: string; timestamp: Date }>;
  consumosDetallados?: Array<{ descripcion: string; costo: number; cantidad: number; timestamp: Date }>;
}

export interface ObservacionModelo {
  id: string;
  modeloNombre: string;
  modeloEmail: string;
  fecha: string;
  observacion: string;
  rating?: number;
  tipo?: 'positiva' | 'negativa' | 'neutral';
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
  notas?: string;
  observaciones?: ObservacionModelo[];
  rating?: number;
  historialServicios: ServicioCliente[];
  userId?: string;
  fechaRegistro: Date;
  ultimaVisita?: Date;
  totalServicios: number;
  totalGastado: number;
  modelosFrecuentes?: Array<{ modeloNombre: string; cantidad: number }>;
  serviciosFrecuentes?: Array<{ tipoServicio: string; cantidad: number }>;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  fechaBloqueo?: string;
  bloqueadoPor?: string;
  multasPendientes?: number;
  totalNoShows?: number;
  // ── Nuevas columnas de estadísticas ─────────────────────────────────────────
  total_visitas?: number;
  total_gastado_col?: number;
  ultimo_agendamiento?: string;
  es_vip?: boolean;
  como_nos_conocio?: string;
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
  cargarClientes: () => Promise<void>;
}

// Convierte fila de Supabase (snake_case) al tipo Cliente (camelCase)
function dbRowToCliente(row: any): Cliente {
  return {
    id: row.id,
    telefono: row.telefono,
    nombre: row.nombre,
    nombreUsuario: row.nombre_usuario ?? row.nombreUsuario ?? '',
    email: row.email,
    fechaNacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento) : undefined,
    ciudad: row.ciudad,
    preferencias: row.preferencias,
    notas: row.notas,
    observaciones: row.observaciones ?? [],
    rating: row.rating,
    historialServicios: row.historial_servicios ?? row.historialServicios ?? [],
    userId: row.user_id ?? row.auth_user_id ?? row.userId,
    // ✅ Fallback para diferentes nombres de columna de fecha
    fechaRegistro: new Date(row.fecha_registro || row.created_at || row.fecha_creacion || Date.now()),
    ultimaVisita: row.ultima_visita ? new Date(row.ultima_visita) : (row.ultimaVisita ? new Date(row.ultimaVisita) : undefined),
    totalServicios: row.total_servicios ?? row.totalServicios ?? 0,
    totalGastado: row.total_gastado ?? row.totalGastado ?? 0,
    bloqueado: row.bloqueado ?? false,
    motivoBloqueo: row.motivo_bloqueo ?? row.motivoBloqueo,
    fechaBloqueo: row.fecha_bloqueo ?? row.fechaBloqueo,
    bloqueadoPor: row.bloqueado_por ?? row.bloqueadoPor,
    multasPendientes: row.multas_pendientes ?? row.multasPendientes ?? 0,
    totalNoShows: row.total_no_shows ?? row.totalNoShows ?? 0,
    total_visitas: row.total_visitas ?? 0,
    total_gastado_col: row.total_gastado ?? 0,
    ultimo_agendamiento: row.ultimo_agendamiento ?? undefined,
    es_vip: row.es_vip ?? false,
    como_nos_conocio: row.como_nos_conocio ?? undefined,
  };
}

// Convierte Partial<Cliente> a columnas snake_case para Supabase
function clienteToDbRow(cliente: Partial<Cliente> & { password?: string }): Record<string, any> {
  const row: Record<string, any> = {};
  if (cliente.nombre !== undefined) row.nombre = cliente.nombre;
  if (cliente.nombreUsuario !== undefined) row.nombre_usuario = cliente.nombreUsuario;
  if (cliente.telefono !== undefined) row.telefono = cliente.telefono;
  if (cliente.email !== undefined) row.email = cliente.email;
  if (cliente.fechaNacimiento !== undefined) row.fecha_nacimiento = cliente.fechaNacimiento instanceof Date ? cliente.fechaNacimiento.toISOString() : cliente.fechaNacimiento;
  if (cliente.ciudad !== undefined) row.ciudad = cliente.ciudad;
  if (cliente.preferencias !== undefined) row.preferencias = cliente.preferencias;
  if (cliente.notas !== undefined) row.notas = cliente.notas;
  if (cliente.observaciones !== undefined) row.observaciones = cliente.observaciones;
  if (cliente.rating !== undefined) row.rating = cliente.rating;
  if (cliente.historialServicios !== undefined) row.historial_servicios = cliente.historialServicios;
  if (cliente.ultimaVisita !== undefined) row.ultima_visita = cliente.ultimaVisita instanceof Date ? cliente.ultimaVisita.toISOString() : cliente.ultimaVisita;
  if (cliente.totalServicios !== undefined) row.total_servicios = cliente.totalServicios;
  if (cliente.totalGastado !== undefined) row.total_gastado = cliente.totalGastado;
  if (cliente.bloqueado !== undefined) row.bloqueado = cliente.bloqueado;
  if (cliente.motivoBloqueo !== undefined) row.motivo_bloqueo = cliente.motivoBloqueo;
  if (cliente.fechaBloqueo !== undefined) row.fecha_bloqueo = cliente.fechaBloqueo;
  if (cliente.bloqueadoPor !== undefined) row.bloqueado_por = cliente.bloqueadoPor;
  if (cliente.multasPendientes !== undefined) row.multas_pendientes = cliente.multasPendientes;
  if (cliente.totalNoShows !== undefined) row.total_no_shows = cliente.totalNoShows;
  if (cliente.total_visitas !== undefined) row.total_visitas = cliente.total_visitas;
  if (cliente.total_gastado_col !== undefined) row.total_gastado = cliente.total_gastado_col;
  if (cliente.ultimo_agendamiento !== undefined) row.ultimo_agendamiento = cliente.ultimo_agendamiento;
  if (cliente.es_vip !== undefined) row.es_vip = cliente.es_vip;
  if (cliente.como_nos_conocio !== undefined) row.como_nos_conocio = cliente.como_nos_conocio;
  return row;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const channel = supabase
      .channel('clientes-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clientes' }, (payload) => {
        setClientes(prev => [dbRowToCliente(payload.new), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clientes' }, (payload) => {
        setClientes(prev => prev.map(c => c.id === payload.new.id ? dbRowToCliente(payload.new) : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clientes' }, (payload) => {
        setClientes(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // ✅ CAMBIO: Usar created_at que es estándar

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando clientes:', error.message);
        setClientes([]);
        return;
      }

      const clientesValidos = (data ?? []).map(dbRowToCliente);
      setClientes(clientesValidos);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado cargando clientes:', err);
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const agregarCliente = async (
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'totalServicios' | 'totalGastado' | 'historialServicios' | 'observaciones'> & { password?: string }
  ): Promise<Cliente> => {
    const dbRow = {
      ...clienteToDbRow(clienteData),
      historial_servicios: [],
      observaciones: [],
      total_servicios: 0,
      total_gastado: 0,
      fecha_registro: new Date().toISOString(),
      bloqueado: false,
    };
    // No guardar password en la tabla directamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (dbRow as any).password;

    const { data, error } = await supabase
      .from('clientes')
      .insert(dbRow)
      .select()
      .single();

    if (error) throw new Error(`Error al agregar cliente: ${error.message}`);

    const nuevoCliente = dbRowToCliente(data);
    setClientes(prev => [nuevoCliente, ...prev]);
    return nuevoCliente;
  };

  const actualizarCliente = async (id: string, clienteData: Partial<Cliente>) => {
    const clienteAnterior = clientes.find(c => c.id === id);
    const dbRow = clienteToDbRow(clienteData);

    const { error } = await supabase
      .from('clientes')
      .update(dbRow)
      .eq('id', id);

    if (error) throw new Error(`Error al actualizar cliente: ${error.message}`);

    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...clienteData } : c));

    if (clienteData.bloqueado && clienteAnterior && !clienteAnterior.bloqueado && clienteAnterior.email) {
      notificarClienteBloqueado({
        clienteEmail: clienteAnterior.email,
        motivo: clienteData.motivoBloqueo || 'Violación de políticas del establecimiento',
      }).catch(err => { if (process.env.NODE_ENV === 'development') console.error('Error notificando cliente bloqueado:', err); });
    }
  };

  const buscarPorTelefono = (telefono: string) =>
    clientes.find(c => c.telefono === telefono);

  const buscarPorEmail = (email: string) =>
    clientes.find(c => c.email === email);

  const buscarClientes = (query: string) =>
    clientes.filter(c =>
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.telefono.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
    );

  const obtenerOCrearCliente = async (nombre: string, telefono: string, email?: string): Promise<Cliente> => {
    const existente = buscarPorTelefono(telefono);
    if (existente) return existente;

    return agregarCliente({
      nombre,
      telefono,
      nombreUsuario: nombre.toLowerCase().replace(/\s+/g, ''),
      email,
    });
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

  const agregarObservacionModelo = async (
    telefono: string,
    modeloNombre: string,
    modeloEmail: string,
    observacion: string,
    rating?: number,
    tipo?: 'positiva' | 'negativa' | 'neutral'
  ) => {
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

    await actualizarCliente(cliente.id, {
      observaciones: [...(cliente.observaciones || []), nuevaObservacion],
    });
  };

  const obtenerHistorialCliente = (clienteId: string) =>
    clientes.find(c => c.id === clienteId)?.historialServicios ?? [];

  const obtenerObservacionesCliente = (telefono: string) =>
    clientes.find(c => c.telefono === telefono)?.observaciones ?? [];

  const obtenerNotasServiciosPrevios = (telefono: string) =>
    clientes.find(c => c.telefono === telefono)
      ?.historialServicios.map(s => s.notas || '').filter(Boolean) ?? [];

  const obtenerEstadisticasCliente = (telefono: string) => {
    const cliente = clientes.find(c => c.telefono === telefono);
    if (!cliente) return { totalServicios: 0, totalGastado: 0, promedioGasto: 0 };

    const { totalServicios, totalGastado, historialServicios } = cliente;

    const servicioMasReciente = historialServicios.length > 0
      ? new Date(historialServicios.reduce((max, s) => new Date(s.fecha) > new Date(max.fecha) ? s : max, historialServicios[0]).fecha)
      : undefined;

    const conteoModelos = historialServicios.reduce((acc, s) => {
      acc[s.modeloNombre] = (acc[s.modeloNombre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const modeloFrecuente = Object.keys(conteoModelos).length > 0
      ? Object.keys(conteoModelos).reduce((a, b) => conteoModelos[a] > conteoModelos[b] ? a : b)
      : undefined;

    return {
      totalServicios,
      totalGastado,
      servicioMasReciente,
      modeloFrecuente,
      promedioGasto: totalServicios > 0 ? totalGastado / totalServicios : 0,
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
        cargarClientes,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    return {
      clientes: [],
      agregarCliente: async () => { throw new Error('ClientesProvider no disponible'); },
      actualizarCliente: async () => {},
      buscarPorTelefono: () => undefined,
      buscarPorEmail: () => undefined,
      buscarClientes: () => [],
      obtenerOCrearCliente: async () => { throw new Error('ClientesProvider no disponible'); },
      registrarServicio: async () => {},
      agregarServicioACliente: async () => {},
      agregarObservacionModelo: async () => {},
      obtenerHistorialCliente: () => [],
      obtenerObservacionesCliente: () => [],
      obtenerNotasServiciosPrevios: () => [],
      obtenerEstadisticasCliente: () => ({ totalServicios: 0, totalGastado: 0, promedioGasto: 0 }),
      isLoading: false,
      cargarClientes: async () => {},
    };
  }
  return context;
}
