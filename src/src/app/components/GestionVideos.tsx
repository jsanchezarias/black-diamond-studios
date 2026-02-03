import { useState } from 'react';
import { useVideos } from './VideosContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Video as VideoIcon, 
  Eye, 
  EyeOff,
  GripVertical,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

export function GestionVideos() {
  const { videos, videosActivos, cargando, agregarVideo, actualizarVideo, eliminarVideo, subirArchivoVideo, reordenarVideos } = useVideos();
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [videoEditando, setVideoEditando] = useState<string | null>(null);
  const [videoVisualizando, setVideoVisualizando] = useState<string | null>(null);
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivoVideo, setArchivoVideo] = useState<File | null>(null);
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [subiendo, setSubiendo] = useState(false);

  // ============================================
  // 📤 SUBIR NUEVO VIDEO
  // ============================================
  const handleSubirVideo = async () => {
    if (!titulo.trim()) {
      toast.error('Por favor ingresa un título');
      return;
    }

    if (!archivoVideo) {
      toast.error('Por favor selecciona un video');
      return;
    }

    try {
      setSubiendo(true);
      setProgresoSubida(0);

      // Subir archivo
      const url = await subirArchivoVideo(archivoVideo, (progress) => {
        setProgresoSubida(progress);
      });

      // Obtener path relativo del storage
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Crear video en la base de datos
      await agregarVideo({
        titulo,
        descripcion: descripcion || undefined,
        url,
        urlStorage: fileName,
        orden: videos.length,
        activo: true
      });

      // Limpiar formulario
      setTitulo('');
      setDescripcion('');
      setArchivoVideo(null);
      setProgresoSubida(0);
      setMostrarFormulario(false);
      toast.success('Video agregado exitosamente');
    } catch (error: any) {
      console.error('Error al subir video:', error);
      toast.error(error.message || 'Error al subir el video');
    } finally {
      setSubiendo(false);
    }
  };

  // ============================================
  // ✏️ EDITAR VIDEO
  // ============================================
  const handleEditarVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const nuevoTitulo = prompt('Nuevo título:', video.titulo);
    if (nuevoTitulo && nuevoTitulo.trim()) {
      await actualizarVideo(videoId, { titulo: nuevoTitulo.trim() });
    }
  };

  const handleEditarDescripcion = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const nuevaDescripcion = prompt('Nueva descripción:', video.descripcion || '');
    if (nuevaDescripcion !== null) {
      await actualizarVideo(videoId, { descripcion: nuevaDescripcion.trim() || undefined });
    }
  };

  // ============================================
  // 🔄 TOGGLE ACTIVO
  // ============================================
  const handleToggleActivo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    await actualizarVideo(videoId, { activo: !video.activo });
  };

  // ============================================
  // 🗑️ ELIMINAR VIDEO
  // ============================================
  const handleEliminarVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el video "${video.titulo}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmar) {
      await eliminarVideo(videoId);
    }
  };

  // ============================================
  // 📁 SELECCIONAR ARCHIVO
  // ============================================
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea video
      if (!file.type.startsWith('video/')) {
        toast.error('Por favor selecciona un archivo de video');
        return;
      }

      // Validar tamaño (max 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('El video no debe superar los 100MB');
        return;
      }

      setArchivoVideo(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <VideoIcon className="w-8 h-8 text-primary" />
            Gestión de Videos
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los videos que se reproducen en la página principal
          </p>
        </div>

        <Button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <Upload className="w-4 h-4" />
          Subir Video
        </Button>
      </div>

      {/* Formulario de subida */}
      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Subir Nuevo Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Video Promocional Black Diamond"
                    disabled={subiendo}
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del video..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background resize-none"
                    disabled={subiendo}
                  />
                </div>

                {/* Seleccionar archivo */}
                <div className="space-y-2">
                  <Label htmlFor="video">Archivo de Video *</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="video"
                      className="flex-1 px-4 py-8 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-primary/5"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {archivoVideo ? (
                            <span className="text-primary font-medium">{archivoVideo.name}</span>
                          ) : (
                            <>
                              Haz clic para seleccionar un video
                              <br />
                              <span className="text-xs">(Máx. 100MB, formatos: MP4, WebM, MOV)</span>
                            </>
                          )}
                        </p>
                      </div>
                      <input
                        id="video"
                        type="file"
                        accept="video/*"
                        onChange={handleSeleccionarArchivo}
                        className="hidden"
                        disabled={subiendo}
                      />
                    </label>
                  </div>
                </div>

                {/* Barra de progreso */}
                {subiendo && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subiendo...</span>
                      <span className="text-primary font-medium">{progresoSubida}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progresoSubida}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubirVideo}
                    disabled={subiendo || !titulo.trim() || !archivoVideo}
                    className="flex-1"
                  >
                    {subiendo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Subir Video
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setTitulo('');
                      setDescripcion('');
                      setArchivoVideo(null);
                    }}
                    disabled={subiendo}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de videos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Videos ({videos.length})</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/50 text-green-500">
              {videosActivos.length} Activos
            </Badge>
            <Badge variant="outline" className="border-gray-500/50 text-gray-500">
              {videos.length - videosActivos.length} Inactivos
            </Badge>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Cargando videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <VideoIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No hay videos subidos</p>
              <p className="text-sm text-muted-foreground">
                Haz clic en "Subir Video" para agregar tu primer video
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {videos.map((video, index) => (
              <Card 
                key={video.id}
                className={`border transition-all ${
                  video.activo 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border opacity-70'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail del video */}
                    <div className="relative w-40 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setVideoVisualizando(videoVisualizando === video.id ? null : video.id)}
                          className="hover:bg-white/20"
                        >
                          {videoVisualizando === video.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Información del video */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate">{video.titulo}</h4>
                          {video.descripcion && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{video.descripcion}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={video.activo ? 'default' : 'outline'}>
                            {video.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActivo(video.id)}
                          className="gap-2"
                        >
                          {video.activo ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Activar
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditarVideo(video.id)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEliminarVideo(video.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Vista previa expandida */}
                  <AnimatePresence>
                    {videoVisualizando === video.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <video
                          src={video.url}
                          controls
                          autoPlay
                          className="w-full max-h-[400px] rounded-lg bg-black"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}