import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info';
// import { createClient } from '@supabase/supabase-js';
import { CacheSystem } from '../../utils/cache';

// Interfaz de modelo con campos de archivo
export interface Modelo {
  id: string; // ✅ Cambiado de number a string (UUID de Supabase)
  nombre: string;
  nombreArtistico: string;
  cedula: string;
  telefono: string;
  direccion: string;
  email: string;
  password: string;
  fotoPerfil: string;
  fotosAdicionales?: string[];
  gallery?: string[]; // ✅ NUEVO: Alias para fotosAdicionales usado en LandingPage
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
  porcentajeComision?: number; // % de comisión para la modelo
  servicios: number;
  ingresos: number;
  fechaArchivado?: string;
  motivoArchivo?: string;
  observacionesRechazo?: string;
  fechaRechazo?: string;
  videos?: string[];
  serviciosDisponibles?: { name: string, duration: string, price: string, priceHome?: string, description: string }[];
  enPeriodo?: boolean; // ✅ NUEVO: Indica si la modelo está en un período activo
  servicios_modelo?: any[]; // ✅ NUEVO: Servicios específicos de la modelo
  modelo_fotos?: any[]; // ✅ fotos desde join Supabase
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
  eliminarModelo: (id: string) => void;
  archivarModelo: (id: string, motivo?: string) => void;
  restaurarModelo: (id: string) => void;
  actualizarModelo: (id: string, datos: Partial<Modelo>) => void;
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
      const cacheData = CacheSystem.get<{activos: Modelo[], archivados: Modelo[]}>('modelos_v3');
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
          // Si hay algún cambio, invalidar caché y recargar desde BD
          CacheSystem.clear('modelos_v3');
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
          CacheSystem.clear('modelos_v3');
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
        .select(`
          *,
          servicios_modelo!servicios_modelo_modelo_id_fkey (
            id, nombre, precio_sede, precio_domicilio, activo, duracion
          ),
          modelo_fotos (*)
        `)
        .eq('role', 'modelo')
        .limit(200);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error cargando modelos:', error);
        
        // ✅ FALLBACK: Usar datos mock si Supabase falla
        setModelos([
          {
            id: 'mock-1',
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
              const pid = Number(servicio.politica_id);
              if (!politicasConServicios.has(pid)) {
                politicasConServicios.set(pid, []);
              }
              politicasConServicios.get(pid)!.push(servicio);
            });
            
          }
        } catch {
          // silently ignore — tablas pueden no existir aún
        }
        
        // 🌸 OPTIMIZADO: Cargar modelos en período activo hoy
        let modelosEnPeriodo = new Set<string>();
        try {
          const hoy = new Date().toISOString().split('T')[0];
          const { data: periodosActivos } = await supabase
            .from('periodos_modelo')
            .select('modelo_id')
            .eq('activo', true)
            .gte('fecha_fin', hoy)
            .lte('fecha_inicio', hoy);
            
          if (periodosActivos) {
            periodosActivos.forEach(p => modelosEnPeriodo.add(p.modelo_id));
          }
        } catch {
          // silently ignore
        }

        // Convertir datos de Supabase al formato del contexto
        const modelosData: Modelo[] = usuarios.map((usuario, _index) => {
          // ✅ OPTIMIZADO: Reducir logs en producción
          // Solo loguear información crítica, no cada campo de cada usuario
          
          // ✅ Obtener la política tarifaria de esta modelo
          const rawPoliticaId = usuario.politica_tarifa || usuario.politicaTarifa;
          const politicaTarifaId = rawPoliticaId ? Number(rawPoliticaId) : 2; // Default: Estándar
          const serviciosPolitica = politicasConServicios.get(politicaTarifaId) || [];
          
          // Formatear servicios al formato de la landing page
          const serviciosFormateados = serviciosPolitica.map(s => ({
            name: s.nombre,
            duration: s.duracion,
            price: (s.precio_sede || 0).toLocaleString('es-CO'),
            priceHome: s.precio_domicilio ? (s.precio_domicilio || 0).toLocaleString('es-CO') : undefined,
            description: s.descripcion || ''
          }));
          
          // Manejar tanto snake_case como camelCase para compatibilidad
          const modelo: Modelo = {
            id: usuario.id, // ✅ ID real de la base de datos (UUID)
            nombre: usuario.nombre || 'Sin nombre',
            nombreArtistico: usuario.nombreArtistico || usuario.nombre_artistico || usuario.nombreartistico || usuario.nombre || 'Sin nombre',
            cedula: usuario.cedula || '',
            telefono: usuario.telefono || '',
            direccion: usuario.direccion || '',
            email: usuario.email,
            password: '', // No guardamos contraseñas en el contexto
            fotoPerfil: usuario.fotoPerfil || usuario.foto_perfil || usuario.fotoperfil || usuario.foto_url || usuario.modelo_fotos?.find((f: any) => f.es_principal)?.url || usuario.modelo_fotos?.[0]?.url || fotosPrincipalesMap.get(usuario.id) || '',
            fotosAdicionales: fotosAdicionalesMap.get(usuario.id) || usuario.modelo_fotos?.filter((f: any) => !f.es_principal).map((f: any) => f.url) || usuario.fotosAdicionales || usuario.fotosadicionales || [],
            gallery: [], // Se calculará dinámicamente o se llenará abajo
            modelo_fotos: usuario.modelo_fotos || [],
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
            enPeriodo: modelosEnPeriodo.has(usuario.id), // 🌸
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
            servicios_modelo: usuario.servicios_modelo || usuario['servicios_modelo!servicios_modelo_modelo_id_fkey'] || [], 
          };

          // ✅ UNIFICAR GALERÍA: Combinar todas las fuentes posibles de fotos en un array único y limpio
          const rawPhotos = [
            modelo.fotoPerfil,
            ...(modelo.fotosAdicionales || []),
            ...(usuario.modelo_fotos?.map((f: any) => f.url) || []),
            ...(fotosAdicionalesMap.get(usuario.id) || []),
            fotosPrincipalesMap.get(usuario.id)
          ];
          
          modelo.gallery = Array.from(new Set(rawPhotos.filter(Boolean)));
          
          // Asegurar que la foto de perfil sea la primera si existe
          if (modelo.fotoPerfil && modelo.gallery.includes(modelo.fotoPerfil)) {
            modelo.gallery = [modelo.fotoPerfil, ...modelo.gallery.filter(u => u !== modelo.fotoPerfil)];
          }
          
          return modelo;
        });

        // ✅ Separar modelos activos de archivados
        const modelosActivos = modelosData.filter(m => !m.fechaArchivado);
        const modelosArchivados = modelosData.filter(m => m.fechaArchivado);

        // ✅ NUEVO: Actualizar el estado con los datos frescos
        setModelos(modelosActivos);
        setModelosArchivadas(modelosArchivados);

        // ✅ NUEVO: Guardar en caché para futuras cargas instantáneas
        CacheSystem.set('modelos_v3', {
          activos: modelosActivos,
          archivados: modelosArchivados
        }, 10); // ✅ Caché por 10 minutos (era 2 horas — causaba que modelos nuevas no aparecieran)

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
    const newId = crypto.randomUUID();
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

  const eliminarModelo = async (id: string) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) return;

    try {
      // Archivar en vez de borrar — preserva historial de pagos y agendamientos
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({
          estado: 'archivado',
          fecha_archivado: new Date().toISOString(),
        })
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (dbError) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error archivando modelo:', dbError);
        throw dbError;
      }

      // Actualizar estado local
      setModelos(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error archivando modelo:', error);
      throw error;
    }
  };

  const archivarModelo = async (id: string, motivo?: string) => {
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

  const restaurarModelo = async (id: string) => {
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

  const actualizarModelo = async (id: string, datos: Partial<Modelo>) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) {
      console.warn('⚠️ No se encontró la modelo localmente con ID:', id);
      return;
    }

    console.log('🔄 Iniciando actualización de modelo:', { id, nombre: modelo.nombre });

    try {
      // PASO 1: Obtener el UUID del usuario en la tabla pública
      // Usamos el email como identificador único confiable
      const { data: usuarioDB, error: findError } = await supabase
        .from('usuarios')
        .select('id, email, role')
        .eq('email', modelo.email)
        .single();

      if (findError || !usuarioDB) {
        console.error('❌ Error buscando usuario en BD:', findError);
        throw new Error('Usuario no encontrado en la base de datos pública.');
      }

      const targetUserId = usuarioDB.id;
      console.log('🎯 UUID encontrado:', targetUserId);

      // PASO 2: Separar authData (email/pass) de publicData (resto de campos)
      const authData: Record<string, string> = {};
      const publicData: Record<string, any> = {};

      const cambioEmail = datos.email && datos.email !== modelo.email;
      const cambioPassword = datos.password && datos.password !== (modelo as any).password;
      
      if (cambioEmail) authData.email = datos.email!;
      if (cambioPassword) authData.password = datos.password!;

      // Mapeo estandarizado a snake_case (según Causa D)
      if (datos.nombre !== undefined) publicData.nombre = datos.nombre;
      if (datos.nombreArtistico !== undefined) publicData.nombre_artistico = datos.nombreArtistico;
      if (datos.cedula !== undefined) publicData.cedula = datos.cedula;
      if (datos.telefono !== undefined) publicData.telefono = datos.telefono;
      if (datos.direccion !== undefined) publicData.direccion = datos.direccion;
      
      // Foto de perfil - actualizamos todos los campos por compatibilidad
      if (datos.fotoPerfil !== undefined) {
        publicData.foto_url = datos.fotoPerfil;
        publicData.foto_perfil = datos.fotoPerfil;
        publicData.fotoperfil = datos.fotoPerfil;
        publicData.fotoPerfil = datos.fotoPerfil;
      }

      if (datos.fotosAdicionales !== undefined) publicData.fotosadicionales = datos.fotosAdicionales;
      
      if (datos.documentoFrente !== undefined) publicData.documento_frente = datos.documentoFrente;
      if (datos.documentoReverso !== undefined) publicData.documento_reverso = datos.documentoReverso;
      if (datos.documento_tipo !== undefined) publicData.documento_tipo = datos.documento_tipo;
      if (datos.documento_numero !== undefined) publicData.documento_numero = datos.documento_numero;
      if (datos.documento_verificado !== undefined) publicData.documento_verificado = datos.documento_verificado;
      if (datos.documento_fecha_subida !== undefined) publicData.documento_fecha_subida = datos.documento_fecha_subida;
      
      if (datos.edad !== undefined) publicData.edad = parseInt(String(datos.edad)) || null;
      if (datos.altura !== undefined) publicData.estatura = datos.altura; // Mapeo altura -> estatura
      if (datos.medidas !== undefined) publicData.medidas = datos.medidas;
      if (datos.descripcion !== undefined) publicData.descripcion = datos.descripcion;
      if (datos.sede !== undefined) publicData.sede = datos.sede;
      if (datos.videos !== undefined) publicData.videos = datos.videos;
      
      if (datos.activa !== undefined) {
        publicData.estado = datos.activa ? 'activo' : 'inactivo';
      } else if (cambioEmail) {
        publicData.estado = 'activo';
      }
      
      if (datos.disponible !== undefined) publicData.disponible = datos.disponible;
      if (datos.domicilio !== undefined) publicData.domicilio = datos.domicilio;
      if (datos.politicaTarifa !== undefined) publicData.politica_tarifa = parseInt(String(datos.politicaTarifa)) || 1;
      if (datos.porcentajeComision !== undefined) publicData.porcentaje_comision = parseFloat(String(datos.porcentajeComision)) || 50;

      publicData.updated_at = new Date().toISOString();
      publicData.role = 'modelo';

      console.log('📡 Enviando actualización a Edge Function...', { authData: Object.keys(authData), publicData: Object.keys(publicData) });

      // PASO 3: Llamar Edge Function admin-update-user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa.');

      const response = await fetch('https://kzdjravwcjummegxxrkd.supabase.co/functions/v1/admin-update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetUserId, authData, publicData }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error en Edge Function:', result);
        throw new Error(result.error || result.message || 'Error al actualizar el usuario');
      }

      console.log('✅ Actualización exitosa:', result);

      // Actualizar estado local
      setModelos(prev => prev.map(m => (m.id === id ? { ...m, ...datos } : m)));
      
      // Invalidar caché para forzar recarga en otros componentes
      CacheSystem.clear('modelos_v3');
      
    } catch (error: any) {
      console.error('🔥 Error fatal en actualizarModelo:', error);
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
