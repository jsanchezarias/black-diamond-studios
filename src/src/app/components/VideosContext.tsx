import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta
import { toast } from 'sonner@2.0.3';

// ============================================
// 🎥 TIPOS Y INTERFACES
// ============================================

export interface Video {
  id: string;
  titulo: string;
  descripcion?: string;
  url: string;
  urlStorage: string; // Path en Supabase Storage
  duracion?: number;
  orden: number;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

interface VideosContextType {
  videos: Video[];
  videosActivos: Video[];
  cargando: boolean;
  cargarVideos: () => Promise<void>;
  agregarVideo: (video: Omit<Video, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => Promise<Video>;
  actualizarVideo: (id: string, data: Partial<Video>) => Promise<void>;
  eliminarVideo: (id: string) => Promise<void>;
  subirArchivoVideo: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  reordenarVideos: (videos: Video[]) => Promise<void>;
}

const VideosContext = createContext<VideosContextType | undefined>(undefined);

// ============================================
// 🎯 PROVIDER
// ============================================

const BUCKET_NAME = 'make-9dadc017-videos';
const KV_PREFIX = 'video:';

export function VideosProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [cargando, setCargando] = useState(true);

  // Videos activos ordenados
  const videosActivos = videos
    .filter(v => v.activo)
    .sort((a, b) => a.orden - b.orden);

  // ============================================
  // 📥 CARGAR VIDEOS
  // ============================================
  const cargarVideos = async () => {
    try {
      setCargando(true);
      
      // Obtener todos los videos del KV Store
      const { data, error } = await supabase
        .from('kv_store_9dadc017')
        .select('key, value')
        .like('key', `${KV_PREFIX}%`);

      if (error) throw error;

      const videosData = (data || [])
        .map(item => {
          try {
            const video = JSON.parse(item.value);
            return {
              ...video,
              fechaCreacion: new Date(video.fechaCreacion),
              fechaActualizacion: new Date(video.fechaActualizacion)
            };
          } catch {
            return null;
          }
        })
        .filter((v): v is Video => v !== null)
        .sort((a, b) => a.orden - b.orden);

      setVideos(videosData);
    } catch (error: any) {
      console.error('Error al cargar videos:', error);
      console.warn('⚠️ Usando MODO FALLBACK - Sin videos iniciales');
      setVideos([]);
      // NO mostrar toast de error al cargar inicialmente
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // ➕ AGREGAR VIDEO
  // ============================================
  const agregarVideo = async (videoData: Omit<Video, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Video> => {
    try {
      const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ahora = new Date();

      const nuevoVideo: Video = {
        ...videoData,
        id,
        fechaCreacion: ahora,
        fechaActualizacion: ahora
      };

      // Guardar en KV Store
      const { error } = await supabase
        .from('kv_store_9dadc017')
        .insert({
          key: `${KV_PREFIX}${id}`,
          value: JSON.stringify(nuevoVideo)
        });

      if (error) throw error;

      setVideos(prev => [...prev, nuevoVideo]);
      toast.success('Video agregado exitosamente');

      return nuevoVideo;
    } catch (error: any) {
      console.error('Error al agregar video:', error);
      toast.error('Error al agregar el video');
      throw error;
    }
  };

  // ============================================
  // ✏️ ACTUALIZAR VIDEO
  // ============================================
  const actualizarVideo = async (id: string, data: Partial<Video>) => {
    try {
      const videoActual = videos.find(v => v.id === id);
      if (!videoActual) throw new Error('Video no encontrado');

      const videoActualizado: Video = {
        ...videoActual,
        ...data,
        fechaActualizacion: new Date()
      };

      const { error } = await supabase
        .from('kv_store_9dadc017')
        .update({
          value: JSON.stringify(videoActualizado)
        })
        .eq('key', `${KV_PREFIX}${id}`);

      if (error) throw error;

      setVideos(prev => prev.map(v => v.id === id ? videoActualizado : v));
      toast.success('Video actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar video:', error);
      toast.error('Error al actualizar el video');
      throw error;
    }
  };

  // ============================================
  // 🗑️ ELIMINAR VIDEO
  // ============================================
  const eliminarVideo = async (id: string) => {
    try {
      const video = videos.find(v => v.id === id);
      if (!video) throw new Error('Video no encontrado');

      // Eliminar archivo de Storage
      if (video.urlStorage) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([video.urlStorage]);

        if (storageError) {
          console.error('Error al eliminar archivo de storage:', storageError);
        }
      }

      // Eliminar de KV Store
      const { error } = await supabase
        .from('kv_store_9dadc017')
        .delete()
        .eq('key', `${KV_PREFIX}${id}`);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success('Video eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar video:', error);
      toast.error('Error al eliminar el video');
      throw error;
    }
  };

  // ============================================
  // 📤 SUBIR ARCHIVO DE VIDEO
  // ============================================
  const subirArchivoVideo = async (
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      // Validar que sea un video
      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video');
      }

      // Validar tamaño (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('El video no debe superar los 100MB');
      }

      // Crear bucket si no existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true
        });
        if (createError) throw createError;
      }

      // Generar nombre único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `video_${timestamp}.${extension}`;

      // Subir archivo
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      if (onProgress) onProgress(100);

      return publicUrl;
    } catch (error: any) {
      console.error('Error al subir video:', error);
      toast.error(error.message || 'Error al subir el video');
      throw error;
    }
  };

  // ============================================
  // 🔄 REORDENAR VIDEOS
  // ============================================
  const reordenarVideos = async (videosReordenados: Video[]) => {
    try {
      // Actualizar orden de cada video
      const promises = videosReordenados.map((video, index) => {
        const videoActualizado = {
          ...video,
          orden: index,
          fechaActualizacion: new Date()
        };

        return supabase
          .from('kv_store_9dadc017')
          .update({
            value: JSON.stringify(videoActualizado)
          })
          .eq('key', `${KV_PREFIX}${video.id}`);
      });

      await Promise.all(promises);

      setVideos(videosReordenados.map((v, i) => ({ ...v, orden: i })));
      toast.success('Orden actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al reordenar videos:', error);
      toast.error('Error al reordenar los videos');
      throw error;
    }
  };

  // ============================================
  // 🚀 INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    cargarVideos();
  }, []);

  return (
    <VideosContext.Provider
      value={{
        videos,
        videosActivos,
        cargando,
        cargarVideos,
        agregarVideo,
        actualizarVideo,
        eliminarVideo,
        subirArchivoVideo,
        reordenarVideos
      }}
    >
      {children}
    </VideosContext.Provider>
  );
}

// ============================================
// 🪝 HOOK PERSONALIZADO
// ============================================

export function useVideos() {
  const context = useContext(VideosContext);
  if (!context) {
    throw new Error('useVideos debe usarse dentro de VideosProvider');
  }
  return context;
}