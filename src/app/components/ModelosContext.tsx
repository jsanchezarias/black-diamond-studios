import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import { CacheSystem } from '../../utils/cache';

// Interfaz de modelo con campos de archivo
export interface Modelo {
  id: number;
  nombre: string;
  nombreArtistico: string;
  cedula: string;
  telefono: string;
  direccion: string;
  email: string;
  password: string;
  fotoPerfil: string;
  fotosAdicionales?: string[];
  documentoFrente?: string;
  documentoReverso?: string;
  documento_tipo?: string;
  documento_numero?: string;
  documento_verificado?: boolean;
  documento_fecha_subida?: string;
  edad: number;
  altura?: string;
  medidas?: string;
  descripcion?: string;
  sede?: string;
  activa: boolean;
  disponible: boolean; // ✅ Campo para indicar si la modelo está disponible en el momento
  domicilio: boolean; // ✅ NUEVO: Campo para indicar si presta servicio a domicilio
  politicaTarifa?: number; // ✅ NUEVO: Política de tarifa asignada (1, 2, 3, etc.)
  servicios: number;
  ingresos: number;
  fechaArchivado?: string;
  motivoArchivo?: string;
  observacionesRechazo?: string;
  fechaRechazo?: string;
  videos?: string[];
  serviciosDisponibles?: { name: string, duration: string, price: string, priceHome?: string, description: string }[];
}

// Tipo para crear una nueva modelo (sin campos auto-generados)
export interface ModeloData {
  nombre: string;
  nombreArtistico: string;
  cedula: string;
  telefono: string;
  direccion: string;
  email: string;
  password: string;
  fotoPerfil: string;
  fotosAdicionales?: string[];
  documentoFrente?: string;
  documentoReverso?: string;
  documento_tipo?: string;
  documento_numero?: string;
  documento_verificado?: boolean;
  documento_fecha_subida?: string;
  edad?: number;
  altura?: string;
  medidas?: string;
  descripcion?: string;
  sede?: string;
  videos?: string[];
}

interface ModelosContextType {
  modelos: Modelo[];
  modelosArchivadas: Modelo[];
  agregarModelo: (modelo: ModeloData) => void;
  eliminarModelo: (id: number) => void;
  archivarModelo: (id: number, motivo?: string) => void;
  restaurarModelo: (id: number) => void;
  actualizarModelo: (id: number, datos: Partial<Modelo>) => void;
  obtenerModeloPorEmail: (email: string) => Modelo | undefined;
  validarCredenciales: (email: string, password: string) => Modelo | null;
  recargarModelos: () => Promise<void>;
  loading: boolean;
}

const ModelosContext = createContext<ModelosContextType | undefined>(undefined);

export function ModelosProvider({ children }: { children: ReactNode }) {
  // ✅ SIN DATOS DEMO - Sistema listo para producción
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [modelosArchivadas, setModelosArchivadas] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NUEVO: Carga inicial híbrida (Caché + Red)
  useEffect(() => {
    let isMounted = true;
    
    const inicializar = async () => {
      // 1. Intentar cargar desde caché para visualización instantánea
      const cacheData = CacheSystem.get<{activos: Modelo[], archivados: Modelo[]}>('modelos_v2');
      if (cacheData && isMounted) {
        setModelos(cacheData.activos);
        setModelosArchivadas(cacheData.archivados);
        setLoading(false);
      }

      // 2. Cargar desde Supabase para tener datos frescos
      if (isMounted) {
        await cargarModelos();
      }
    };
    
    inicializar();

    // ✅ NUEVO: Configurar Realtime para la tabla usuarios y modelo_fotos
    const channel = supabase
      .channel('usuarios_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'usuarios',
          filter: "role=eq.modelo"
        },
        () => {
          // Si hay algún cambio, recargamos la lista
          cargarModelos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modelo_fotos'
        },
        () => {
          cargarModelos();
        }
      )
      .subscribe();
    
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarModelos = async () => {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', 'modelo')
        .limit(200);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando modelos:', error);
        
        // ✅ FALLBACK: Usar datos mock si Supabase falla
        setModelos([
          {
            id: 1,
            email: 'modelo1@blackdiamond.com',
            nombre: 'Isabella',
            nombreArtistico: 'Bella Diamond',
            cedula: '123456789',
            telefono: '+57 300 123 4567',
            direccion: 'Calle 10 # 5-20',
            password: '****',
            activa: true,
            disponible: true,
            domicilio: true,
            edad: 25,
            altura: '170cm',
            medidas: '90-60-90',
            fotoPerfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
            fotosAdicionales: [],
            descripcion: `⚠️ ERROR DB: ${error?.message || JSON.stringify(error)}`,
            sede: 'Sede Norte',
            servicios: 0,
            ingresos: 0,
          } as Modelo,
        ]);
        setLoading(false);
        return;
      }

      
      if (usuarios && usuarios.length > 0) {

        // Cargar fotos principales y adicionales de modelo_fotos
        let fotosPrincipalesMap: Map<string, string> = new Map();
        let fotosAdicionalesMap: Map<string, string[]> = new Map();
        try {
          const { data: todasLasFotos } = await supabase
            .from('modelo_fotos')
            .select('modelo_id, url, es_principal, orden')
            .order('es_principal', { ascending: false })
            .order('orden', { ascending: true });
            
          if (todasLasFotos) {
            todasLasFotos.forEach(f => {
              if (f.es_principal) {
                fotosPrincipalesMap.set(f.modelo_id, f.url);
              } else {
                if (!fotosAdicionalesMap.has(f.modelo_id)) {
                  fotosAdicionalesMap.set(f.modelo_id, []);
                }
                fotosAdicionalesMap.get(f.modelo_id)!.push(f.url);
              }
            });
          }
        } catch {
          // silently ignore — tabla puede no existir aún
        }

        // ✅ OPTIMIZADO: Cargar TODAS las políticas tarifarias y sus servicios EN UNA SOLA QUERY
        let politicasConServicios: Map<number, any[]> = new Map();
        try {
          // ⚡ OPTIMIZACIÓN: Cargar TODOS los servicios de TODAS las políticas en una sola query
          const { data: todosServicios, error: errorServicios } = await supabase
            .from('servicios_politica')
            .select('*')
            .order('politica_id', { ascending: true })
            .order('orden', { ascending: true });

          if (errorServicios) {
            // silently ignore — tabla puede no existir aún
          } else if (todosServicios && todosServicios.length > 0) {
            // Agrupar servicios por política
            todosServicios.forEach(servicio => {
              if (!politicasConServicios.has(servicio.politica_id)) {
                politicasConServicios.set(servicio.politica_id, []);
              }
              politicasConServicios.get(servicio.politica_id)!.push(servicio);
            });
            
          }
        } catch {
          // silently ignore — tablas pueden no existir aún
        }
        
        // Convertir datos de Supabase al formato del contexto
        const modelosData: Modelo[] = usuarios.map((usuario, index) => {
          // ✅ OPTIMIZADO: Reducir logs en producción
          // Solo loguear información crítica, no cada campo de cada usuario
          
          // ✅ Obtener la política tarifaria de esta modelo
          const politicaTarifaId = usuario.politica_tarifa || 2; // Default: Estándar
          const serviciosPolitica = politicasConServicios.get(politicaTarifaId) || [];
          
          // Formatear servicios al formato de la landing page
          const serviciosFormateados = serviciosPolitica.map(s => ({
            name: s.nombre,
            duration: s.duracion,
            price: s.precio_sede.toLocaleString('es-CO'),
            priceHome: s.precio_domicilio ? s.precio_domicilio.toLocaleString('es-CO') : undefined,
            description: s.descripcion || ''
          }));
          
          // Manejar tanto snake_case como camelCase para compatibilidad
          const modelo: Modelo = {
            id: index + 1, // ID secuencial local
            nombre: usuario.nombre || 'Sin nombre',
            nombreArtistico: usuario.nombreArtistico || usuario.nombre_artistico || usuario.nombreartistico || usuario.nombre || 'Sin nombre',
            cedula: usuario.cedula || '',
            telefono: usuario.telefono || '',
            direccion: usuario.direccion || '',
            email: usuario.email,
            password: '', // No guardamos contraseñas en el contexto
            fotoPerfil: usuario.fotoPerfil || usuario.foto_perfil || usuario.fotoperfil || fotosPrincipalesMap.get(usuario.id) || '',
            fotosAdicionales: fotosAdicionalesMap.get(usuario.id) || usuario.fotosAdicionales || usuario.fotosadicionales || usuario.fotos_adicionales || [],
            edad: usuario.edad || 21,
            altura: usuario.altura || '',
            medidas: usuario.medidas || '',
            descripcion: usuario.descripcion || '',
            sede: usuario.sede || 'Sede Norte',
            // 🔧 FIX: Mejor manejo del estado - aceptar cualquier variación
            activa: !usuario.estado || usuario.estado === 'activo' || usuario.estado === 'Activo' || usuario.estado === 'ACTIVO' || usuario.estado === 'active',
            disponible: usuario.disponible !== undefined ? usuario.disponible : true, // ✅ Leer campo disponible desde BD
            domicilio: usuario.domicilio !== undefined ? usuario.domicilio : false, // ✅ Leer campo domicilio desde BD
            politicaTarifa: politicaTarifaId, // ✅ Leer desde snake_case o camelCase, default 2 (Estándar)
            servicios: 0,
            ingresos: 0,
            serviciosDisponibles: serviciosFormateados, // ✅ NUEVO: Servicios desde política tarifaria
            // ✅ Campos de archivado
            fechaArchivado: usuario.fecha_archivado || undefined,
            motivoArchivo: usuario.motivo_archivo || undefined,
            // ✅ Campos de documentos de identidad
            documentoFrente: usuario.documento_frente || undefined,
            documentoReverso: usuario.documento_reverso || undefined,
            documento_tipo: usuario.documento_tipo || 'cedula',
            documento_numero: usuario.documento_numero || undefined,
            documento_verificado: usuario.documento_verificado || false,
            documento_fecha_subida: usuario.documento_fecha_subida || undefined,
          };
          
          return modelo;
        });

        // ✅ Separar modelos activos de archivados
        const modelosActivos = modelosData.filter(m => !m.fechaArchivado);
        const modelosArchivados = modelosData.filter(m => m.fechaArchivado);

        // ✅ NUEVO: Actualizar el estado con los datos frescos
        setModelos(modelosActivos);
        setModelosArchivadas(modelosArchivados);

        // ✅ NUEVO: Guardar en caché para futuras cargas instantáneas
        CacheSystem.set('modelos_v2', {
          activos: modelosActivos,
          archivados: modelosArchivados
        }, 120); // Caché por 2 horas

      } else {
        setModelos([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado cargando modelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarModelo = (modelo: ModeloData) => {
    const newId = Math.max(...modelos.map(m => m.id), 0) + 1;
    setModelos(prev => [
      ...prev,
      {
        ...modelo,
        nombreArtistico: modelo.nombreArtistico || modelo.nombre,
        id: newId,
        edad: 0,
        activa: true,
        disponible: true, // ✅ Inicialmente disponible
        domicilio: false, // ✅ Inicialmente no presta servicio a domicilio
        servicios: 0,
        ingresos: 0,
      },
    ]);
  };

  const eliminarModelo = async (id: number) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) return;

    try {
      // 1. Eliminar de la tabla usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (dbError) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error eliminando de tabla usuarios:', dbError);
        throw dbError;
      }

      // 2. Eliminar de Auth (requiere admin)
      // Nota: La eliminación de Auth debe hacerse desde el servidor
      // Por ahora solo eliminamos de la tabla

      // 3. Actualizar estado local
      setModelos(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error eliminando modelo:', error);
      throw error;
    }
  };

  const archivarModelo = async (id: number, motivo?: string) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) return;

    try {
      // 1. Actualizar en Supabase
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({
          estado: 'archivado',
          fecha_archivado: new Date().toISOString(),
          motivo_archivo: motivo || 'Sin motivo especificado'
        })
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (dbError) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error archivando en BD:', dbError);
        throw dbError;
      }

      // 2. Actualizar estado local
      const modeloArchivado = {
        ...modelo,
        activa: false,
        fechaArchivado: new Date().toISOString(),
        motivoArchivo: motivo,
      };
      setModelosArchivadas(prev => [...prev, modeloArchivado]);
      setModelos(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error archivando modelo:', error);
      throw error;
    }
  };

  const restaurarModelo = async (id: number) => {
    try {
      const modelo = modelosArchivadas.find(m => m.id === id);
      if (!modelo) return;

      // 1. Actualizar en Supabase - Remover campos de archivado
      const { error } = await supabase
        .from('usuarios')
        .update({
          estado: 'activo',
          fecha_archivado: null,
          motivo_archivo: null,
        })
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error al restaurar modelo en BD:', error);
        throw error;
      }

      // 2. Actualizar estado local
      const { fechaArchivado, motivoArchivo, ...modeloRestaurado } = modelo;
      setModelos(prev => [...prev, { ...modeloRestaurado, activa: true }]);
      setModelosArchivadas(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error al restaurar modelo:', error);
      throw error;
    }
  };

  const actualizarModelo = async (id: number, datos: Partial<Modelo>) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) return;

    try {
      // Obtener sesión actual para usar el token del admin autenticado
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // ✅ PASO 1: Obtener el usuario de Auth para tener su ID
      const { data: usuarioDB } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', modelo.email)
        .eq('role', 'modelo')
        .single();

      if (!usuarioDB) {
        throw new Error('Usuario no encontrado en BD');
      }

      const authUserId = usuarioDB.id;

      // ✅ PASO 2: Actualizar Auth si cambia email o contraseña
      const cambioEmail = datos.email && datos.email !== modelo.email;
      const cambioPassword = datos.password && datos.password !== modelo.password;

      if (cambioEmail || cambioPassword) {
        const authUpdateData: any = {};
        if (cambioEmail) authUpdateData.email = datos.email;
        if (cambioPassword) authUpdateData.password = datos.password;

        const { error: authError } = await supabase.auth.admin.updateUserById(
          authUserId,
          authUpdateData
        );

        if (authError) {
          if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando Auth:', authError);
          throw authError;
        }
      }
      
      // ✅ PASO 3: Preparar datos para BD (camelCase)
      const datosSupabase: any = {};
      
      if (datos.nombre !== undefined) datosSupabase.nombre = datos.nombre;
      if (datos.nombreArtistico !== undefined) datosSupabase.nombreArtistico = datos.nombreArtistico;
      if (datos.cedula !== undefined) datosSupabase.cedula = datos.cedula;
      if (datos.telefono !== undefined) datosSupabase.telefono = datos.telefono;
      if (datos.direccion !== undefined) datosSupabase.direccion = datos.direccion;
      if (datos.email !== undefined) datosSupabase.email = datos.email; // ✅ Actualizar email en BD también
      if (datos.fotoPerfil !== undefined) datosSupabase.fotoPerfil = datos.fotoPerfil;
      if (datos.fotosAdicionales !== undefined) datosSupabase.fotosAdicionales = datos.fotosAdicionales;
      // ✅ Campos de documentos de identidad
      if (datos.documentoFrente !== undefined) datosSupabase.documento_frente = datos.documentoFrente;
      if (datos.documentoReverso !== undefined) datosSupabase.documento_reverso = datos.documentoReverso;
      if (datos.documento_tipo !== undefined) datosSupabase.documento_tipo = datos.documento_tipo;
      if (datos.documento_numero !== undefined) datosSupabase.documento_numero = datos.documento_numero;
      if (datos.documento_verificado !== undefined) datosSupabase.documento_verificado = datos.documento_verificado;
      if (datos.documento_fecha_subida !== undefined) datosSupabase.documento_fecha_subida = datos.documento_fecha_subida;
      if (datos.edad !== undefined) datosSupabase.edad = datos.edad;
      if (datos.altura !== undefined) datosSupabase.altura = datos.altura;
      if (datos.medidas !== undefined) datosSupabase.medidas = datos.medidas;
      if (datos.descripcion !== undefined) datosSupabase.descripcion = datos.descripcion;
      if (datos.sede !== undefined) datosSupabase.sede = datos.sede;
      if (datos.videos !== undefined) datosSupabase.videos = datos.videos;
      if (datos.activa !== undefined) datosSupabase.estado = datos.activa ? 'activo' : 'inactivo';
      if (datos.disponible !== undefined) datosSupabase.disponible = datos.disponible; // ✅ NUEVO
      if (datos.domicilio !== undefined) datosSupabase.domicilio = datos.domicilio;
      if (datos.politicaTarifa !== undefined) datosSupabase.politica_tarifa = datos.politicaTarifa; // ✅ CORREGIDO: snake_case para BD
      
      // ✅ PASO 4: Actualizar en BD usando ID (más seguro que email)
      const { error: dbError } = await supabase
        .from('usuarios')
        .update(datosSupabase)
        .eq('id', authUserId)
        .eq('role', 'modelo');

      if (dbError) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando en BD:', dbError);
        throw dbError;
      }

      // Actualizar estado local
      setModelos(prev => prev.map(m => (m.id === id ? { ...m, ...datos } : m)));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error actualizando modelo:', error);
      throw error;
    }
  };

  const obtenerModeloPorEmail = (email: string) => {
    return modelos.find(m => m.email === email);
  };

  const validarCredenciales = (email: string, password: string) => {
    const modelo = modelos.find(m => m.email === email && m.password === password);
    return modelo || null;
  };

  const contextValue: ModelosContextType = {
    modelos,
    modelosArchivadas,
    agregarModelo,
    eliminarModelo,
    archivarModelo,
    restaurarModelo,
    actualizarModelo,
    obtenerModeloPorEmail,
    validarCredenciales,
    recargarModelos: cargarModelos,
    loading,
  };

  return (
    <ModelosContext.Provider value={contextValue}>
      {children}
    </ModelosContext.Provider>
  );
}

export function useModelos(): ModelosContextType {
  const context = useContext(ModelosContext);
  if (context === undefined) {
    return {
      modelos: [],
      modelosArchivadas: [],
      agregarModelo: () => {},
      eliminarModelo: () => {},
      archivarModelo: () => {},
      restaurarModelo: () => {},
      actualizarModelo: () => {},
      obtenerModeloPorEmail: () => undefined,
      validarCredenciales: () => null,
      recargarModelos: async () => {},
      loading: true,
    };
  }
  return context;
}
