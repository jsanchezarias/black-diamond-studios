import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

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
  // ❌ Removidos: campos que no existen en la tabla
  // documentoFrente: string;
  // documentoReverso: string;
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
  // ❌ Removidos: campos que no existen en la tabla
  // documentoFrente: string;
  // documentoReverso: string;
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
}

const ModelosContext = createContext<ModelosContextType | undefined>(undefined);

export function ModelosProvider({ children }: { children: ReactNode }) {
  // ✅ SIN DATOS DEMO - Sistema listo para producción
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [modelosArchivadas, setModelosArchivadas] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ CORREGIDO: useEffect simplificado sin función anidada
  useEffect(() => {
    let isMounted = true;
    
    const cargarModelosInicial = async () => {
      if (!isMounted) return;
      await cargarModelos();
    };
    
    cargarModelosInicial();
    
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Array vacío - solo ejecutar una vez al montar

  const cargarModelos = async () => {
    try {
      console.log('🔄 Iniciando carga de modelos desde Supabase...');
      
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', 'modelo');

      if (error) {
        console.error('❌ Error cargando modelos:', error);
        setLoading(false);
        return;
      }

      console.log(`📊 Modelos encontradas en BD: ${usuarios?.length || 0}`);
      
      if (usuarios && usuarios.length > 0) {
        console.log('🔍 DEBUG - Primera modelo en BD:', usuarios[0]);
        console.log('🔍 DEBUG - Columnas disponibles:', Object.keys(usuarios[0]));
        
        // ✅ Cargar TODAS las políticas tarifarias y sus servicios
        let politicasConServicios: Map<number, any[]> = new Map();
        try {
          // 1. Obtener todas las políticas tarifarias
          const { data: politicas, error: errorPoliticas } = await supabase
            .from('politicas_tarifas')
            .select('id, nombre')
            .order('id', { ascending: true });

          if (errorPoliticas) {
            // ✅ Manejo seguro del error - puede ser AbortError u otro tipo
            const errorMsg = errorPoliticas instanceof Error 
              ? errorPoliticas.message 
              : String(errorPoliticas);
            console.warn('⚠️ Error cargando políticas tarifarias:', errorMsg);
          } else {
            console.log(`📋 Políticas tarifarias encontradas: ${politicas?.length || 0}`);
            
            // 2. Para cada política, cargar sus servicios
            for (const politica of politicas || []) {
              const { data: servicios, error: errorServicios } = await supabase
                .from('servicios_politica')
                .select('*')
                .eq('politica_id', politica.id)
                .order('orden', { ascending: true });

              if (!errorServicios && servicios) {
                politicasConServicios.set(politica.id, servicios);
                console.log(`  💰 Política ${politica.id} (${politica.nombre}): ${servicios.length} servicios`);
              }
            }
          }
        } catch (politicasError) {
          console.warn('⚠️ Error cargando políticas (las tablas pueden no existir aún):', politicasError);
        }
        
        // Convertir datos de Supabase al formato del contexto
        const modelosData: Modelo[] = usuarios.map((usuario, index) => {
          // 🔍 DEBUG: Ver el estado raw
          console.log(`🔍 Usuario ${usuario.email}:`, {
            estado: usuario.estado,
            estado_raw: JSON.stringify(usuario.estado),
            tipo_estado: typeof usuario.estado,
            politica_tarifa: usuario.politica_tarifa,
            fecha_archivado: usuario.fecha_archivado,
            todas_columnas: Object.keys(usuario)
          });
          
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
            nombreArtistico: usuario.nombreArtistico || usuario.nombre_artistico || usuario.nombre || 'Sin nombre',
            cedula: usuario.cedula || '',
            telefono: usuario.telefono || '',
            direccion: usuario.direccion || '',
            email: usuario.email,
            password: '', // No guardamos contraseñas en el contexto
            fotoPerfil: usuario.fotoPerfil || usuario.foto_perfil || '',
            fotosAdicionales: usuario.fotosAdicionales || usuario.fotos_adicionales || [],
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
          };
          
          console.log(`👤 Modelo cargada: ${modelo.nombreArtistico} - Política: ${politicaTarifaId} - Activa: ${modelo.activa} - Disponible: ${modelo.disponible} - Archivada: ${!!modelo.fechaArchivado} - Servicios: ${serviciosFormateados.length} - Foto: ${modelo.fotoPerfil?.substring(0, 50)}...`);
          
          return modelo;
        });

        // ✅ Separar modelos activos de archivados
        const modelosActivos = modelosData.filter(m => !m.fechaArchivado);
        const modelosArchivados = modelosData.filter(m => m.fechaArchivado);

        setModelos(modelosActivos);
        setModelosArchivadas(modelosArchivados);
        console.log(`✅ Cargadas ${modelosActivos.length} modelos activos y ${modelosArchivados.length} archivados desde Supabase`);
        console.log('📋 Modelos activos:', modelosActivos.map(m => `${m.nombreArtistico} (${m.email}) - activa:${m.activa}`).join(', '));
        if (modelosArchivados.length > 0) {
          console.log('📦 Modelos archivados:', modelosArchivados.map(m => `${m.nombreArtistico} (${m.email})`).join(', '));
        }
        
        // 🔍 DEBUG DETALLADO: Verificar Natalia y Xiomara específicamente
        const natalia = modelosData.find(m => m.email === 'natalia@blackdiamond.com');
        const xiomara = modelosData.find(m => m.email === 'xiomara@blackdiamond.com');
        
        if (natalia) {
          console.log('🔍 DEBUG - NATALIA:', {
            nombre: natalia.nombreArtistico,
            email: natalia.email,
            activa: natalia.activa,
            disponible: natalia.disponible,
            fechaArchivado: natalia.fechaArchivado,
            estado: natalia.fechaArchivado ? '📦 ARCHIVADA' : '✅ VISIBLE EN PERFILES'
          });
        } else {
          console.log('❌ NATALIA NO ENCONTRADA en la base de datos');
        }
        
        if (xiomara) {
          console.log('🔍 DEBUG - XIOMARA:', {
            nombre: xiomara.nombreArtistico,
            email: xiomara.email,
            activa: xiomara.activa,
            disponible: xiomara.disponible,
            fechaArchivado: xiomara.fechaArchivado,
            estado: xiomara.fechaArchivado ? '📦 ARCHIVADA' : '✅ VISIBLE EN PERFILES'
          });
        } else {
          console.log('❌ XIOMARA NO ENCONTRADA en la base de datos');
        }
      } else {
        console.log('⚠️ No se encontraron modelos en la base de datos');
        setModelos([]);
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando modelos:', error);
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
    if (!modelo) {
      console.error('❌ Modelo no encontrada');
      return;
    }

    try {
      console.log(`🗑️ Eliminando modelo: ${modelo.email}`);
      
      // 1. Eliminar de la tabla usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (dbError) {
        console.error('❌ Error eliminando de tabla usuarios:', dbError);
        throw dbError;
      }

      // 2. Eliminar de Auth (requiere admin)
      // Nota: La eliminación de Auth debe hacerse desde el servidor
      // Por ahora solo eliminamos de la tabla
      
      // 3. Actualizar estado local
      setModelos(prev => prev.filter(m => m.id !== id));
      console.log(`✅ Modelo eliminada: ${modelo.email}`);
      
    } catch (error) {
      console.error('❌ Error eliminando modelo:', error);
      throw error;
    }
  };

  const archivarModelo = async (id: number, motivo?: string) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) {
      console.error('❌ Modelo no encontrada');
      return;
    }

    try {
      console.log(`📦 Archivando modelo: ${modelo.email}`);
      
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
        console.error('❌ Error archivando en BD:', dbError);
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
      
      console.log(`✅ Modelo archivada: ${modelo.email}`);
      
    } catch (error) {
      console.error('❌ Error archivando modelo:', error);
      throw error;
    }
  };

  const restaurarModelo = async (id: number) => {
    try {
      const modelo = modelosArchivadas.find(m => m.id === id);
      if (!modelo) {
        console.error('❌ Modelo no encontrada en archivadas');
        return;
      }

      console.log(`🔄 Restaurando modelo: ${modelo.email}`);

      // 1. Actualizar en Supabase - Remover campos de archivado
      const { error } = await supabase
        .from('usuarios')
        .update({
          estado: 'activo', // Cambiar estado a activo
          fecha_archivado: null, // ✅ Limpiar fecha de archivado (snake_case)
          motivo_archivo: null, // ✅ Limpiar motivo (snake_case)
        })
        .eq('email', modelo.email)
        .eq('role', 'modelo');

      if (error) {
        console.error('❌ Error al restaurar modelo en BD:', error);
        throw error;
      }

      // 2. Actualizar estado local
      const { fechaArchivado, motivoArchivo, ...modeloRestaurado } = modelo;
      setModelos(prev => [...prev, { ...modeloRestaurado, activa: true }]);
      setModelosArchivadas(prev => prev.filter(m => m.id !== id));
      
      console.log(`✅ Modelo restaurada: ${modelo.email}`);
      
    } catch (error) {
      console.error('❌ Error al restaurar modelo:', error);
      throw error;
    }
  };

  const actualizarModelo = async (id: number, datos: Partial<Modelo>) => {
    const modelo = modelos.find(m => m.id === id);
    if (!modelo) {
      console.error('❌ Modelo no encontrada');
      return;
    }

    try {
      console.log(`📝 Actualizando modelo: ${modelo.email}`);
      console.log('🔍 DEBUG - Datos recibidos para actualizar:', datos);
      
      // Obtener sesión actual para usar el token del admin autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No hay sesión activa. Debes estar autenticado como admin para editar modelos.');
        throw new Error('No hay sesión activa');
      }
      
      console.log('🔍 DEBUG - Usuario autenticado:', session.user.email);
      console.log('🔍 DEBUG - Access token presente:', !!session.access_token);

      // ✅ PASO 1: Obtener el usuario de Auth para tener su ID
      const { data: usuarioDB } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', modelo.email)
        .eq('role', 'modelo')
        .single();

      if (!usuarioDB) {
        console.error('❌ No se encontró el usuario en BD');
        throw new Error('Usuario no encontrado en BD');
      }

      const authUserId = usuarioDB.id;
      console.log('🔍 Auth User ID:', authUserId);

      // ✅ PASO 2: Actualizar Auth si cambia email o contraseña
      const cambioEmail = datos.email && datos.email !== modelo.email;
      const cambioPassword = datos.password && datos.password !== modelo.password;

      if (cambioEmail || cambioPassword) {
        console.log('🔐 Actualizando credenciales en Auth...');
        
        const authUpdateData: any = {};
        if (cambioEmail) {
          authUpdateData.email = datos.email;
          console.log('📧 Cambiando email a:', datos.email);
        }
        if (cambioPassword) {
          authUpdateData.password = datos.password;
          console.log('🔑 Cambiando contraseña');
        }

        const { error: authError } = await supabase.auth.admin.updateUserById(
          authUserId,
          authUpdateData
        );

        if (authError) {
          console.error('❌ Error actualizando Auth:', authError);
          throw authError;
        }

        console.log('✅ Auth actualizado correctamente');
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
      // ❌ Removido: documentoFrente y documentoReverso no existen en la tabla
      // if (datos.documentoFrente !== undefined) datosSupabase.documentoFrente = datos.documentoFrente;
      // if (datos.documentoReverso !== undefined) datosSupabase.documentoReverso = datos.documentoReverso;
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
      
      console.log('🔍 DEBUG - Datos que se enviarán a Supabase:', datosSupabase);
      console.log('🔍 DEBUG - Filtrando por ID:', authUserId);
      
      // ✅ PASO 4: Actualizar en BD usando ID (más seguro que email)
      const { data: resultData, error: dbError } = await supabase
        .from('usuarios')
        .update(datosSupabase)
        .eq('id', authUserId)
        .eq('role', 'modelo')
        .select(); // ⚡ AGREGADO: select() para retornar los datos actualizados

      console.log('🔍 DEBUG - Respuesta de Supabase:', { data: resultData, error: dbError });

      if (dbError) {
        console.error('❌ Error actualizando en BD:', dbError);
        throw dbError;
      }

      if (!resultData || resultData.length === 0) {
        console.error('⚠️ ADVERTENCIA: La actualización no afectó ninguna fila');
        console.error('🔍 Verifica que existe un usuario con ID:', authUserId, 'y role: modelo');
      } else {
        console.log('✅ Datos actualizados en BD:', resultData);
      }

      // Actualizar estado local
      setModelos(prev => prev.map(m => (m.id === id ? { ...m, ...datos } : m)));
      console.log(`✅ Modelo actualizada: ${datos.email || modelo.email}`);
      
    } catch (error) {
      console.error('❌ Error actualizando modelo:', error);
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
    // Silencioso durante hot-reload - retornar valores por defecto seguros
    return {
      modelos: [],
      modelosArchivadas: [],
      agregarModelo: () => {},
      eliminarModelo: async () => {},
      archivarModelo: async () => {},
      restaurarModelo: async () => {},
      actualizarModelo: async () => {},
      obtenerModeloPorEmail: () => undefined,
      validarCredenciales: () => null,
      recargarModelos: async () => {},
    };
  }
  return context;
}